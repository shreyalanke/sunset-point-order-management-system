import express from "express"
import cors from "cors"
import orderRoute from "./routes/order.route.js"
import dishRoute from "./routes/dish.route.js"
import adminRoute from "./routes/admin.route.js"
import { mode } from "./config.js"
import inventoryRoute from "./routes/inventory.route.js"

let app = express()
app.use(cors())
app.use(express.json())

if (mode === "development") {
    app.use((req, res, next)=>{
        console.log(`${req.method} ${req.url}`)
        console.log("Request Body:", req.body);
        let originalSend = res.send;

        let send = function (body) {
            console.log("Response Body:", body);
            originalSend.call(this, body);
        }

        res.send = send
        
        next();
    })
}

app.use("/orders", orderRoute)  
app.use("/dishes", dishRoute)
app.use("/admin", adminRoute)
app.use("/inventory", inventoryRoute)



export default app