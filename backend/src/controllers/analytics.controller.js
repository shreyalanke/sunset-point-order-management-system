import databaseService from '../services/database.service.js';
import { getDateRange } from '../utils/analytics.js';

async function getAnalytics(req, res) {
    try {
        let queryParams = req.query;
        if(queryParams.range) {
            let {start, end} = getDateRange(queryParams.range);
            let result = await databaseService.getAnalyticsData(start, end);
            res.status(200).json(result);
        }else{
            let {start, end} = queryParams;
            let result = await databaseService.getAnalyticsData(new Date(start), new Date(end));
            res.status(200).json(result);
        }
        console.log("Fetching analytics data with params:", queryParams);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function getDishPerformance(req, res) {
    try {
        let queryParams = req.query;
        let {type,limit} = queryParams;
        if(queryParams.range) {
            let {start, end} = getDateRange(queryParams.range);
            let result = await databaseService.getDishPerformance(start, end, type, limit);
            res.status(200).json(result);
        }
        else{
            let {start, end} = queryParams;
            let result = await databaseService.getDishPerformance(new Date(start), new Date(new Date(end).setDate(new Date(end).getDate()+1)), type, limit);
            res.status(200).json(result);
        }
        console.log("Fetching analytics data with params:", queryParams);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function getCategoryPerformance(req, res) {
    try {
        let queryParams = req.query;
        if(queryParams.range) {
            let {start, end} = getDateRange(queryParams.range);
            let result = await databaseService.getCategoryPerformance(start, end);
            res.status(200).json(result);
        }   else{
            let {start, end} = queryParams;
            let result = await databaseService.getCategoryPerformance(new Date(start), new Date(new Date(end).setDate(new Date(end).getDate()+1)));
            res.status(200).json(result);
        }
        console.log("Fetching category performance data with params:", queryParams);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export { getAnalytics,getDishPerformance, getCategoryPerformance };