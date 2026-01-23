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
   pgm.sql(`
     CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    ingredient_name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL  -- e.g. grams, ml, pieces
);

CREATE TABLE inventory (
    ingredient_id INTEGER PRIMARY KEY,
    stock_quantity NUMERIC(10,2) NOT NULL CHECK (stock_quantity >= 0),
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


   `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
 pgm.sql(`
 DROP TRIGGER IF EXISTS deduct_inventory_trigger ON order_items;
 DROP FUNCTION IF EXISTS trg_deduct_inventory_on_serve();
 DROP FUNCTION IF EXISTS deduct_inventory(INT, INT);
 DROP TABLE IF EXISTS dish_ingredients;
 DROP TABLE IF EXISTS inventory;
 DROP TABLE IF EXISTS ingredients;
   `);
};
