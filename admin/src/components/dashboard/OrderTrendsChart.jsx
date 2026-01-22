import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OrderTrendsChart({ data, onTimeRangeChange }) {
    let chartView = data.view || 'today';
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Order Trends</h3>
          <p className="text-sm text-gray-500">
            {chartView === 'today' ? 'Orders per hour (Today)' : 
             chartView === 'week' ? 'Orders per day (This Week)' : 'Orders per week (This Month)'}
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['today', 'week', 'month'].map((view) => (
            <button
              key={view}
              onClick={() => {
                onTimeRangeChange(view);
              }}
              className={`px-4 py-1.5 text-sm font-bold capitalize rounded-md transition-all ${
                chartView === view 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.data}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            <Area 
              type="linear"
              dataKey="orders" 
              stroke="#3B82F6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorOrders)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
