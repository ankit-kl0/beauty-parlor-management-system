const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// Create booking (single or bulk)
router.post('/', authenticate, [
  body('services').optional().isArray({ min: 1 }).withMessage('At least one service required'),
  body('services.*.service_id').optional().isInt().withMessage('Valid service ID required'),
  body('service_id').optional().isInt().withMessage('Valid service ID required'),
  body('booking_date').isISO8601().withMessage('Valid booking date required'),
  body('time_slot').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Valid time slot required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { services, service_id, booking_date, time_slot, stylist_id } = req.body;
    const user_id = req.user.id;

    // Determine if this is a bulk booking
    const isBulkBooking = services && services.length > 1;
    const serviceList = services || [{ service_id }];

    // Calculate total price and duration for bulk bookings
    let total_price = 0;
    let total_duration = 0;

    // Validate all services exist and calculate totals
    for (const serviceItem of serviceList) {
      const [service] = await db.execute(
        'SELECT id, name, price_npr, duration FROM services WHERE id = ?',
        [serviceItem.service_id]
      );

      if (service.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Service with ID ${serviceItem.service_id} not found`
        });
      }

      total_price += parseFloat(service[0].price_npr);
      total_duration += service[0].duration;
    }

    // Check availability for each service
    for (const serviceItem of serviceList) {
      // Check if slot is available for this service
      const [availability] = await db.execute(
        'SELECT * FROM availability WHERE service_id = ? AND date = ? AND time_slot = ? AND is_available = TRUE',
        [serviceItem.service_id, booking_date, time_slot]
      );

      if (availability.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Time slot not available for service: ${serviceItem.service_id}`
        });
      }

      // Check for existing CONFIRMED or PENDING booking for this service at this time
      const [existing] = await db.execute(
        'SELECT id FROM bookings WHERE service_id = ? AND booking_date = ? AND time_slot = ? AND status IN ("CONFIRMED", "PENDING")',
        [serviceItem.service_id, booking_date, time_slot]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Time slot already booked for service: ${serviceItem.service_id}`
        });
      }
    }

    // Create booking with PENDING status (REQUIRES admin confirmation - DO NOT mark slot unavailable yet)
    const [result] = await db.execute(
      'INSERT INTO bookings (user_id, service_id, stylist_id, booking_date, time_slot, status, is_bulk_booking, total_price, total_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, serviceList[0].service_id, stylist_id || null, booking_date, time_slot, 'PENDING', isBulkBooking, total_price, total_duration]
    );

    const bookingId = result.insertId;

    // Insert all services into booking_services table
    for (const serviceItem of serviceList) {
      const [service] = await db.execute(
        'SELECT price_npr, duration FROM services WHERE id = ?',
        [serviceItem.service_id]
      );

      await db.execute(
        'INSERT INTO booking_services (booking_id, service_id, price_at_booking, duration_at_booking) VALUES (?, ?, ?, ?)',
        [bookingId, serviceItem.service_id, service[0].price_npr, service[0].duration]
      );
    }

    // DO NOT mark slot as unavailable - wait for admin confirmation

    // Fetch complete booking details with all services
    const [booking] = await db.execute(
      `SELECT b.*, u.name as user_name, u.email as user_email,
              GROUP_CONCAT(s.name SEPARATOR ', ') as service_names,
              GROUP_CONCAT(s.price_npr SEPARATOR ', ') as service_prices,
              GROUP_CONCAT(s.duration SEPARATOR ', ') as service_durations
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN booking_services bs ON b.id = bs.booking_id
       JOIN services s ON bs.service_id = s.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [bookingId]
    );

    res.status(201).json({ success: true, data: booking[0] });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
});

