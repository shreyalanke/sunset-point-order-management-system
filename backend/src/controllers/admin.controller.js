import databaseService from "../services/database.service.js";

async function dashboardStats(req, res) {
    try {
        // Sample data for dashboard statistics
        console.log("Fetching dashboard statistics...");
        const stats = await databaseService.getDashboardStats();
        console.log("Dashboard statistics fetched:", stats);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function getTrendData(req, res) {
    let { range } = req.query;
    try {
        let data = await databaseService.getTrendData(range);
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function getCategorySalesData(req,res) {
    try{
        let data = await databaseService.getCategorySalesData();
        res.status(200).json(data);
    }catch(error){
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function  getTopSellingItems(req,res) {
    try{
        let data = await databaseService.getTopSellingItems();
        res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({ message: "Server Error", error: error.message });
    }
  
}

async function getHighValueItems(req,res) {
    try{
        let data = await databaseService.getHighValueItems();
        res.status(200).json(data);
    }catch(error){
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}



export { dashboardStats, getTrendData, getCategorySalesData , getTopSellingItems, getHighValueItems};