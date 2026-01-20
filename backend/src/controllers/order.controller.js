import pool from "../db.js";


function getOrders(req, res) {
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

      d.dish_id,
      d.dish_name,
      d.category,
      d.price
    FROM orders o
    LEFT JOIN order_items oi
      ON o.order_id = oi.order_id
    LEFT JOIN dishes d
      ON oi.dish_id = d.dish_id
    ORDER BY o.created_at;
  `;

  pool.query(query)
    .then(result => {
      const ordersMap = new Map();

      result.rows.forEach(row => {
        // Create order once
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            id: row.order_id,
            items: [],
            tag: row.order_tag,
            createdAt: row.created_at,
            status: row.order_status,
            paymentDone: row.is_payment_done,
            orderTotal: row.order_total
          });
        }

        // Add item only if it exists
        if (row.order_item_id) {
          ordersMap.get(row.order_id).items.push({
            id: row.order_item_id,
            quantity: row.quantity,
            status: row.item_status,
            name: row.dish_name,
            category: row.category,
            price: row.price
          });
        }
      });

      res.status(200).send([...ordersMap.values()]);
    })
    .catch(err => {
      console.error("Error fetching orders:", err);
      res.status(500).send({ error: "Failed to fetch orders" });
    });
}


function postOrder(req, res) {
    let { items,tag } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).send({ error: "Invalid items in request body" });
    }
    let query = `INSERT INTO orders (is_payment_done, order_status, order_tag) VALUES ($1, $2, $3) RETURNING order_id`;
        pool.query(query, [false, 'OPEN', tag]).then(async result => {
            let orderId = result.rows[0].order_id;
            console.log("Created order with ID:", orderId);
            let queryItems = `INSERT INTO order_items (order_id, dish_id, quantity) VALUES ($1, $2, $3)`;
            for (let item of items) {
                let { id: dishId, quantity } = item;
                await pool.query(queryItems, [orderId, dishId, quantity]);
            }
            res.status(201).send({ orderId });
        }).catch(err => {
            console.error("Error creating order:", err);
            res.status(500).send({ error: "Failed to create order" });
        });
}

export { getOrders, postOrder };