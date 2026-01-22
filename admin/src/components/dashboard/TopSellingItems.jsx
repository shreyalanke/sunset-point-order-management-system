const TOP_SELLING_DATA = [
  { name: "Butter Chicken", sales: 42 },
  { name: "Garlic Naan", sales: 85 },
  { name: "Paneer Tikka", sales: 38 },
  { name: "Cold Coffee", sales: 30 },
];

export default function TopSellingItems() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Top Selling Items Today</h3>
      <div className="space-y-5">
        {TOP_SELLING_DATA.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-gray-700">{item.name}</span>
              <span className="text-sm font-medium text-gray-500">{item.sales} sold</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(item.sales / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
