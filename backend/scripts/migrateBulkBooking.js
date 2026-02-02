const db = require('../config/database');
require('dotenv').config();

async function ensureColumn(table, column, alterSql) {
  const [columns] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (columns.length === 0) {
    await db.query(`ALTER TABLE \`${table}\` ${alterSql}`);
    console.log(`✓ Added column ${column} to ${table}`);
  } else {
    console.log(`• Column ${column} already exists on ${table}`);
  }
}

async function ensureTable(table, createSql) {
  const [tables] = await db.query('SHOW TABLES LIKE ?', [table]);
  if (tables.length === 0) {
    await db.query(createSql);
    console.log(`✓ Created table ${table}`);
  } else {
    console.log(`• Table ${table} already exists`);
  }
}

async function run() {
  try {
    console.log('Running bulk booking migration checks...');

    await ensureColumn('bookings', 'is_bulk_booking', 'ADD COLUMN is_bulk_booking BOOLEAN DEFAULT FALSE AFTER status');
    await ensureColumn('bookings', 'total_price', 'ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0 AFTER is_bulk_booking');
    await ensureColumn('bookings', 'total_duration', 'ADD COLUMN total_duration INT DEFAULT 0 AFTER total_price');
    await ensureColumn('bookings', 'updated_at', 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

    const bookingServicesSql = `
      CREATE TABLE booking_services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_id INT NOT NULL,
        service_id INT NOT NULL,
        price_at_booking DECIMAL(10, 2) NOT NULL,
        duration_at_booking INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_booking_service (booking_id),
        INDEX idx_service_booking (service_id)
      ) ENGINE=InnoDB;
    `;

    await ensureTable('booking_services', bookingServicesSql);

    console.log('Bulk booking migration complete.');
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    await db.end();
    process.exit(1);
  }
}

run();
