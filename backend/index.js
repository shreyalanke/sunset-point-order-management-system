import express from "express"
import pool from "./db.js"
import cors from "cors"


let app = express()
app.use(cors())
let PORT = 3000

app.get("/home", (req, res) => {
    res.send("Helloww World")
})

app.get("/api/dishes", async (req, res) => {
    try {
        let result = await pool.query("SELECT * FROM dishes")
        let response = {}
        for (let row of result.rows) {
            if (response[row.category]) {
                response[row.category].push({
                    id: row.dish_id,
                    name: row.dish_name,
                    price: row.price
                })
            } else {
                response[row.category] = [{
                    id: row.dish_id,
                    name: row.dish_name,
                    price: row.price
                }]
            }

        }
        res.json(response)

    } catch (error) {
        console.error("Error fetching dishes:", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})