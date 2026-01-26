import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  RefreshCcw
} from 'lucide-react';
import { INITIAL_INVENTORY } from '../data/inventoryData';
import RefillModal from '../components/inventory/RefillModal';

export default function InventoryListPage() {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // --- REFILL MODAL STATE ---
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- COMPUTED DATA ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isLowStock = item.current <= item.threshold;
      
      let matchesFilter = true;
      if (filterStatus === "Low Stock") matchesFilter = isLowStock;
      if (filterStatus === "In Stock") matchesFilter = !isLowStock;

      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, filterStatus]);

  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.current <= i.threshold).length;

  // --- HANDLERS ---
  const openRefillModal = (e, item) => {
    e.stopPropagation(); 
    setSelectedItem(item);
    setIsRefillOpen(true);
  };

  const handleRefillSubmit = (refillAmount, updateMode) => {
    if (!selectedItem || !refillAmount) return;

    const inputVal = parseFloat(refillAmount);
    
    setItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        let newAmount = item.current;
        
        if (updateMode === 'add') {
          newAmount = item.current + inputVal;
        } else {
          newAmount = inputVal;
        }

        newAmount = Math.max(0, newAmount);

        return { ...item, current: parseFloat(newAmount.toFixed(2)) };
      }
      return item;
    }));

    setIsRefillOpen(false);
  };

  // --- VISUAL HELPERS ---
  const getProgressColor = (current, max, threshold) => {
    const percentage = (current / max) * 100;
    if (current <= threshold) return "bg-red-500"; 
    if (percentage < 50) return "bg-amber-500";   
    return "bg-emerald-500";                      
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
            <p className="text-sm text-slate-500">Track stock levels and refill ingredients.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Total Items</p>
                  <p className="text-lg font-bold text-slate-800">{totalItems}</p>
                </div>
             </div>
             <div className={`px-4 py-2 rounded-xl border shadow-sm flex items-center gap-3 ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}><AlertTriangle size={20} /></div>
                <div>
                  <p className={`text-xs font-bold uppercase ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>Alerts</p>
                  <p className={`text-lg font-bold ${lowStockCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>{lowStockCount}</p>
                </div>
             </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-sm font-medium transition-all"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-100 cursor-pointer"
               >
                 <option value="All">All Items</option>
                 <option value="Low Stock">Low Stock Only</option>
                 <option value="In Stock">In Stock</option>
            </select>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all">
              <Plus size={18} />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ingredient Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Stock Level</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const percentage = Math.min((item.current / item.max) * 100, 100);
                const isLow = item.current <= item.threshold;
                const barColor = getProgressColor(item.current, item.max, item.threshold);

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {isLow ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</p>
                          {isLow && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Restock Needed</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-500'}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${barColor} transition-all duration-500 ease-out`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                             <span className="text-[10px] text-slate-400">0 {item.unit}</span>
                             <span className="text-[10px] text-slate-400">Max: {item.max} {item.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-bold text-base ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.current}
                      </span>
                      <span className="text-slate-500 ml-1 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={(e) => openRefillModal(e, item)}
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm z-10 relative"
                       >
                         <RefreshCcw size={14} />
                         Refill / Update
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No inventory items found.</div>
          )}
        </div>
      </div>

      {/* REFILL MODAL */}
      <RefillModal 
        isOpen={isRefillOpen}
        selectedItem={selectedItem}
        onClose={() => setIsRefillOpen(false)}
        onSubmit={handleRefillSubmit}
      />
    </div>
  );
}
