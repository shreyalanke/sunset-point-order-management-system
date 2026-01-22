import Header from "../components/Header";
import { useEffect, useState } from "react";
import {
  IndianRupee,
  ShoppingBag,
  Calculator,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import OrderTrendsChart from "../components/dashboard/OrderTrendsChart";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import TopSellingItems from "../components/dashboard/TopSellingItems";
import HighValueTable from "../components/dashboard/HighValueTable";
import { getDashboardData, getTrendData, getCategorySalesData } from "../api/dashboard.js";

export default function Dashboard() {
    let [todaysSales, setTodaysSales] = useState(0);
    let [totalOrders, setTotalOrders] = useState(0);
    let [averageOrderValue, setAverageOrderValue] = useState(0);
    let [categorySalesData, setCategorySalesData] = useState([]);
    let [isLoading, setIsLoading] = useState(true);

    let [trendData, setTrendData] = useState({data: [], view: 'today'});

    useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
        const data = await getDashboardData();
        setTodaysSales(data.totalSales || 0);
        setTotalOrders(data.totalOrders || 0);
        setAverageOrderValue(data.avgOrderValue || 0);
        } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        }finally{
            setIsLoading(false);
        }
        updateTrendData('today');
        const cData = await getCategorySalesData();
        setCategorySalesData( cData);
    }

    fetchData();
}, []);

    async function updateTrendData(newRange) {
        const data = await getTrendData(newRange);
        setTrendData(prev => ({...prev, data: data}));
    }


    function onTimeRangeChange(newRange) {
        setTrendData((prev) => ({...prev, view: newRange}));
        updateTrendData(newRange);
    }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 font-sans text-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Today's Sales" 
            value={`₹${todaysSales.toLocaleString()}`} 
            subtext="+12% from yesterday"
            icon={IndianRupee} 
            color="text-green-600" 
            bg="bg-green-50"
            loading={isLoading}
          />
          <StatCard 
            label="Total Orders" 
            value={totalOrders} 
            subtext="Today's order count"
            icon={ShoppingBag} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            loading={isLoading}
          />
          <StatCard 
            label="Avg. Order Value" 
            value={`₹${averageOrderValue.toLocaleString()}`}
            subtext="Per table average"
            icon={Calculator} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
            loading={isLoading}
          />
          <StatCard 
            label="Low Stock Items" 
            value="5" 
            subtext="Items require attention"
            icon={AlertTriangle} 
            color="text-orange-600" 
            bg="bg-orange-50" 
          />
        </div>

        <OrderTrendsChart data={trendData} onTimeRangeChange={onTimeRangeChange} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart data={categorySalesData} />
          <TopSellingItems />
        </div>

        <HighValueTable />

      </div>
    </div>
  );
}