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
    `);

    pgm.sql(`
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
    `);

    pgm.sql(`
        CREATE TRIGGER order_items_total_trigger
        AFTER INSERT OR UPDATE OR DELETE
        ON order_items
        FOR EACH ROW
        EXECUTE FUNCTION trg_update_order_total();
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {

    // Drop trigger first
    pgm.sql(`
        DROP TRIGGER IF EXISTS order_items_total_trigger
        ON order_items;
    `);

    // Drop trigger function
    pgm.sql(`
        DROP FUNCTION IF EXISTS trg_update_order_total();
    `);

    // Drop recalculation function
    pgm.sql(`
        DROP FUNCTION IF EXISTS recalc_order_total(INT);
    `);
};
