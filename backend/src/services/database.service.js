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
    ORDER BY o.created_at;
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
            [false, "OPEN", tag]
        );

        const orderId = orderResult.rows[0].order_id;

        const dishIds = items.map(i => i.id);

        const dishesResult = await client.query(
            `SELECT dish_id, dish_name, price
             FROM dishes
             WHERE dish_id = ANY($1::int[])`,
            [dishIds]
        );

        if (dishesResult.rows.length !== dishIds.length) {
            throw new Error("One or more dishes not found");
        }

        const dishMap = new Map();
        dishesResult.rows.forEach(d =>
            dishMap.set(d.dish_id, d)
        );
        const values = [];
        const placeholders = [];

        items.forEach((item, index) => {
            const dish = dishMap.get(item.id);

            if (!dish) {
                throw new Error(`Dish with id ${item.id} not found`);
            }

            const base = index * 5;
            placeholders.push(
                `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
            );

            values.push(
                orderId,
                item.id,
                item.quantity,
                dish.dish_name,
                dish.price
            );
        });

        await client.query(
            `INSERT INTO order_items
             (order_id, dish_id, quantity, dish_name_snapshot, price_snapshot)
             VALUES ${placeholders.join(", ")}`,
            values
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
    let query = `UPDATE orders SET order_status='CLOSED', is_payment_done=true WHERE order_id=$1 RETURNING *`;
    let result = await pool.query(query, [orderId]);
    return result.rows[0];
}

export default { getDishes, getOrders , createOrder};