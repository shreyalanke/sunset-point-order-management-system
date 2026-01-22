import pool from "../db.js";

async function getDishes() {
  let query = `SELECT * FROM dishes`;
  let result = await pool.query(query);
  return result.rows;
}

async function getOrders() {
  const query = `
    SELECT 
      o.order_id,
      o.order_tag,
      o.created_at,
      o.order_status,
      o.is_payment_done,
      o.order_total,

      oi.order_item_id,
      oi.quantity,
      oi.item_status,
      oi.price_snapshot AS price,
      oi.dish_name_snapshot AS dish_name,

      d.dish_id,
      d.category
    FROM orders o
    LEFT JOIN order_items oi
      ON o.order_id = oi.order_id
    LEFT JOIN dishes d
      ON oi.dish_id = d.dish_id
    ORDER BY o.created_at, oi.order_item_id;
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function createOrder(tag, items) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (is_payment_done, order_status, order_tag)
             VALUES ($1, $2, $3)
             RETURNING order_id`,
      [false, "OPEN", tag],
    );

    const orderId = orderResult.rows[0].order_id;

    const dishIds = items.map((i) => i.id);

    const dishesResult = await client.query(
      `SELECT dish_id, dish_name, price
             FROM dishes
             WHERE dish_id = ANY($1::int[])`,
      [dishIds],
    );

    if (dishesResult.rows.length !== dishIds.length) {
      throw new Error("One or more dishes not found");
    }

    const dishMap = new Map();
    dishesResult.rows.forEach((d) => dishMap.set(d.dish_id, d));
    const values = [];
    const placeholders = [];

    items.forEach((item, index) => {
      const dish = dishMap.get(item.id);

      if (!dish) {
        throw new Error(`Dish with id ${item.id} not found`);
      }

      const base = index * 5;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`,
      );

      values.push(orderId, item.id, item.quantity, dish.dish_name, dish.price);
    });

    await client.query(
      `INSERT INTO order_items
             (order_id, dish_id, quantity, dish_name_snapshot, price_snapshot)
             VALUES ${placeholders.join(", ")}`,
      values,
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction failed:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function closeOrder(orderId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Mark all non-cancelled items as SERVED
    await client.query(
      `
      UPDATE order_items
      SET item_status = 'SERVED'
      WHERE order_id = $1
        AND item_status != 'CANCELLED'
      `,
      [orderId],
    );

    // 2. Close the order and mark payment done
    const result = await client.query(
      `
      UPDATE orders
      SET order_status = 'CLOSED',
          is_payment_done = true
      WHERE order_id = $1
      RETURNING *
      `,
      [orderId],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function toggleItemServedStatus(orderId, itemId) {
  const query = `
    UPDATE order_items
    SET item_status = CASE
        WHEN item_status = 'SERVED' THEN 'PENDING'
        ELSE 'SERVED'
    END
    WHERE order_id = $1 AND order_item_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [orderId, itemId]);
  return result.rows[0];
}

async function removeItemFromOrder(id) {
  const query = `DELETE FROM order_items WHERE order_item_id=$1`;
  try {
    await pool.query(query, [id]);
  } catch (error) {
    console.error("Error removing item from order:", error);
    throw error;
  }
}

async function toggleOrderPaymentStatus(orderId) {
  const query = `
    UPDATE orders
    SET is_payment_done = NOT is_payment_done
    WHERE order_id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [orderId]);
  return result.rows[0];
}

async function getDashboardStats() {
  const query = `
    SELECT COALESCE(SUM(order_total), 0) AS today_total_sales, COUNT(*) AS total_orders
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE
      AND order_status = 'CLOSED'
      AND is_payment_done = true
  `;

  const { rows } = await pool.query(query);

  return {
    totalSales: Number(rows[0].today_total_sales),
    totalOrders: Number(rows[0].total_orders),
    avgOrderValue: rows[0].total_orders
      ? Number(rows[0].today_total_sales) / Number(rows[0].total_orders)
      : 0,
  };
}

async function getTrendData(range) {
  let query;
  let labelFormat;

  if (range === "today") {
    query = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('day', CURRENT_DATE),
          date_trunc('day', CURRENT_DATE) + interval '23 hours',
          interval '1 hour'
        ) AS bucket
      ),
      aggregated AS (
        SELECT
          date_trunc('hour', created_at) AS bucket,
          COUNT(*) AS orders
        FROM orders
        WHERE created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + interval '1 day'
        GROUP BY 1
      )
      SELECT
        b.bucket,
        COALESCE(a.orders, 0) AS orders
      FROM buckets b
      LEFT JOIN aggregated a ON b.bucket = a.bucket
      ORDER BY b.bucket;
    `;
    labelFormat = "hour";
  }

  else if (range === "week") {
    query = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE),
          date_trunc('week', CURRENT_DATE) + interval '6 days',
          interval '1 day'
        ) AS bucket
      ),
      aggregated AS (
        SELECT
          date_trunc('day', created_at) AS bucket,
          COUNT(*) AS orders
        FROM orders
        WHERE created_at >= date_trunc('week', CURRENT_DATE)
          AND created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
        GROUP BY 1
      )
      SELECT
        b.bucket,
        COALESCE(a.orders, 0) AS orders
      FROM buckets b
      LEFT JOIN aggregated a ON b.bucket = a.bucket
      ORDER BY b.bucket;
    `;
    labelFormat = "day";
  }

  else if (range === "month") {
    query = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE),
          date_trunc('month', CURRENT_DATE)
            + interval '1 month'
            - interval '1 day',
          interval '1 day'
        ) AS bucket
      ),
      aggregated AS (
        SELECT
          date_trunc('day', created_at) AS bucket,
          COUNT(*) AS orders
        FROM orders
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
          AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
        GROUP BY 1
      )
      SELECT
        b.bucket,
        COALESCE(a.orders, 0) AS orders
      FROM buckets b
      LEFT JOIN aggregated a ON b.bucket = a.bucket
      ORDER BY b.bucket;
    `;
    labelFormat = "day";
  }

  const { rows } = await pool.query(query);

  return rows.map((row) => {
    const date = new Date(row.bucket);

    let name;
    if (labelFormat === "hour") {
      const h = date.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      const display = h % 12 || 12;
      name = `${display} ${ampm}`;
    } else {
      name = date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    }

    return {
      name,
      orders: Number(row.orders),
    };
  });
}

async function getCategorySalesData() {
  const query = `SELECT
  d.category AS name,
  SUM(oi.quantity) AS value
FROM order_items oi
JOIN orders o ON o.order_id = oi.order_id
JOIN dishes d ON d.dish_id = oi.dish_id
WHERE o.created_at >= CURRENT_DATE
  AND o.created_at < CURRENT_DATE + INTERVAL '1 day'
  AND o.order_status = 'CLOSED'
  AND o.is_payment_done = true
  AND oi.item_status != 'CANCELLED'
GROUP BY d.category
ORDER BY value DESC;
`;

try{
  let result = await pool.query(query);
  return result.rows.map(row=>({
    name: row.name,
    value: Number(row.value)
  }));
}catch(error){
  throw error;
}
}


export default {
  getDishes,
  getOrders,
  createOrder,
  closeOrder,
  toggleItemServedStatus,
  removeItemFromOrder,
  toggleOrderPaymentStatus,
  getDashboardStats,
  getTrendData,
  getCategorySalesData,
};
