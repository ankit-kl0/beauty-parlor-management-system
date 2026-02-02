-- eCommerce Module Schema Updates
USE beauty_parlor;

-- Product Categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
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
    INDEX idx_category (category_id),
    INDEX idx_active (is_active)
);

-- Shopping Cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255), -- For guest users (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_cart (user_id)
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10, 2) NOT NULL, -- Store price at time of adding to cart
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES shopping_cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    payment_method VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',

    -- Shipping Address
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
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample product categories
INSERT INTO product_categories (name, description) VALUES
('Skincare', 'Products for skin care and beauty'),
('Hair Care', 'Shampoos, conditioners, and hair treatments'),
('Makeup', 'Cosmetics and makeup products'),
('Nail Care', 'Nail polish, tools, and accessories'),
('Fragrances', 'Perfumes and body mists'),
('Tools & Accessories', 'Beauty tools and accessories');

-- Insert sample products
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