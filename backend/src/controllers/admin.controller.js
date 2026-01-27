import databaseService from "../services/database.service.js";

const getOrders = async (req, res) => {
    console.log("Admin Controller: getOrders called");
    try {
        console.log("Fetching orders with query params:", req.query);
        let {searchQuery, startDate, endDate, sortKey, sortDirection, page} = req.query;
        const orders = await databaseService.getAllOrders(searchQuery, startDate, endDate, sortKey, sortDirection, page);
        res.status(200).json( orders );
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getOrderById = async (req, res) => {
    console.log("Admin Controller: getOrderById called");
    try {
        const { orderId } = req.params;
        console.log("Fetching order with ID:", orderId);
        
        const order = await databaseService.getOrderById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export { getOrders, getOrderById };