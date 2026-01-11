/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    is_payment_done BOOLEAN DEFAULT FALSE,
    order_status VARCHAR(20) NOT NULL CHECK (
    order_status IN ('OPEN', 'CLOSED', 'CANCELLED') ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
    );
    pgm.sql(`CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    item_status IN ('PENDING', 'SERVED', 'CANCELLED')
    ),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id)
);`
    );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { 
    pgm.sql(`DROP TABLE IF EXISTS order_items;`);
    pgm.sql(`DROP TABLE IF EXISTS orders;`);
};
