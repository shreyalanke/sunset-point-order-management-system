import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Save, 
  X, 
  TrendingUp, 
  Edit3, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Utensils, 
  History, 
  Truck,
  Scale,
  Search,
  Check,
  ChevronDown,
  Plus
} from 'lucide-react';
import { getIngredientDetails, updateIngredientStock, updateIngredientDetails, getAllIngredients } from '../API/inventory';
import { getCategories } from '../API/menu';

// --- REUSABLE COMPONENT: Searchable Dropdown with Add Option ---
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  labelKey = "name", 
  valueKey = "id",   
  subLabelKey = null,
  allowAdd = false,
  onAddNew = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt[labelKey];
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedObj = options.find(opt => {
    const val = typeof opt === 'string' ? opt : opt[valueKey];
    return val === value;
  });

  const getDisplayLabel = (opt) => typeof opt === 'string' ? opt : opt[labelKey];

  const handleAddNew = () => {
    if (searchTerm.trim() && onAddNew) {
      onAddNew(searchTerm.trim());
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  const isSearchTermNew = searchTerm.trim() && !filteredOptions.some(opt => {
    const label = typeof opt === 'string' ? opt : opt[labelKey];
    return label.toLowerCase() === searchTerm.toLowerCase();
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(""); }}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-lg cursor-pointer transition-all ${
          isOpen ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={`text-sm ${
          selectedObj ? 'text-slate-800 font-medium' : 'text-slate-400'
        }`}>
          {selectedObj ? getDisplayLabel(selectedObj) : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden left-0">
          
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-500 placeholder-slate-400"
                placeholder="Search or type to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 && !isSearchTermNew ? (
              <div className="p-3 text-sm text-slate-400 text-center">No results found</div>
            ) : (
              <>
                {filteredOptions.map((opt, idx) => {
                  const optValue = typeof opt === 'string' ? opt : opt[valueKey];
                  const optLabel = typeof opt === 'string' ? opt : opt[labelKey];
                  const optSubLabel = subLabelKey && typeof opt !== 'string' ? opt[subLabelKey] : null;
                  const isSelected = optValue === value;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        onChange(optValue);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${
                        isSelected ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{optLabel}</span>
                        {optSubLabel && <span className="text-xs text-slate-400">{optSubLabel}</span>}
                      </div>
                      {isSelected && <Check size={14} />}
                    </div>
                  );
                })}
                
                {/* Add New Option Button */}
                {allowAdd && isSearchTermNew && (
                  <div
                    onClick={handleAddNew}
                    className="px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-blue-50 border-t border-slate-100 text-blue-600 font-medium"
                  >
                    <Plus size={14} />
                    <span>Add "{searchTerm}"</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function InventoryItemDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- STATES FOR MODALS & EDITING ---
  const [isEditing, setIsEditing] = useState(false);
  const [stockMode, setStockMode] = useState('add'); // 'add' or 'set'
  const [stockInput, setStockInput] = useState('');
  
  // Form State for editing details
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  // Fetch Categories and Units
  useEffect(() => {
    const loadData = async () => {
      try {
        const ingredients = await getAllIngredients();
        
        // Extract unique categories
        const uniqueCategories = [...new Set(ingredients.map(ing => ing.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
        // Extract unique units
        const uniqueUnits = [...new Set(ingredients.map(ing => ing.unit).filter(Boolean))];
        const unitsArray = uniqueUnits.map(unit => ({
          value: unit,
          label: unit.charAt(0).toUpperCase() + unit.slice(1)
        }));
        setUnits(unitsArray);
      } catch (error) {
        console.error("Error fetching data", error);
        setCategories([]);
        setUnits([]);
      }
    };
    loadData();
  }, []);

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const details = await getIngredientDetails(id);
        setItem(details);
        setFormData(details);
        // Add item's category to the list if it doesn't exist
        if (details.category && !categories.includes(details.category)) {
          setCategories(prev => [...prev, details.category]);
        }
      } catch (error) {
        console.error("Error fetching details", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleAddNewCategory = (newCategory) => {
    if (!categories.includes(newCategory)) {
      setCategories(prev => [...prev, newCategory]);
    }
    setFormData(prev => ({ ...prev, category: newCategory }));
  };

  const handleAddNewUnit = (newUnit) => {
    const newUnitObj = { value: newUnit.toLowerCase(), label: newUnit };
    if (!units.find(u => u.value === newUnit.toLowerCase())) {
      setUnits(prev => [...prev, newUnitObj]);
    }
    setFormData(prev => ({ ...prev, unit: newUnit.toLowerCase() }));
  };

  // --- HANDLERS ---

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(stockInput);
    if (isNaN(val)) return;

    let newAmount;
    if (stockMode === 'add') {
      newAmount = item.current + val;
    } else {
      newAmount = val;
    }

    try {
      // Optimistic UI Update
      const updatedItem = { ...item, current: parseFloat(newAmount.toFixed(2)) };
      setItem(updatedItem);
      setFormData(updatedItem);
      
      await updateIngredientStock(item.id, newAmount);
      
      setStockInput('');
      alert("Stock updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update stock");
    }
  };

  const handleDetailsUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateIngredientDetails(item.id, formData);
      setItem({ ...formData });
      setIsEditing(false);
      alert("Item details updated!");
    } catch (error) {
      console.error("Error updating details:", error);
      alert("Failed to update details");
    }
  };

  const getPercentage = (current, max) => Math.min((current / max) * 100, 100);
  const getStatusColor = (current, max, threshold) => {
    if (current <= threshold) return 'text-red-600 bg-red-50 border-red-200';
    if ((current / max) < 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading item details...</div>;

  if (!item) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold text-slate-800">Item Not Found</h2>
      <button onClick={() => navigate('/inventory')} className="mt-4 text-blue-600 font-bold">Return to Inventory</button>
    </div>
  );

  const percentage = getPercentage(item.current, item.max);
  const statusClasses = getStatusColor(item.current, item.max, item.threshold);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/inventory')}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {item.name}
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase">
                    {item.category}
                  </span>
                </h1>
              
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                isEditing ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 '
              }`}
            >
              {isEditing ? <X size={16} /> : <Settings size={16} />}
              {isEditing ? 'Cancel Edit' : 'Edit Details'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* --- EDIT MODE --- */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center gap-2 mb-6 text-blue-600">
                <Edit3 size={20} />
                <h3 className="font-bold text-lg">Edit Configuration</h3>
             </div>
             <form onSubmit={handleDetailsUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <SearchableDropdown
                    options={categories}
                    value={formData.category}
                    onChange={(val) => setFormData({...formData, category: val})}
                    placeholder="Select a category"
                    allowAdd={true}
                    onAddNew={handleAddNewCategory}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Capacity</label>
                      <input 
                        type="number" 
                        value={formData.max} 
                        onChange={(e) => setFormData({...formData, max: parseFloat(e.target.value)})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alert Threshold</label>
                      <input 
                        type="number" 
                        value={formData.threshold} 
                        onChange={(e) => setFormData({...formData, threshold: parseFloat(e.target.value)})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800" 
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit of Measure</label>
                   <SearchableDropdown
                     options={units}
                     value={formData.unit}
                     onChange={(val) => setFormData({...formData, unit: val})}
                     placeholder="Select unit..."
                     labelKey="label"
                     valueKey="value"
                     allowAdd={true}
                     onAddNew={handleAddNewUnit}
                   />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                   <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-lg text-slate-500 font-bold hover:bg-slate-100 cursor-pointer">Cancel</button>
                   <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 cursor-pointer">
                     <Save size={18} /> Save Changes
                   </button>
                </div>
             </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT COLUMN: STOCK OVERVIEW --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Status Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Current Stock Level</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800">{item.current}</span>
                    <span className="text-lg font-bold text-slate-400">{item.unit}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${statusClasses}`}>
                  {item.current <= item.threshold ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
                  <span className="font-bold text-sm">
                    {item.current <= item.threshold ? 'Low Stock Alert' : 'Stock Healthy'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative pt-2 pb-6">
                 <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>0 {item.unit}</span>
                    <span>50%</span>
                    <span>Max: {item.max} {item.unit}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        item.current <= item.threshold ? 'bg-red-500' : (percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500')
                      }`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                 </div>
                 {/* Threshold Marker */}
                 <div 
                   className="absolute top-6 bottom-4 w-0.5 bg-red-400 border-l border-dashed border-red-500 z-10" 
                   style={{ left: `${(item.threshold / item.max) * 100}%` }}
                   title={`Threshold: ${item.threshold}`}
                 >
                    <div className="absolute -top-5 -left-2 text-[10px] font-bold text-red-500">Alert</div>
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                 <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Max Capacity</p>
                    <p className="font-bold text-slate-700">{item.max} {item.unit}</p>
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reorder Point</p>
                    <p className="font-bold text-red-600">{item.threshold} {item.unit}</p>
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Cost / Unit</p>
                    <p className="font-bold text-slate-700">$2.50 <span className="text-[10px] text-slate-400 font-normal">(Est.)</span></p>
                 </div>
              </div>
            </div>

            {/* Menu Usage Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Utensils size={18} className="text-slate-400" />
                  Menu Usage
                </h3>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-500">
                  {item.associatedDishes?.length || 0} Dishes
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {item.associatedDishes?.map((dish) => (
                  <div key={dish.id} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="font-bold text-slate-700 text-sm">{dish.name}</span>
                    <span className="text-xs text-slate-500">Uses <span className="font-bold text-slate-800">{dish.quantityRequired} {item.unit}</span></span>
                  </div>
                ))}
                {(!item.associatedDishes || item.associatedDishes.length === 0) && (
                  <div className="p-6 text-center text-slate-400 text-sm">Not currently linked to any menu items.</div>
                )}
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: ACTIONS & HISTORY --- */}
          <div className="space-y-6">
            
            {/* Quick Actions / Restock */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Package size={18} className="text-blue-600" />
                 Update Stock
               </h3>
               
               {/* Mode Toggle */}
               <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                 <button 
                   onClick={() => setStockMode('add')}
                   className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all  ${
                     stockMode === 'add' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 cursor-pointer'
                   }`}
                 >
                   <TrendingUp size={14} /> Add (Receive)
                 </button>
                 <button 
                   onClick={() => setStockMode('set')}
                   className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                     stockMode === 'set' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 cursor-pointer'
                   }`}
                 >
                   <Scale size={14} /> Set (Audit)
                 </button>
               </div>

               <form onSubmit={handleStockSubmit}>
                 <div className="relative mb-3">
                   <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{item.unit}</span>
                 </div>

                 {/* Calculations Preview */}
                 {stockInput && (
                   <div className="flex justify-between items-center px-2 mb-4 text-xs">
                     <span className="text-slate-400">Resulting Stock:</span>
                     <span className="font-bold text-slate-800">
                        {stockMode === 'add' 
                          ? (item.current + parseFloat(stockInput)).toFixed(2)
                          : parseFloat(stockInput).toFixed(2)
                        } {item.unit}
                     </span>
                   </div>
                 )}

                 <button 
                   type="submit" 
                   disabled={!stockInput}
                   className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                 >
                   <Save size={16} />
                   {stockMode === 'add' ? 'Confirm Restock' : 'Update Inventory'}
                 </button>
               </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}