const express = require('express');
const db = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // Total bookings
    const [totalBookings] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings'
    );

    // Upcoming appointments
    const [upcoming] = await db.execute(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE status = 'CONFIRMED' AND booking_date >= CURDATE()`
    );

    // Cancelled appointments
    const [cancelled] = await db.execute(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE status = 'CANCELLED'`
    );

    // Recent bookings
    const [recentBookings] = await db.execute(
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
       GROUP BY b.id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totalBookings: totalBookings[0].count,
        upcomingAppointments: upcoming[0].count,
        cancelledAppointments: cancelled[0].count,
        recentBookings: recentBookings
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

// Get all appointments
router.get('/appointments', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    let query = `SELECT b.*,
                        GROUP_CONCAT(s.name SEPARATOR ', ') as service_names,
                        MAX(CASE WHEN b.is_bulk_booking THEN b.total_price ELSE s.price_npr END) as price_npr,
                        MAX(CASE WHEN b.is_bulk_booking THEN b.total_duration ELSE s.duration END) as duration,
                        u.name as user_name, u.email as user_email,
                        st.name as stylist_name
                 FROM bookings b
                 LEFT JOIN booking_services bs ON b.id = bs.booking_id AND b.is_bulk_booking = TRUE
                 LEFT JOIN services s ON IFNULL(bs.service_id, b.service_id) = s.id
                 JOIN users u ON b.user_id = u.id
                 LEFT JOIN staff st ON b.stylist_id = st.id`;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (date) {
      conditions.push('b.booking_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY b.id ORDER BY b.booking_date DESC, b.time_slot DESC';

    const [appointments] = await db.execute(query, params);
    
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

// Get booking history
router.get('/booking-history', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [bookings] = await db.execute(
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
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching booking history' });
  }
});

module.exports = router;

