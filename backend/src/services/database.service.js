import pool from "../db.js";

async function getDishes() {
  let query = `SELECT * FROM dishes ORDER BY dish_id`;
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
    WHERE o.created_at >= date_trunc('day', now()) + interval '4 hours'
      AND o.created_at <  date_trunc('day', now()) + interval '1 day' + interval '4 hours'
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
          date_trunc('day', CURRENT_TIMESTAMP),
          date_trunc('day', CURRENT_TIMESTAMP) + interval '23 hours',
          interval '1 hour'
        ) AS bucket
      ),
      aggregated AS (
        SELECT
          date_trunc('hour', created_at) AS bucket,
          COUNT(*) AS orders
        FROM orders
        WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP)
          AND created_at < date_trunc('day', CURRENT_TIMESTAMP) + interval '1 day'
        GROUP BY 1
      )
      SELECT
        b.bucket,
        COALESCE(a.orders, 0) AS orders
      FROM buckets b
      LEFT JOIN aggregated a USING (bucket)
      ORDER BY b.bucket;
    `;
    labelFormat = "hour";
  }

  else if (range === "week") {
    query = `
      WITH buckets AS (
        SELECT generate_series(
          CURRENT_DATE - interval '6 days',
          CURRENT_DATE,
          interval '1 day'
        )::date AS bucket
      ),
      aggregated AS (
        SELECT
          created_at::date AS bucket,
          COUNT(*) AS orders
        FROM orders
        WHERE created_at >= CURRENT_DATE - interval '6 days'
          AND created_at < CURRENT_DATE + interval '1 day'
        GROUP BY 1
      )
      SELECT
        b.bucket,
        COALESCE(a.orders, 0) AS orders
      FROM buckets b
      LEFT JOIN aggregated a USING (bucket)
      ORDER BY b.bucket;
    `;
    labelFormat = "day";
  }

  else if (range === "month") {
    query = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE),
          date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
          interval '1 day'
        )::date AS bucket
      ),
      aggregated AS (
        SELECT
          created_at::date AS bucket,
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
      LEFT JOIN aggregated a USING (bucket)
      ORDER BY b.bucket;
    `;
    labelFormat = "day";
  }

  const { rows } = await pool.query(query);

  return rows.map(row => {
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

  try {
    let result = await pool.query(query);
    return result.rows.map((row) => ({
      name: row.name,
      value: Number(row.value),
    }));
  } catch (error) {
    throw error;
  }
}

async function getTopSellingItems() {
  const query = `
      SELECT
    oi.dish_name_snapshot AS name,
    SUM(oi.quantity) AS sales
FROM order_items oi
JOIN orders o ON o.order_id = oi.order_id
WHERE
    oi.item_status = 'SERVED'
    AND DATE(o.created_at) = CURRENT_DATE
GROUP BY oi.dish_name_snapshot
ORDER BY sales DESC
LIMIT 5;
    `;

  try {
    let result = await pool.query(query);
    return result.rows.map((row) => ({
      name: row.name,
      sales: Number(row.sales),
    }));
  } catch (error) {
    throw error;
  }
}

async function getHighValueItems(){
  const query = `SELECT
    d.dish_id AS id,
    oi.dish_name_snapshot AS name,
    oi.price_snapshot AS price,
    SUM(oi.quantity) AS sold,
    SUM(oi.quantity * oi.price_snapshot) AS revenue
FROM order_items oi
JOIN orders o
    ON o.order_id = oi.order_id
JOIN dishes d
    ON d.dish_id = oi.dish_id
WHERE
    o.created_at::date = CURRENT_DATE
    AND o.order_status = 'CLOSED'
    AND oi.item_status != 'CANCELLED'
GROUP BY
    d.dish_id,
    oi.dish_name_snapshot,
    oi.price_snapshot
ORDER BY
    revenue DESC
LIMIT 5;
    `;
  try {
    let result = await pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      sold: Number(row.sold),
      revenue: Number(row.revenue),
    }));
  } catch (error) {
    throw error;
  }
}

