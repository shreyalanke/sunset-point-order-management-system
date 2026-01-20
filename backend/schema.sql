CREATE TABLE dishes (
    dish_id SERIAL PRIMARY KEY,
    dish_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0));


CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_tag VARCHAR(20),
    is_payment_done BOOLEAN DEFAULT FALSE,
    order_total INTEGER NOT NULL DEFAULT 0 CHECK (order_total >= 0),
    order_status VARCHAR(20) NOT NULL CHECK (
    order_status IN ('OPEN', 'CLOSED', 'CANCELLED') ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    item_status IN ('PENDING', 'SERVED', 'CANCELLED')
    ),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id)
);