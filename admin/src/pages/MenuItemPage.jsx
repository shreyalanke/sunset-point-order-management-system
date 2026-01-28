import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  ChefHat, 
  IndianRupee, 
  Tag, 
  Scale, 
  Package,
  Search,
  Check,
  ChevronDown
} from 'lucide-react';
import { getCategories, getMenuItemById, updateMenuItem } from '../API/menu';
import { getAllIngredients } from '../API/inventory';

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

      {/* Dropdown Menu - Added z-50 to ensure it floats on top */}
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

// --- MAIN PAGE ---
export default function MenuItemPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id && id !== 'new' && id !== 'create';

  const [itemDetails, setItemDetails] = useState({
    name: '',
    price: '',
    category: '',
  });
  const [ingredientsList, setIngredientsList] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchItemById(id) {
    let result = await getMenuItemById(id);
    if (result) {
      let dish = result.dish;
      setItemDetails({
        name: dish.dish_name || '',
        price: dish.price ? (dish.price / 100).toFixed(2) : '',
        category: dish.category || '',
      });
      let ingredients = result.ingredients || [];
      setIngredientsList(ingredients);
    }
  }

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      fetchItemById(id).then(() => setLoading(false));
    }
  }, [isEditMode, id]);
  
  async function fetchData() {
    try {
      const data = await getCategories();
      setCategories(data);
      const allIngredientsData = await getAllIngredients();
      setAllIngredients(allIngredientsData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }
  
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Add item's category to the list if it doesn't exist
    if (itemDetails.category && !categories.includes(itemDetails.category)) {
      setCategories(prev => [...prev, itemDetails.category]);
    }
  }, [itemDetails.category]);

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setItemDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (val) => {
    setItemDetails(prev => ({ ...prev, category: val }));
  };

  const handleAddNewCategory = (newCategory) => {
    if (!categories.includes(newCategory)) {
      setCategories(prev => [...prev, newCategory]);
    }
    setItemDetails(prev => ({ ...prev, category: newCategory }));
  };

  const handleAddIngredient = () => {
    if (!selectedIngId || !quantityInput) return;
    const exists = ingredientsList.find(item => item.id === selectedIngId);
    if (exists) {
      alert("Ingredient already exists in the list.");
      return;
    }
    const ingredientObj = allIngredients.find(ing => ing.id === selectedIngId);
    const newIngredient = { ...ingredientObj, quantity: quantityInput };
    setIngredientsList([...ingredientsList, newIngredient]);
    setSelectedIngId('');
    setQuantityInput('');
  };

  const handleRemoveIngredient = (id) => {
    setIngredientsList(ingredientsList.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!itemDetails.name || !itemDetails.price || !itemDetails.category) {
      alert("Please fill in Name, Price, and Category.");
      return;
    }
    setLoading(true);
    const payload = {
      ...(isEditMode && { id: id }), 
      ...itemDetails,
      price: Math.round(parseFloat(itemDetails.price) * 100),
      recipe: ingredientsList.map(ing => ({
        ingredientId: ing.id,
        quantity: parseFloat(ing.quantity)
      }))
    };
    try {
      await updateMenuItem(payload);
      alert("Saved successfully!");
      navigate('/menu');
    } catch (error) {
      console.error("Failed to save menu item:", error);
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer "
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {isEditMode ? 'Edit Menu Item' : 'Create New Item'}
              </h1>
          
            </div>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => navigate('/menu')} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm disabled:opacity-70 cursor-pointer"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* --- CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Basic Info */}
          <div className="lg:col-span-1 space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 relative">
              
              {/* Added 'rounded-t-xl' to keep the header rounded since parent overflow is visible */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Tag size={18} className="text-slate-500" />
                  Basic Information
                </h3>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ChefHat size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={itemDetails.name}
                      onChange={handleDetailChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none"
                      placeholder="e.g. Margherita Pizza"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={itemDetails.price}
                      onChange={handleDetailChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="relative z-50"> {/* Added z-50 wrapper just in case */}
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
                  <SearchableDropdown 
                    options={categories}
                    value={itemDetails.category}
                    onChange={handleCategoryChange}
                    placeholder="Select Category..."
                    allowAdd={true}
                    onAddNew={handleAddNewCategory}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Inventory/Recipe */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 h-full flex flex-col relative">
              
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Package size={18} className="text-slate-500" />
                  Recipe Configuration
                </h3>
                
              </div>

              <div className="p-5 flex-grow flex flex-col gap-6">
                
                {/* Add Ingredient Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                   <div className="flex flex-col sm:flex-row gap-4 items-end">
                      
                      {/* Ingredient Searchable Select */}
                      <div className="flex-grow w-full relative z-40">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Ingredient</label>
                        <SearchableDropdown 
                          options={allIngredients}
                          value={selectedIngId}
                          onChange={setSelectedIngId}
                          placeholder="Search ingredients..."
                          labelKey="name"
                          valueKey="id"
                          subLabelKey="unit"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0.0"
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(e.target.value)}
                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-100 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddIngredient}
                        disabled={!selectedIngId || !quantityInput}
                        className={` w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          (!selectedIngId || !quantityInput) ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <Plus size={18} />
                        Add
                      </button>
                   </div>
                </div>

                {/* Ingredients Table */}
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ingredient</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {ingredientsList.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-12 text-center text-slate-400 text-sm">
                            No ingredients added yet.
                          </td>
                        </tr>
                      ) : (
                        ingredientsList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <span className="font-bold text-slate-800">{item.quantity}</span> 
                              <span className="text-xs text-slate-500 ml-1 uppercase">{item.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveIngredient(item.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}