async function getAnalyticsData(start, end) {
  try {
    /** ---------- SUMMARY QUERY ---------- */
    const summaryQuery = `
      SELECT
          COALESCE(SUM(o.order_total), 0)          AS total_revenue,
          COUNT(o.order_id)                        AS total_orders,
          AVG(o.order_total)                       AS avg_order_value,
          AVG(COALESCE(oi.item_count, 0))          AS avg_number_of_items_per_order
      FROM orders o
      LEFT JOIN (
          SELECT
              order_id,
              SUM(quantity) AS item_count
          FROM order_items
          WHERE item_status != 'CANCELLED'
          GROUP BY order_id
      ) oi ON oi.order_id = o.order_id
      WHERE
          o.order_status = 'CLOSED'
          AND o.is_payment_done = true
          AND o.created_at >= $1
          AND o.created_at <  $2;
    `;

    /** ---------- SALES TREND (ZERO-FILLED DAYS, REAL DATES) ---------- */
    const trendQuery = `
      WITH days AS (
        SELECT generate_series(
          $1::date,
          ($2::date),
          interval '1 day'
        )::date AS day
      ),
      aggregated AS (
        SELECT
          o.created_at::date AS day,
          SUM(o.order_total) AS sales,
          COUNT(o.order_id)  AS orders,
          ROUND(AVG(o.order_total)) AS aov
        FROM orders o
        WHERE
          o.order_status = 'CLOSED'
          AND o.is_payment_done = true
          AND o.created_at >= $1
          AND o.created_at <  ($2::date + interval '1 day')
        GROUP BY o.created_at::date
      )
      SELECT
        d.day AS date,
        COALESCE(a.sales, 0) AS sales,
        COALESCE(a.orders, 0) AS orders,
        COALESCE(a.aov, 0) AS aov
      FROM days d
      LEFT JOIN aggregated a USING (day)
      ORDER BY d.day;
    `;

    /** ---------- HOURLY RUSH (ALL 24 HOURS) ---------- */
    const hourlyRushQuery = `
      WITH hours AS (
        SELECT generate_series(0, 23) AS hour
      ),
      hourly_orders AS (
        SELECT
          EXTRACT(HOUR FROM o.created_at)::int AS hour,
          COUNT(o.order_id) AS orders
        FROM orders o
        WHERE
          o.order_status = 'CLOSED'
          AND o.is_payment_done = true
          AND o.created_at >= $1
          AND o.created_at <  $2
        GROUP BY EXTRACT(HOUR FROM o.created_at)
      )
      SELECT
        h.hour,
        COALESCE(ROUND(AVG(o.orders)), 0) AS avg_orders
      FROM hours h
      LEFT JOIN hourly_orders o USING (hour)
      GROUP BY h.hour
      ORDER BY h.hour;
    `;

    /** ---------- CATEGORY PERFORMANCE ---------- */
    const categoryPerformanceQuery = `
      SELECT
          d.category AS name,
          SUM(oi.quantity * oi.price_snapshot) AS sales,
          SUM(oi.quantity) AS quantity
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      JOIN dishes d ON d.dish_id = oi.dish_id
      WHERE
          o.order_status = 'CLOSED'
          AND o.is_payment_done = true
          AND oi.item_status != 'CANCELLED'
          AND o.created_at >= $1
          AND o.created_at <  $2
      GROUP BY d.category
      ORDER BY sales DESC
      LIMIT 4;
    `;

    /** ---------- ORDER SIZE ---------- */
    const orderSizeQuery = `
      WITH order_item_counts AS (
        SELECT
            o.order_id,
            SUM(oi.quantity) AS item_count
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        WHERE
            o.order_status = 'CLOSED'
            AND o.is_payment_done = true
            AND oi.item_status != 'CANCELLED'
            AND o.created_at >= $1
            AND o.created_at <  $2
        GROUP BY o.order_id
      )
      SELECT
        CASE
          WHEN item_count = 1 THEN '1 Item'
          WHEN item_count = 2 THEN '2 Items'
          WHEN item_count BETWEEN 3 AND 4 THEN '3-4 Items'
          ELSE '5+ Items'
        END AS size,
        COUNT(*) AS count
      FROM order_item_counts
      GROUP BY item_count
      ORDER BY
        CASE
          WHEN item_count = 1 THEN 1
          WHEN item_count = 2 THEN 2
          WHEN item_count BETWEEN 3 AND 4 THEN 3
          ELSE 4
        END;
    `;

    const [
      summaryRes,
      trendRes,
      hourlyRushRes,
      categoryPerformanceRes,
      orderSizeRes
    ] = await Promise.all([
      pool.query(summaryQuery, [start, end]),
      pool.query(trendQuery, [start, end]),
      pool.query(hourlyRushQuery, [start, end]),
      pool.query(categoryPerformanceQuery, [start, end]),
      pool.query(orderSizeQuery, [start, end])
    ]);

    const summary = summaryRes.rows[0];
    const totalOrders = Number(summary.total_orders || 0);

    const msInDay = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.ceil((end - start) / msInDay));

    return {
      totalRevenue: Number(summary.total_revenue),
      totalOrders,
      avgOrdersPerDay: totalOrders / days,
      avgOrderValue: Number(summary.avg_order_value || 0),
      avgNumberOfItemsPerOrder: Number(summary.avg_number_of_items_per_order || 0),

      salesTrendData: trendRes.rows.map(r => ({
        date: r.date,              // YYYY-MM-DD
        sales: Number(r.sales),
        orders: Number(r.orders),
        aov: Number(r.aov)
      })),

      hourlyRushData: hourlyRushRes.rows.map(r => {
        const h = r.hour;
        const label =
          h === 0 ? '12 AM' :
          h < 12 ? `${h} AM` :
          h === 12 ? '12 PM' :
          `${h - 12} PM`;

        return {
          time: label,
          orders: Number(r.avg_orders)
        };
      }),

      categoryPerformanceData: categoryPerformanceRes.rows.map(r => ({
        name: r.name,
        sales: Number(r.sales),
        quantity: Number(r.quantity)
      })),

      orderSizeData: orderSizeRes.rows.map(r => ({
        size: r.size,
        count: Number(r.count)
      }))
    };

  } catch (error) {
    throw error;
  }
}


