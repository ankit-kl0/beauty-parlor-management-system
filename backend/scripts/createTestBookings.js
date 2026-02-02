const db = require('../config/database');
require('dotenv').config();

async function createTestBookings() {
  try {
    console.log('Creating test bookings for admin testing...');

    // Get admin user
    const [adminUsers] = await db.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );

    if (adminUsers.length === 0) {
      console.log('No admin user found. Please run createAdmin.js first.');
      process.exit(1);
    }

    const adminId = adminUsers[0].id;

    // Get first service
    const [services] = await db.execute(
      'SELECT id FROM services LIMIT 1'
    );

    if (services.length === 0) {
      console.log('No services found. Please add services first.');
      process.exit(1);
    }

    const serviceId = services[0].id;

    // Create test bookings with different statuses
    const testBookings = [
      {
        user_id: adminId,
        service_id: serviceId,
        booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        time_slot: '10:00:00',
        status: 'PENDING'
      },
      {
        user_id: adminId,
        service_id: serviceId,
        booking_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        time_slot: '14:00:00',
        status: 'CONFIRMED'
      },
      {
        user_id: adminId,
        service_id: serviceId,
        booking_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        time_slot: '16:00:00',
        status: 'CANCEL_REQUESTED'
      }
    ];

    for (const booking of testBookings) {
      // Check if booking already exists
      const [existing] = await db.execute(
        'SELECT id FROM bookings WHERE user_id = ? AND service_id = ? AND booking_date = ? AND time_slot = ?',
        [booking.user_id, booking.service_id, booking.booking_date, booking.time_slot]
      );

      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO bookings (user_id, service_id, booking_date, time_slot, status) VALUES (?, ?, ?, ?, ?)',
          [booking.user_id, booking.service_id, booking.booking_date, booking.time_slot, booking.status]
        );
        console.log(`✅ Created ${booking.status} booking for ${booking.booking_date} at ${booking.time_slot}`);
      } else {
        console.log(`⚠️ Booking already exists for ${booking.booking_date} at ${booking.time_slot}`);
      }
    }

    console.log('\n🎉 Test bookings created successfully!');
    console.log('You can now test booking management in the admin dashboard.');
    console.log('\nExpected actions:');
    console.log('- PENDING bookings: Confirm (green) or Reject (red)');
    console.log('- CONFIRMED bookings: Mark Completed (blue) or Cancel (red)');
    console.log('- CANCEL_REQUESTED bookings: Approve Cancellation (orange) or Reject Request (green)');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test bookings:', error);
    process.exit(1);
  }
}

createTestBookings();