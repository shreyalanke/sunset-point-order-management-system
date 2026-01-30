import { X, Search, ShoppingBag, UtensilsCrossed, ChevronRight, Calculator, Loader2 } from 'lucide-react';
import OrderItemsListPopup from './OrderItemsListPopup'; // Assuming this exists as per your previous code
import { useEffect, useState } from 'react';
import { getDishes } from '../API/dishes.js';
import { createOrder } from '../API/orders.js';

function OrderPopup({
  searchQuery,
  onSearchChange,
  onConfirm,
  onCancel
}) {

  let getOrderTotal = function(order) {
    return order.items
      .reduce((sum, item) => sum + item.price * item.quantity / 100, 0);
  }

  const [filteredMenuItems, setFilteredMenuItems] = useState({});
  const [activeCategory, setActiveCategory] = useState(''); // New state for selected tab
  const [order, setOrder] = useState({items: [], tag: ''});
  const [tagError, setTagError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch and filter menu items based on search query
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        let dishes = await getDishes();
        let newFilteredItems = {};
        
        Object.keys(dishes).forEach(category => {
          // If category matches search
          if(category.toLowerCase().includes(searchQuery.toLowerCase())) {
            newFilteredItems[category] = dishes[category];
            return;
          }
          // Or if specific dishes match search
          const matchingDishes = dishes[category].filter(dish => 
            dish.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (matchingDishes.length > 0) {
            newFilteredItems[category] = matchingDishes;
          }
        });

        setFilteredMenuItems(newFilteredItems);

        // Auto-select the first category if the current active one is missing (or on first load)
        const categories = Object.keys(newFilteredItems);
        if (categories.length > 0) {
           if (!activeCategory || !newFilteredItems[activeCategory]) {
             setActiveCategory(categories[0]);
           }
        } else {
           setActiveCategory('');
        }

      } catch (error) {
        console.error("Error fetching dishes:", error);
        setFilteredMenuItems({});
      } finally {
        setIsLoading(false);
      }
    })();
  }, [searchQuery]);

  function onUpdateQuantity(itemId, newQuantity) {
    const updatedItems = order.items.map(i => 
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );
    setOrder({ ...order, items: updatedItems });
  }

  function onRemoveItem(itemId) {
    const updatedItems = order.items.filter(i => i.id !== itemId);
    setOrder({ ...order, items: updatedItems });
  }

  function onSelectMenuItem(item) {
    const existingItem = order.items.find(i => i.id === item.id);
    let updatedItems;   
    if (existingItem) {
      updatedItems = order.items.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updatedItems = [...order.items, { ...item, quantity: 1 }];
    }   
    setOrder({ ...order, items: updatedItems });
  }

  function onOrderConfirm(){
    if (!order.tag || order.tag.trim() === '') {
      setTagError('Table/Tag name is required');
      return;
    }
    
    setTagError('');
    setIsSubmitting(true);

    (async ()=>{
      try {
        await createOrder(order);
        onConfirm();
      } catch (error) {
        console.error("Error saving order:", error);
        setIsSubmitting(false);
      }
    })();
  }

  function handleTagChange(e) {
    const value = e.target.value;
    setOrder({ ...order, tag: value });
    if (value.trim() !== '') {
      setTagError('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-black/5 relative">
        
        {/* ================= LEFT SIDE: MENU & SEARCH ================= */}
        <div className="flex-1 flex flex-col bg-white">
          
          {/* Menu Header & Search */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <UtensilsCrossed size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search dishes..." 
                value={searchQuery}
                onChange={onSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Main Content Area: Split View */}
          <div className="flex-1 flex overflow-hidden">
            
            {isLoading ? (
               <div className="flex-1 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
            ) : Object.keys(filteredMenuItems).length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                 <Search size={40} className="mb-2 opacity-50"/>
                 <p>No items found</p>
               </div>
            ) : (
              <>
                {/* 1. Category Sidebar (Left) */}
                <div className="w-1/4 min-w-[180px] bg-gray-50 border-r border-gray-200 overflow-y-auto">
                   <div className="p-2 space-y-1">
                      {Object.keys(filteredMenuItems).map(category => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`
                            w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-between
                            ${activeCategory === category 
                              ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200 border-l-4 border-blue-600' 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'}
                          `}
                        >
                          <span className="truncate">{category}</span>
                          {activeCategory === category && <ChevronRight size={14} className="text-blue-600"/>}
                        </button>
                      ))}
                   </div>
                </div>

                {/* 2. Items List (Right) */}
                <div className="flex-1 bg-white overflow-y-auto p-4 custom-scrollbar">
                   {/* Header for selected category */}
                   <div className="mb-4 pb-2 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{activeCategory}</h3>
                        <p className="text-xs text-gray-400 font-medium">
                          {filteredMenuItems[activeCategory]?.length || 0} items available
                        </p>
                      </div>
                   </div>

                   {/* Grid of Items */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredMenuItems[activeCategory]?.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onSelectMenuItem(item)}
                          className="flex flex-col text-left p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer h-full"
                        >
                           <div className="flex justify-between items-start w-full mb-2">
                              <span className="font-semibold text-gray-800 line-clamp-2">{item.name}</span>
                           </div>
                           <div className="mt-auto pt-2 flex justify-between items-center w-full">
                              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                ₹{(item.price / 100).toFixed(2)}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlusIcon size={16} />
                              </div>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE: ORDER TICKET ================= */}
        {/* (This section remains largely unchanged from your original code) */}
        <div className="w-[400px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10 relative">
          
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="px-6 pt-8 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={14} />
              Current Order
            </h3>
            
            <div className="relative">
              <input
                type="text"
                value={order.tag}
                onChange={handleTagChange}
                disabled={isSubmitting}
                placeholder="Customer / Table Name"
                className={`
                  w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-lg font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400
                  focus:outline-none focus:bg-white transition-all
                  ${tagError ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-gray-100 focus:border-blue-500'}
                `}
              />
              {tagError && (
                <div className="absolute -bottom-5 left-1 text-xs text-red-500 font-semibold">
                  {tagError}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {order.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calculator size={32} />
                </div>
                <p className="text-sm font-medium">No items selected</p>
              </div>
            ) : (
              <OrderItemsListPopup
                items={order.items}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            )}
          </div>

          <div className="p-6 bg-white border-t border-gray-200">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>Items Count</span>
                <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-gray-900 font-bold text-lg">Total</span>
                <span className="text-3xl font-black text-blue-600 tracking-tight">
                  ₹{getOrderTotal(order)}
                </span>
              </div>
            </div>

            <button
              onClick={onOrderConfirm}
              disabled={order.items.length === 0 || isSubmitting}
              className={`
                w-full py-4 px-6 rounded-xl flex items-center justify-between group font-bold text-lg shadow-lg
                transition-all duration-200
                ${(order.items.length === 0 || isSubmitting)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 cursor-pointer'}
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center w-full gap-2">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <span>Place Order</span>
                  <ChevronRight className={`transition-transform duration-200 ${order.items.length > 0 ? 'group-hover:translate-x-1' : ''}`} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Helper for the Plus Icon
const PlusIcon = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default OrderPopup;