// Get user bookings
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      `SELECT b.*,
              GROUP_CONCAT(s.name SEPARATOR ', ') as service_names,
              GROUP_CONCAT(s.description SEPARATOR ' | ') as service_descriptions,
              GROUP_CONCAT(bs.price_at_booking SEPARATOR ', ') as service_prices,
              GROUP_CONCAT(bs.duration_at_booking SEPARATOR ', ') as service_durations,
              st.name as stylist_name
       FROM bookings b
       LEFT JOIN booking_services bs ON b.id = bs.booking_id
       LEFT JOIN services s ON bs.service_id = s.id
       LEFT JOIN staff st ON b.stylist_id = st.id
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.booking_date DESC, b.time_slot DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Get booking
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Check if booking is in the future
    const bookingDateTime = new Date(`${booking.booking_date} ${booking.time_slot}`);
    if (bookingDateTime <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel past bookings' 
      });
    }

    const { cancellation_reason } = req.body;

    // Request cancellation (admin must approve) - only if status is PENDING or CONFIRMED
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot request cancellation for this booking status' 
      });
    }

    await db.execute(
      'UPDATE bookings SET status = "CANCEL_REQUESTED", cancellation_requested_at = NOW(), cancellation_reason = ? WHERE id = ?',
      [cancellation_reason || null, bookingId]
    );

    res.json({ success: true, message: 'Cancellation request submitted. Waiting for admin approval.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling booking' });
  }
});

// Admin: Update booking status (ONLY ADMIN CAN CHANGE STATUS)
router.put('/:id/status', authenticate, authorizeAdmin, [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'CANCEL_REQUESTED', 'COMPLETED'])
    .withMessage('Invalid status. Must be one of: PENDING, CONFIRMED, CANCELLED, CANCEL_REQUESTED, COMPLETED'),
  body('stylist_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Stylist ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { status, stylist_id } = req.body;
    const bookingId = req.params.id;

    console.log(`Updating booking ${bookingId} to status: ${status}`);

    // Get booking
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];
    const updates = ['status = ?'];
    const values = [status];

    if (stylist_id !== undefined) {
      updates.push('stylist_id = ?');
      values.push(stylist_id);
    }

    // Get all services for this booking (handle bulk bookings)
    let serviceIds = [];
    if (booking.is_bulk_booking) {
      const [bookingServices] = await db.execute(
        'SELECT service_id FROM booking_services WHERE booking_id = ?',
        [bookingId]
      );
      serviceIds = bookingServices.map(bs => bs.service_id);
    } else {
      serviceIds = [booking.service_id];
    }

    // Update availability based on status change
    if (status === 'CANCELLED') {
      // Mark slots as available for all services
      for (const serviceId of serviceIds) {
        await db.execute(
          'UPDATE availability SET is_available = TRUE WHERE service_id = ? AND date = ? AND time_slot = ?',
          [serviceId, booking.booking_date, booking.time_slot]
        );
      }
    }

    // If confirming PENDING booking, mark slots as unavailable for all services
    if (status === 'CONFIRMED' && booking.status === 'PENDING') {
      for (const serviceId of serviceIds) {
        await db.execute(
          'UPDATE availability SET is_available = FALSE WHERE service_id = ? AND date = ? AND time_slot = ?',
          [serviceId, booking.booking_date, booking.time_slot]
        );
      }
    }

    // If approving cancellation request, mark slots as available
    if (status === 'CANCELLED' && booking.status === 'CANCEL_REQUESTED') {
      for (const serviceId of serviceIds) {
        await db.execute(
          'UPDATE availability SET is_available = TRUE WHERE service_id = ? AND date = ? AND time_slot = ?',
          [serviceId, booking.booking_date, booking.time_slot]
        );
      }
    }

    values.push(bookingId);
    await db.execute(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated booking
    const [updated] = await db.execute(
      `SELECT b.*,
              GROUP_CONCAT(s.name SEPARATOR ', ') as service_names,
              MAX(CASE WHEN b.is_bulk_booking THEN b.total_price ELSE s.price_npr END) as price_npr,
              u.name as user_name, u.email as user_email,
              st.name as stylist_name
       FROM bookings b
       LEFT JOIN booking_services bs ON b.id = bs.booking_id AND b.is_bulk_booking = TRUE
       LEFT JOIN services s ON IFNULL(bs.service_id, b.service_id) = s.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN staff st ON b.stylist_id = st.id
       WHERE b.id = ?
       GROUP BY b.id`,
      [bookingId]
    );

    res.json({ success: true, message: 'Booking updated', booking: updated[0] });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Error updating booking status', error: error.message });
  }
});

module.exports = router;