async function getDishPerformance(start, end, type, limit) {
  const query = `
    SELECT
        d.dish_id                    AS id,
        oi.dish_name_snapshot        AS name,
        d.category                   AS category,
        SUM(oi.quantity)             AS sales,
        SUM(oi.quantity * oi.price_snapshot) AS revenue
    FROM order_items oi
    JOIN orders o
        ON o.order_id = oi.order_id
    JOIN dishes d
        ON d.dish_id = oi.dish_id
    WHERE
        o.order_status = 'CLOSED'
        AND o.is_payment_done = true
        AND oi.item_status != 'CANCELLED'
        AND o.created_at >= $1
        AND o.created_at <  $2
    GROUP BY
        d.dish_id,
        oi.dish_name_snapshot,
        d.category
    ORDER BY
        CASE WHEN $3 = 'revenue'
             THEN SUM(oi.quantity * oi.price_snapshot)
        END DESC,
        CASE WHEN $3 = 'quantity'
             THEN SUM(oi.quantity)
        END DESC
    LIMIT $4;
  `;

  const result = await pool.query(query, [
    start,
    end,
    type,
    limit
  ]);

  return result.rows.map(row => ({
    id: Number(row.id),
    name: row.name,
    category: row.category,
    sales: Number(row.sales),
    revenue: Number(row.revenue)
  }));
}

async function getCategoryPerformance(start, end) {
  try {
      const query = `SELECT
    d.category                         AS name,
    SUM(oi.quantity * oi.price_snapshot) AS sales,
    SUM(oi.quantity)                   AS quantity
FROM order_items oi
JOIN orders o
    ON o.order_id = oi.order_id
JOIN dishes d
    ON d.dish_id = oi.dish_id
WHERE
    o.order_status = 'CLOSED'
    AND o.is_payment_done = true
    AND oi.item_status != 'CANCELLED'
    AND o.created_at >= $1
    AND o.created_at <  $2
GROUP BY d.category
ORDER BY sales DESC;
`;
  const result = await pool.query(query, [start, end]);
  return result.rows.map(row => ({
    name: row.name,
    sales: Number(row.sales),
    quantity: Number(row.quantity)
  }));
  } catch (error) {
    throw error
  }

}

