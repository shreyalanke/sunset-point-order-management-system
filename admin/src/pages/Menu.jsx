import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  IndianRupee,
  Utensils,
  Layers
} from "lucide-react";

import { getMenuItems } from "../API/menu.js";

export default function Menu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // Stores the FLATTENED list
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING & TRANSFORMATION ---
  async function fetchMenu() {
    try {
      setLoading(true);
      const data = await getMenuItems();
      
      const flatList = [];
      if (data && typeof data === 'object') {
        Object.keys(data).forEach((category) => {
          const categoryItems = data[category];
          if (Array.isArray(categoryItems)) {
            categoryItems.forEach((item) => {
              flatList.push({
                ...item,
                category: category // Add the category key to the item
              });
            });
          }
        });
      }
      
      console.log("Processed Flat Menu:", flatList);
      setItems(flatList);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);
  
  // --- HANDLERS ---
  const handleAddNew = () => navigate("/menu/item/new");
  
  const handleEdit = (item) => {
    navigate(`/menu/item/${item.id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      // Since 'items' is flat, simple filter works
      setItems(prev => prev.filter(item => item.id !== id));
      // Note: You should also call an API to delete from backend here
    }
  };

  // --- GROUPING LOGIC (For Display) ---
  const groupedMenu = useMemo(() => {
    // 1. Filter the flat list based on search
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Group by Category
    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [items, searchQuery]);

  // Get dynamic categories list based on current data
  const displayCategories = Object.keys(groupedMenu);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-sm font-medium text-slate-800 transition-all"
            />
          </div>

          {/* Add Button */}
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-2 text-slate-500 text-sm">Loading menu...</p>
          </div>
        )}

        {/* Categories Loop */}
        {!loading && (
          <div className="space-y-8">
            {displayCategories.map(category => {
              const categoryItems = groupedMenu[category];
              
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  
                  {/* Category Header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 bg-slate-200/50 rounded text-slate-600">
                      <Layers size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700">{category}</h2>
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                      {categoryItems.length} items
                    </span>
                  </div>

                  {/* Table Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/2">Item Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categoryItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                    <Utensils size={16} />
                                </div>
                                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <IndianRupee size={14} className="text-slate-400 mr-1" />
                                {item.price}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {displayCategories.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                  <Utensils className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No items found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or check server connection.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}