import pg from "pg"
import { dbConfig } from "./config.js" 

let pool = new pg.Pool({...dbConfig,ssl: {rejectUnauthorized: false}})
await pool.connect()
console.log("Database connected successfully")

export default pool 