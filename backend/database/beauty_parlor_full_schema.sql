-- Beauty Parlor Management System - Unified Schema and Seed Data
-- Run this script once to recreate the full database (core, staff, ecommerce, and seed data)

DROP DATABASE IF EXISTS beauty_parlor;
CREATE DATABASE IF NOT EXISTS beauty_parlor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beauty_parlor;

-- Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed: default admin and sample user
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@beautyparlor.com', '$2a$10$mhZ/dLo.OSeYZmh6qZFgGe8wpz99.YX9scG88yxX3OIXJIg.UKHNi', 'admin'),
('Jane Customer', 'jane@example.com', '$2a$10$w5Q/CGdCkQGqhJ97637l0OIPkF0AwduGlsI7.OXdBqMk9np9SDate', 'user');

-- Services
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'General',
    price_npr DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(200),
    experience_years INT DEFAULT 0,
    bio TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Staff Working Hours
CREATE TABLE staff_working_hours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_day (staff_id, day_of_week)
);

-- Availability
CREATE TABLE availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_slot (service_id, date, time_slot)
);

-- Bookings
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    stylist_id INT NULL,
    booking_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status ENUM('PENDING','CONFIRMED','CANCEL_REQUESTED','CANCELLED','COMPLETED') DEFAULT 'PENDING',
    is_bulk_booking BOOLEAN DEFAULT FALSE,
    total_price DECIMAL(10, 2) DEFAULT 0,
    total_duration INT DEFAULT 0,
    cancellation_requested_at TIMESTAMP NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (stylist_id) REFERENCES staff(id) ON DELETE SET NULL,
    UNIQUE KEY unique_booking (service_id, booking_date, time_slot, status),
    INDEX idx_user (user_id),
    INDEX idx_date (booking_date)
);

-- Booking services (supports bulk bookings)
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
);

-- Contact Messages
CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    booking_id INT NULL,
    service_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_feedback_user (user_id),
    INDEX idx_feedback_service (service_id)
);

-- Product Categories
CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_npr DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    INDEX idx_product_category (category_id),
    INDEX idx_product_active (is_active)
);

-- Shopping Cart
CREATE TABLE shopping_cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_cart (user_id)
);

-- Cart Items
CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- Orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PENDING',
    payment_method VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
    payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') DEFAULT 'PENDING',
    shipping_name VARCHAR(100) NOT NULL,
    shipping_email VARCHAR(100),
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    order_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
);

