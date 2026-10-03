CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255) NULL,
    razorpay_signature VARCHAR(255) NULL,
    product_name VARCHAR(255) NOT NULL,
    amount INT NOT NULL, -- Amount in paise
    currency VARCHAR(10) DEFAULT 'INR',
    status ENUM('created', 'paid', 'failed') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
