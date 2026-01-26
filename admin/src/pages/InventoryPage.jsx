import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  RefreshCcw,
  X,
  Save,
  ArrowLeft,
  Settings,
  Edit3,
  TrendingUp
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_INVENTORY = [
  { id: 1, name: 'Tomato Sauce', current: 4, max: 20, unit: 'liters', threshold: 5, category: 'Sauces' },
  { id: 2, name: 'Mozzarella Cheese', current: 18, max: 20, unit: 'kg', threshold: 5, category: 'Dairy' },
  { id: 3, name: 'Flour', current: 45, max: 50, unit: 'kg', threshold: 10, category: 'Dry Goods' },
  { id: 4, name: 'Pepperoni', current: 2, max: 15, unit: 'kg', threshold: 3, category: 'Meats' }, 
  { id: 5, name: 'Olive Oil', current: 8, max: 10, unit: 'liters', threshold: 2, category: 'Oils' },
  { id: 6, name: 'Basil', current: 0.2, max: 1, unit: 'kg', threshold: 0.3, category: 'Herbs' }, 
  { id: 7, name: 'Chicken Breast', current: 12, max: 30, unit: 'kg', threshold: 8, category: 'Meats' },
];

export default function InventoryPage() {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'detail'
  const [detailItem, setDetailItem] = useState(null); // Item to show in placeholder

  // --- SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // --- REFILL MODAL STATE ---
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refillAmount, setRefillAmount] = useState("");
  const [updateMode, setUpdateMode] = useState("add"); // 'add' or 'set'

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
  
  // 1. Navigation Handler
  const handleRowClick = (item) => {
    setDetailItem(item);
    setActiveView('detail');
  };

  // 2. Open Modal Handler (Stops bubbling so row click isn't triggered)
  const openRefillModal = (e, item) => {
    e.stopPropagation(); 
    setSelectedItem(item);
    setRefillAmount("");
    setUpdateMode("add"); // Default to 'add' when opening
    setIsRefillOpen(true);
  };

  // 3. Submit Stock Update
  const handleRefillSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem || !refillAmount) return;

    const inputVal = parseFloat(refillAmount);
    
    setItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        let newAmount = item.current;
        
        if (updateMode === 'add') {
          newAmount = item.current + inputVal;
        } else {
          // 'set' mode
          newAmount = inputVal;
        }

        // Prevent negative numbers (optional)
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

  // --- RENDER: DETAIL PLACEHOLDER ---
  if (activeView === 'detail') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{detailItem?.name}</h2>
          <p className="text-slate-500 mb-6">Detailed analytics and history for this item are coming soon.</p>
          
          <button 
            onClick={() => setActiveView('list')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            <ArrowLeft size={18} />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN LIST ---
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
                    onClick={() => handleRowClick(item)}
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

      {/* --- ENHANCED REFILL MODAL --- */}
      {isRefillOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Update Stock</h3>
              <button 
                onClick={() => setIsRefillOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRefillSubmit} className="p-6 space-y-5">
              
              <div className="text-center mb-2">
                 <p className="text-sm text-slate-500">Updating inventory for</p>
                 <p className="text-xl font-black text-slate-800">{selectedItem.name}</p>
                 <p className="text-xs font-bold text-slate-400 mt-1">Current: {selectedItem.current} {selectedItem.unit}</p>
              </div>

              {/* Toggle Switch */}
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => setUpdateMode('add')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    updateMode === 'add' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <TrendingUp size={16} />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateMode('set')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    updateMode === 'set' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Edit3 size={16} />
                  Set Total
                </button>
              </div>

              {/* Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                   {updateMode === 'add' ? `Amount to Add (${selectedItem.unit})` : `New Total Count (${selectedItem.unit})`}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  autoFocus
                  required
                  placeholder={updateMode === 'add' ? "e.g. 5.0" : "e.g. 20.0"}
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                />
              </div>

              {/* Calculation Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">New Stock Level:</span>
                 <span className={`font-bold text-lg ${
                    // Logic to check if new value exceeds max
                    (updateMode === 'add' 
                      ? (selectedItem.current + (parseFloat(refillAmount)||0)) 
                      : (parseFloat(refillAmount)||0)) > selectedItem.max 
                      ? 'text-orange-500' 
                      : 'text-slate-800'
                 }`}>
                    {updateMode === 'add' 
                      ? (selectedItem.current + (parseFloat(refillAmount) || 0)).toFixed(2)
                      : (parseFloat(refillAmount) || 0).toFixed(2)
                    } 
                    <span className="text-xs ml-1 text-slate-400 font-normal">{selectedItem.unit}</span>
                 </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsRefillOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                    updateMode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Save size={18} />
                  {updateMode === 'add' ? 'Confirm Add' : 'Update Total'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}