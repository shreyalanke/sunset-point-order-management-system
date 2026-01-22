import { TrendingUp } from "lucide-react";

const ROI_DATA = [
  { id: 1, name: "Jumbo Prawns Platter", price: 850, sold: 12, revenue: 10200 },
  { id: 2, name: "Family Biryani Bucket", price: 600, sold: 15, revenue: 9000 },
  { id: 3, name: "Imported Lamb Chops", price: 1200, sold: 6, revenue: 7200 },
  { id: 4, name: "Butter Chicken", price: 350, sold: 42, revenue: 14700 },
  { id: 5, name: "Truffle Pasta", price: 550, sold: 8, revenue: 4400 },
];

export default function HighValueTable() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600"/>
            High Value Generators
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Items with highest ROI based on Price vs. Day's Revenue
          </p>
        </div>
        <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
          View Full Menu
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Item Name</th>
              <th className="px-6 py-4 font-semibold">Unit Price</th>
              <th className="px-6 py-4 font-semibold">Qty Sold</th>
              <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ROI_DATA.sort((a,b) => b.revenue - a.revenue).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                <td className="px-6 py-4 text-gray-600">₹{item.price}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold text-xs">
                    x{item.sold}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black text-gray-900">
                  ₹{item.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
