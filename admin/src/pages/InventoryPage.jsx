import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  RefreshCcw,
  X,
  Save,
  Edit3,
  TrendingUp,
  LayoutList, 
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react';
import { getAllIngredients, updateIngredientStock } from '../API/inventory';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW: VIEW & SORT STATE ---
  const [viewMode, setViewMode] = useState('flat'); // 'flat' (All) or 'grouped' (Category)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Fetch ingredients on mount
  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllIngredients();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Format relative time for last updated
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return updated.toLocaleDateString();
  };

  // --- SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // --- REFILL MODAL STATE ---
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refillAmount, setRefillAmount] = useState("");
  const [updateMode, setUpdateMode] = useState("add"); 

  // --- SORTING HANDLER ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- COMPUTED DATA (FILTERED & SORTED) ---
  const processedItems = useMemo(() => {
    // 1. Filter
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isLowStock = item.current <= item.threshold;
      
      let matchesFilter = true;
      if (filterStatus === "Low Stock") matchesFilter = isLowStock;
      if (filterStatus === "In Stock") matchesFilter = !isLowStock;

      return matchesSearch && matchesFilter;
    });

    // 2. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        // Handle specific computed columns
        if (sortConfig.key === 'percentage') {
          aValue = (a.current / a.max);
          bValue = (b.current / b.max);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // String comparison
        if (typeof aValue === 'string') {
           aValue = aValue.toLowerCase();
           bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchQuery, filterStatus, sortConfig]);

  // --- GROUPED DATA (FOR CATEGORY VIEW) ---
  const groupedItems = useMemo(() => {
    if (viewMode !== 'grouped') return null;
    
    const groups = {};
    processedItems.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    
    // Sort categories alphabetically
    return Object.keys(groups).sort().reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
  }, [processedItems, viewMode]);

  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.current <= i.threshold).length;

  // --- HANDLERS ---
  const handleRowClick = (item) => {
    navigate(`/inventory/${item.id}`);
  };

  const openRefillModal = (e, item) => {
    e.stopPropagation(); 
    setSelectedItem(item);
    setRefillAmount("");
    setUpdateMode("add");
    setIsRefillOpen(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !refillAmount) return;

    const inputVal = parseFloat(refillAmount);
    try {
      let newAmount;
      if (updateMode === 'add') {
        newAmount = selectedItem.current + inputVal;
      } else {
        newAmount = inputVal;
      }
      newAmount = Math.max(0, newAmount);

      await updateIngredientStock(selectedItem.id, newAmount);
      
      setItems(prev => prev.map(item => {
        if (item.id === selectedItem.id) {
          return { 
            ...item, 
            current: parseFloat(newAmount.toFixed(2)),
            lastRestocked: new Date().toISOString()
          };
        }
        return item;
      }));

      setIsRefillOpen(false);
    } catch (err) {
      console.error("Failed to update stock:", err);
      alert("Failed to update stock. Please try again.");
    }
  };

  const getProgressColor = (current, max, threshold) => {
    const percentage = (current / max) * 100;
    if (current <= threshold) return "bg-red-500"; 
    if (percentage < 50) return "bg-amber-500";   
    return "bg-emerald-500";                      
  };

  // --- COMPONENT: TABLE HEADER ---
  const TableHeader = () => (
    <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
      <tr>
        <th 
          onClick={() => handleSort('name')}
          className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <div className="flex items-center gap-2">
            Ingredient Name
            {sortConfig.key === 'name' ? (
              sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
            ) : <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500"/>}
          </div>
        </th>
        {viewMode !== 'grouped' && (
          <th 
            onClick={() => handleSort('category')}
            className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
          >
             <div className="flex items-center gap-2">
              Category
              {sortConfig.key === 'category' ? (
                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
              ) : <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500"/>}
            </div>
          </th>
        )}
        <th 
          onClick={() => handleSort('percentage')}
          className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3 cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <div className="flex items-center gap-2">
            Stock Level
            {sortConfig.key === 'percentage' ? (
              sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
            ) : <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500"/>}
          </div>
        </th>
        <th 
          onClick={() => handleSort('current')}
          className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <div className="flex items-center gap-2">
            Quantity
            {sortConfig.key === 'current' ? (
              sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
            ) : <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500"/>}
          </div>
        </th>
        <th 
          onClick={() => handleSort('lastRestocked')}
          className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <div className="flex items-center gap-2">
            Last Updated
            {sortConfig.key === 'lastRestocked' ? (
              sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600"/> : <ArrowDown size={14} className="text-blue-600"/>
            ) : <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500"/>}
          </div>
        </th>
        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Actions
        </th>
      </tr>
    </thead>
  );

  // --- COMPONENT: ROW ITEM ---
  const InventoryRow = ({ item }) => {
    const percentage = Math.min((item.current / item.max) * 100, 100);
    const isLow = item.current <= item.threshold;
    const barColor = getProgressColor(item.current, item.max, item.threshold);

    return (
      <tr 
        onClick={() => handleRowClick(item)}
        className="hover:bg-blue-50/30 transition-colors cursor-pointer group bg-white"
      >
        <td className="px-6 py-4 border-b border-slate-50">
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
        {viewMode !== 'grouped' && (
          <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-50">
            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{item.category}</span>
          </td>
        )}
        <td className="px-6 py-4 border-b border-slate-50">
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
        <td className="px-6 py-4 text-sm border-b border-slate-50">
          <span className={`font-bold text-base ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
            {item.current}
          </span>
          <span className="text-slate-500 ml-1 text-xs">{item.unit}</span>
        </td>
        <td className="px-6 py-4 text-sm border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-slate-600">{formatRelativeTime(item.lastRestocked)}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-right border-b border-slate-50">
            <button 
              onClick={(e) => openRefillModal(e, item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm z-10 relative cursor-pointer"
            >
              <RefreshCcw size={14} />
              Refill / Update
            </button>
        </td>
      </tr>
    );
  };


  // --- RENDER: MAIN LIST ---
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
            
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

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-slate-500">Loading inventory...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-6 text-center">
            <p className="text-red-600 font-bold">{error}</p>
            <button 
              onClick={fetchIngredients}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* CONTROLS */}
        {!loading && !error && (
        <>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ingredients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-sm font-medium transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
            {/* View Mode Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode('flat')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'flat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                title="List View"
              >
                <LayoutList size={18} />
                <span className="hidden sm:inline">All</span>
              </button>
              <button 
                onClick={() => setViewMode('grouped')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'grouped' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
                title="Category View"
              >
                <Layers size={18} />
                <span className="hidden sm:inline">Category</span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Status Filter */}
            <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-100 cursor-pointer"
               >
                 <option value="All">All Statuses</option>
                 <option value="Low Stock">Low Stock Only</option>
                 <option value="In Stock">In Stock</option>
            </select>

            {/* Add Button */}
            <button 
              onClick={() => navigate('/inventory/add')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all ml-auto sm:ml-0 cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>

        {/* DATA DISPLAY AREA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* VIEW: FLAT LIST */}
          {viewMode === 'flat' && (
             <table className="min-w-full divide-y divide-slate-200">
               <TableHeader />
               <tbody className="divide-y divide-slate-100">
                 {processedItems.map(item => (
                   <InventoryRow key={item.id} item={item} />
                 ))}
                 {processedItems.length === 0 && (
                   <tr><td colSpan="6" className="p-8 text-center text-slate-500 text-sm">No inventory items found.</td></tr>
                 )}
               </tbody>
             </table>
          )}

          {/* VIEW: GROUPED BY CATEGORY */}
          {viewMode === 'grouped' && (
             <div>
               {Object.keys(groupedItems).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No inventory items found.</div>
               ) : (
                 Object.entries(groupedItems).map(([category, catItems]) => (
                   <div key={category} className="border-b border-slate-200 last:border-0">
                      {/* Group Header */}
                      <div className="bg-slate-50 px-6 py-3 border-y border-slate-200 flex items-center gap-2">
                        <Layers size={16} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{category}</h3>
                        <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{catItems.length}</span>
                      </div>
                      
                      {/* Group Table */}
                      <table className="min-w-full divide-y divide-slate-200">
                        <TableHeader />
                        <tbody className="divide-y divide-slate-100">
                          {catItems.map(item => (
                            <InventoryRow key={item.id} item={item} />
                          ))}
                        </tbody>
                      </table>
                   </div>
                 ))
               )}
             </div>
          )}
          
        </div>
        </>
        )}
      </div>

      {/* --- REFILL MODAL (Same as before) --- */}
      {isRefillOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Update Stock</h3>
              <button 
                onClick={() => setIsRefillOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="p-6 space-y-5">
              
              <div className="text-center mb-2">
                 <p className="text-sm text-slate-500">Updating inventory for</p>
                 <p className="text-xl font-black text-slate-800">{selectedItem.name}</p>
                 <p className="text-xs font-bold text-slate-400 mt-1">Current: {selectedItem.current} {selectedItem.unit}</p>
              </div>

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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">New Stock Level:</span>
                 <span className={`font-bold text-lg ${
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