-- Order Items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Seed: Services with categories and image URLs
INSERT INTO services (name, description, category, price_npr, duration, image_url) VALUES
('Haircut', 'Professional haircut and styling', 'Hair Services', 500.00, 30, 'https://plus.unsplash.com/premium_photo-1664048713117-cee94e5048a0?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Hair Color', 'Full hair coloring service', 'Hair Services', 2500.00, 120, 'https://images.unsplash.com/photo-1707979577466-2d6109c68a45?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Facial', 'Deep cleansing facial treatment', 'Facial & Skincare', 1500.00, 60, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400'),
('Manicure', 'Nail care and polish', 'Nail Services', 800.00, 45, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'),
('Pedicure', 'Foot care and polish', 'Nail Services', 1000.00, 60, 'https://plus.unsplash.com/premium_photo-1680348266597-6d89a08d12d7?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Hair Spa', 'Relaxing hair spa treatment', 'Hair Services', 2000.00, 90, 'https://plus.unsplash.com/premium_photo-1664475130052-f58aaf58854e?q=80&w=1744&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Bridal Makeup', 'Complete bridal makeup package', 'Makeup', 5000.00, 180, 'https://plus.unsplash.com/premium_photo-1724762178439-1f93ad3f3cb6?q=80&w=1608&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
('Threading', 'Facial threading service', 'Facial & Skincare', 300.00, 20, 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');

-- Seed: Staff roster
INSERT INTO staff (name, email, phone, specialization, experience_years, bio, image_url) VALUES
('Priya Sharma', 'priya@sujitabeautyparlour.com', '+977-9841234567', 'Hair Styling, Hair Color', 8, 'Expert hair stylist with 8 years of experience', NULL),
('Sita Thapa', 'sita@sujitabeautyparlour.com', '+977-9841234568', 'Facial, Skincare', 6, 'Certified facial specialist', NULL),
('Rita Gurung', 'rita@sujitabeautyparlour.com', '+977-9841234569', 'Nail Art, Manicure, Pedicure', 5, 'Creative nail artist', NULL),
('Maya Tamang', 'maya@sujitabeautyparlour.com', '+977-9841234570', 'Bridal Makeup, Party Makeup', 7, 'Professional makeup artist', NULL);

-- Seed: Staff working hours (Mon-Sat, 09:00-18:00)
INSERT INTO staff_working_hours (staff_id, day_of_week, start_time, end_time)
SELECT id, day, '09:00:00', '18:00:00'
FROM staff
CROSS JOIN (
    SELECT 'Monday' AS day UNION ALL
    SELECT 'Tuesday' UNION ALL
    SELECT 'Wednesday' UNION ALL
    SELECT 'Thursday' UNION ALL
    SELECT 'Friday' UNION ALL
    SELECT 'Saturday'
) AS days;

-- Seed: Sample availability slots (next 2 days, morning + afternoon)
INSERT INTO availability (service_id, date, time_slot, is_available) VALUES
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', TRUE),
(1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', TRUE),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', TRUE),
(2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', TRUE),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', TRUE),
(3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', TRUE),
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', TRUE),
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', TRUE),
(5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00', TRUE),
(5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', TRUE),
(6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00', TRUE),
(6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:30:00', TRUE),
(7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', TRUE),
(7, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:30:00', TRUE),
(8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', TRUE),
(8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:30:00', TRUE),
(1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', TRUE),
(2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', TRUE),
(3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', TRUE),
(4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', TRUE),
(5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '13:00:00', TRUE),
(6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00', TRUE),
(7, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00:00', TRUE),
(8, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', TRUE);

-- Seed: Product categories
INSERT INTO product_categories (name, description) VALUES
('Skincare', 'Products for skin care and beauty'),
('Hair Care', 'Shampoos, conditioners, and hair treatments'),
('Makeup', 'Cosmetics and makeup products'),
('Nail Care', 'Nail polish, tools, and accessories'),
('Fragrances', 'Perfumes and body mists'),
('Tools & Accessories', 'Beauty tools and accessories');

-- Seed: Products
INSERT INTO products (name, description, price_npr, category_id, stock_quantity, image_url) VALUES
('Hydrating Face Cream', 'Deep moisturizing cream for all skin types', 1200.00, 1, 50, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'),
('Anti-Aging Serum', 'Vitamin C serum for youthful skin', 2500.00, 1, 30, 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400'),
('Argan Oil Shampoo', 'Nourishing shampoo for damaged hair', 800.00, 2, 40, 'https://images.unsplash.com/photo-1585232351009-aa874380f189?w=400'),
('Keratin Treatment', 'Professional hair smoothing treatment', 3500.00, 2, 20, 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400'),
('Red Lipstick', 'Long-lasting matte lipstick', 600.00, 3, 60, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'),
('Eyeshadow Palette', '12-color professional eyeshadow palette', 1500.00, 3, 25, 'https://images.unsplash.com/photo-1512496016303-6d2cd901b3a6?w=400'),
('Nail Polish Set', '6-color gel nail polish collection', 900.00, 4, 35, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'),
('Nail Art Tools Kit', 'Professional nail art tools and brushes', 1200.00, 4, 15, 'https://images.unsplash.com/photo-1562887539-2b3ba600c2b7?w=400'),
('Luxury Perfume', 'Floral fragrance for women', 2800.00, 5, 20, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400'),
('Hair Dryer Professional', 'Ionic hair dryer with multiple settings', 4500.00, 6, 10, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400'),
('Facial Steamer', 'Professional facial steaming device', 3200.00, 6, 8, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'),
('Curling Iron', 'Professional ceramic curling iron', 1800.00, 6, 12, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400');