async function getDishById(dishId) {
  const query = `SELECT * FROM dishes WHERE dish_id=$1`;
  try {
    const result = await pool.query(query, [dishId]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching dish by ID:", error);
    throw error;
  }
}

async function getDishCategories() {
  const query = `SELECT DISTINCT category FROM dishes`;
  try {
    const result = await pool.query(query);
    return result.rows.map(row => row.category);
  } catch (error) {
    console.error("Error fetching dish categories:", error);
    throw error;
  }
}

async function getAllIngredients() {
  let query = `SELECT json_agg(
    json_build_object(
        'id', i.ingredient_id,
        'name', i.ingredient_name,
        'unit', i.unit,
        'category', i.category,
        'max', i.max_stock,
        'current', COALESCE(inv.stock_quantity, 0),
        'threshold', COALESCE(i.max_stock * 0.25, 5),
        'lastRestocked', inv.restock_timestamp
    )
    ORDER BY i.ingredient_id
) AS ingredients
FROM ingredients i
LEFT JOIN inventory inv ON i.ingredient_id = inv.ingredient_id;`;

  try {
    const result = await pool.query(query);
    return result.rows[0].ingredients || [];
  } catch (error) {
    console.error("Error fetching all ingredients:", error);
    throw error;
  }
}

async function getDishIngredients(id) {
  let query = `SELECT
    i.ingredient_id as id,
    i.ingredient_name as name,
    di.quantity_needed as quantity,
    i.unit
FROM dish_ingredients di
JOIN ingredients i
    ON di.ingredient_id = i.ingredient_id
JOIN dishes d
    ON di.dish_id = d.dish_id
WHERE di.dish_id = $1;`;

  try {
    const result = await pool.query(query, [id]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching dish ingredients:", error);
    throw error;
  }
}

async function updateDish(dishData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id, name, price, category, recipe } = dishData;

    /* 1️⃣ Update dish basic info */
    const dishQuery = `
      UPDATE dishes
      SET dish_name = $1,
          price = $2,
          category = $3
      WHERE dish_id = $4
    `;
    await client.query(dishQuery, [name, price, category, id]);

    /* 2️⃣ Remove old recipe */
    const deleteRecipeQuery = `
      DELETE FROM dish_ingredients
      WHERE dish_id = $1
    `;
    await client.query(deleteRecipeQuery, [id]);

    /* 3️⃣ Insert new recipe */
    const insertRecipeQuery = `
      INSERT INTO dish_ingredients (
        dish_id,
        ingredient_id,
        quantity_needed
      )
      VALUES ($1, $2, $3)
    `;

    for (const item of recipe) {
      await client.query(insertRecipeQuery, [
        id,
        item.ingredientId,
        item.quantity
      ]);
    }

    await client.query("COMMIT");
    return { success: true };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createDish(dishData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { name, price, category, recipe } = dishData;

    /* 1️⃣ Insert dish */
    const insertDishQuery = `
      INSERT INTO dishes (dish_name, price, category)
      VALUES ($1, $2, $3)
      RETURNING dish_id
    `;

    const dishResult = await client.query(insertDishQuery, [
      name,
      price,
      category
    ]);

    const dishId = dishResult.rows[0].dish_id;

    /* 2️⃣ Insert recipe */
    const insertRecipeQuery = `
      INSERT INTO dish_ingredients (
        dish_id,
        ingredient_id,
        quantity_needed
      )
      VALUES ($1, $2, $3)
    `;

    for (const item of recipe) {
      await client.query(insertRecipeQuery, [
        dishId,
        item.ingredientId,
        item.quantity
      ]);
    }

    await client.query("COMMIT");

    return {
      success: true,
      dishId
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateIngredientStock(ingredientId, newQuantity) {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Check if inventory record exists
    const checkQuery = `SELECT ingredient_id FROM inventory WHERE ingredient_id = $1`;
    const checkResult = await client.query(checkQuery, [ingredientId]);
    
    if (checkResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE inventory 
        SET stock_quantity = $1, 
            restock_timestamp = CURRENT_TIMESTAMP 
        WHERE ingredient_id = $2
        RETURNING *
      `;
      await client.query(updateQuery, [newQuantity, ingredientId]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO inventory (ingredient_id, stock_quantity, restock_timestamp)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      await client.query(insertQuery, [ingredientId, newQuantity]);
    }
    
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating ingredient stock:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function addIngredient(ingredientData) {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const { name, unit, category, maxStock, initialStock } = ingredientData;
    
    // Insert ingredient
    const insertIngredientQuery = `
      INSERT INTO ingredients (ingredient_name, unit, category, max_stock)
      VALUES ($1, $2, $3, $4)
      RETURNING ingredient_id
    `;
    const result = await client.query(insertIngredientQuery, [name, unit, category, maxStock]);
    const ingredientId = result.rows[0].ingredient_id;
    
    // Insert initial inventory if provided
    if (initialStock !== undefined && initialStock !== null) {
      const insertInventoryQuery = `
        INSERT INTO inventory (ingredient_id, stock_quantity, restock_timestamp)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `;
      await client.query(insertInventoryQuery, [ingredientId, initialStock]);
    }
    
    await client.query("COMMIT");
    return { success: true, ingredientId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding ingredient:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function getIngredientDetails(ingredientId) {
  const query = `
    SELECT json_build_object(
      'id', i.ingredient_id,
      'name', i.ingredient_name,
      'unit', i.unit,
      'category', i.category,
      'max', i.max_stock,
      'current', COALESCE(inv.stock_quantity, 0),
      'threshold', COALESCE(i.max_stock * 0.25, 5),
      'lastRestocked', inv.restock_timestamp,
      'sku', 'SKU-' || (1000 + i.ingredient_id),
      'associatedDishes', COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', d.dish_id,
            'name', d.dish_name,
            'quantityRequired', di.quantity_needed
          )
          ORDER BY d.dish_name
        )
        FROM dish_ingredients di
        JOIN dishes d ON di.dish_id = d.dish_id
        WHERE di.ingredient_id = i.ingredient_id),
        '[]'::json
      )
    ) AS ingredient
    FROM ingredients i
    LEFT JOIN inventory inv ON i.ingredient_id = inv.ingredient_id
    WHERE i.ingredient_id = $1
  `;
  
  try {
    const result = await pool.query(query, [ingredientId]);
    return result.rows[0]?.ingredient || null;
  } catch (error) {
    console.error("Error fetching ingredient details:", error);
    throw error;
  }
}

async function updateIngredientDetails(ingredientId, ingredientData) {
  const { name, category, max, unit } = ingredientData;
  
  const query = `
    UPDATE ingredients
    SET ingredient_name = $1,
        category = $2,
        max_stock = $3,
        unit = $4
    WHERE ingredient_id = $5
    RETURNING ingredient_id
  `;
  
  try {
    const result = await pool.query(query, [name, category, max, unit, ingredientId]);
    if (result.rows.length === 0) {
      throw new Error('Ingredient not found');
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating ingredient details:", error);
    throw error;
  }
}

async function getOrderById(orderId) {
  try {
    const query = `
      SELECT
        o.order_id,
        o.order_tag,
        o.order_status,
        o.is_payment_done,
        o.order_total,
        o.created_at,

        COALESCE(
          json_agg(
            json_build_object(
              'order_item_id', oi.order_item_id,
              'dish_id', oi.dish_id,
              'dish_name', oi.dish_name_snapshot,
              'price', oi.price_snapshot,
              'quantity', oi.quantity,
              'item_status', oi.item_status
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'
        ) AS items

      FROM orders o
      LEFT JOIN order_items oi
        ON oi.order_id = o.order_id
      WHERE o.order_id = $1
      GROUP BY o.order_id;
    `;

    const result = await pool.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
}

async function getAllOrders(searchQuery, startDate, endDate, sortKey, sortDirection, page) {
  try{
    let query = `SELECT
    o.order_id,
    o.order_tag,
    o.order_status,
    o.is_payment_done,
    o.order_total,
    o.created_at,

    COALESCE(
        json_agg(
            json_build_object(
                'order_item_id', oi.order_item_id,
                'dish_id', oi.dish_id,
                'dish_name', oi.dish_name_snapshot,
                'price', oi.price_snapshot,
                'quantity', oi.quantity,
                'item_status', oi.item_status
            )
        ) FILTER (WHERE oi.order_item_id IS NOT NULL),
        '[]'
    ) AS items

FROM orders o
LEFT JOIN order_items oi
    ON oi.order_id = o.order_id

WHERE
    (NULLIF($1, '')::TEXT IS NULL OR o.order_tag ILIKE '%' || NULLIF($1, '') || '%')
    AND (NULLIF($2, '')::TEXT IS NULL OR o.created_at >= $2::DATE)
    AND (NULLIF($3, '')::TEXT IS NULL OR o.created_at <= $3::DATE)

GROUP BY o.order_id

ORDER BY
    CASE WHEN $4 = 'created_at' AND $5 = 'ASC'  THEN o.created_at END ASC,
    CASE WHEN $4 = 'created_at' AND $5 = 'DESC' THEN o.created_at END DESC,
    CASE WHEN $4 = 'order_total' AND $5 = 'ASC'  THEN o.order_total END ASC,
    CASE WHEN $4 = 'order_total' AND $5 = 'DESC' THEN o.order_total END DESC

LIMIT 10
OFFSET ($6 - 1) * 10;
`;

    endDate = new Date(new Date(endDate).setDate((new Date(endDate)).getDate() + 1)).toISOString().split('T')[0];

    console.log(searchQuery, startDate, endDate, sortKey, sortDirection, page);
    const values = [
      searchQuery || '',
      startDate,
      endDate,
      sortKey || 'created_at',
      sortDirection || 'DESC',
      page || 1
    ];
    console.log('Values:', values);
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error fetching all orders:", error);
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
  getTopSellingItems,
  getHighValueItems,
  getAnalyticsData,
  getDishPerformance,
  getCategoryPerformance,
  getDishById,
  getDishCategories,
  getAllIngredients,
  getDishIngredients,
  updateDish,
  createDish,
  updateIngredientStock,
  addIngredient,
  getIngredientDetails,
  updateIngredientDetails,
  getAllOrders,
  getOrderById
};
