const db = require('../config/database');

async function fixBookingStatus() {
  try {
    console.log('Updating booking status enum to match code expectations...');

    // Update the status column enum
    await db.execute(`
      ALTER TABLE bookings
      MODIFY COLUMN status ENUM('PENDING','CONFIRMED','CANCEL_REQUESTED','CANCELLED','COMPLETED')
      DEFAULT 'PENDING'
    `);

    console.log('✅ Successfully updated booking status enum');
    console.log('Now the database matches the frontend code expectations.');

    process.exit(0);
  } catch (error) {
    console.error('Error updating booking status:', error);
    process.exit(1);
  }
}

fixBookingStatus();