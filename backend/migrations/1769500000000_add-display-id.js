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
  // 1. Add the display_id column (nullable, no uniqueness constraint)
  pgm.addColumn('orders', {
    display_id: {
      type: 'integer',
      notNull: false,
    },
  });

  // 2. Create the function that assigns a per-day sequential display_id
  pgm.sql(`
    CREATE OR REPLACE FUNCTION assign_display_id()
    RETURNS TRIGGER AS $$
    DECLARE
      v_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM orders
      WHERE created_at::DATE = COALESCE(NEW.created_at, CURRENT_TIMESTAMP)::DATE;

      NEW.display_id := v_count + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. Attach the trigger (BEFORE INSERT so display_id is set on the new row)
  pgm.sql(`
    CREATE TRIGGER trg_set_display_id
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION assign_display_id();
  `);

  // 4. Backfill existing orders with a per-day sequential display_id
  pgm.sql(`
    UPDATE orders o
    SET display_id = sub.rn
    FROM (
      SELECT order_id,
             ROW_NUMBER() OVER (PARTITION BY created_at::DATE ORDER BY order_id) AS rn
      FROM orders
    ) sub
    WHERE o.order_id = sub.order_id;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS trg_set_display_id ON orders;`);
  pgm.sql(`DROP FUNCTION IF EXISTS assign_display_id;`);
  pgm.dropColumn('orders', 'display_id');
};
