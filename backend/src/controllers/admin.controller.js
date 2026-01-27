import databaseService from "../services/database.service.js";

const getOrders = async (req, res) => {
    console.log("Admin Controller: getOrders called");
    try {
        console.log("Fetching orders with query params:", req.query);
        let {searchQuery, startDate, endDate, sortKey, sortDirection, page} = req.query;
        const orders = await databaseService.getAllOrders(searchQuery, startDate, endDate, sortKey, sortDirection, page);
        res.status(200).json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export { getOrders };