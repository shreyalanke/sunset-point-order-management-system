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
    dish_name_snapshot VARCHAR(100) NOT NULL,
    price_snapshot INTEGER NOT NULL CHECK (price_snapshot > 0),
    item_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    item_status IN ('PENDING', 'SERVED', 'CANCELLED')
    ),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id)
);

CREATE OR REPLACE FUNCTION recalc_order_total(p_order_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET order_total = COALESCE(
        (
            SELECT SUM(quantity * price_snapshot)
            FROM order_items
            WHERE order_id = p_order_id
                AND item_status != 'CANCELLED'
        ),
        0
    )
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION trg_update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalc_order_total(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM recalc_order_total(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER order_items_total_trigger
AFTER INSERT OR UPDATE OR DELETE
ON order_items
FOR EACH ROW
EXECUTE FUNCTION trg_update_order_total();

CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    ingredient_name VARCHAR(100) NOT NULL UNIQUE,
    max_stock NUMERIC(10,2) NOT NULL CHECK (max_stock > 0),
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    unit VARCHAR(20) NOT NULL  -- e.g. grams, ml, pieces
);

CREATE TABLE inventory (
    ingredient_id INTEGER PRIMARY KEY,
    stock_quantity NUMERIC(10,2) NOT NULL CHECK (stock_quantity >= 0),
    restock_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE
);

CREATE TABLE dish_ingredients (
    dish_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity_needed NUMERIC(10,2) NOT NULL CHECK (quantity_needed > 0),
    PRIMARY KEY (dish_id, ingredient_id),
    FOREIGN KEY (dish_id)
        REFERENCES dishes(dish_id)
        ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION deduct_inventory(
    p_dish_id INT,
    p_quantity INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory i
    SET stock_quantity = i.stock_quantity - (di.quantity_needed * p_quantity)
    FROM dish_ingredients di
    WHERE di.dish_id = p_dish_id
      AND di.ingredient_id = i.ingredient_id;

    -- Safety check
    IF EXISTS (
        SELECT 1
        FROM inventory
        WHERE stock_quantity < 0
    ) THEN
        RAISE EXCEPTION 'Insufficient inventory for dish_id %', p_dish_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_deduct_inventory_on_serve()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_status = 'SERVED'
       AND OLD.item_status IS DISTINCT FROM 'SERVED' THEN

        PERFORM deduct_inventory(
            NEW.dish_id,
            NEW.quantity
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_inventory_trigger
AFTER UPDATE OF item_status
ON order_items
FOR EACH ROW
EXECUTE FUNCTION trg_deduct_inventory_on_serve();
