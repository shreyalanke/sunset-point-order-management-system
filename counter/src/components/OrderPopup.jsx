import { X, Search, ShoppingBag, UtensilsCrossed, ChevronRight, Calculator, Loader2 } from 'lucide-react';
import MenuItemsList from './MenuItemsList';
import OrderItemsListPopup from './OrderItemsListPopup';
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

  let [filteredMenuItems, setFilteredMenuItems] = useState([]);
  let [order, setOrder] = useState({items: [], tag: ''});
  let [tagError, setTagError] = useState('');
  let [isLoading, setIsLoading] = useState(true);
  let [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch and filter menu items based on search query
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        let dishes = await getDishes();
        setFilteredMenuItems(dishes);
      } catch (error) {
        console.error("Error fetching dishes:", error);
        setFilteredMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
    setIsSubmitting(true); // Start loading

    (async ()=>{
      try {
        await createOrder(order);
        onConfirm();
      } catch (error) {
        console.error("Error saving order:", error);
        setIsSubmitting(false); // Stop loading only if there's an error
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
        <div className="flex-1 flex flex-col bg-gray-50/80">
          
          {/* Menu Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <UtensilsCrossed size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
            </div>

            {/* Integrated Search Bar */}
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

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <MenuItemsList
                groupedItems={filteredMenuItems}
                onSelectItem={onSelectMenuItem}
              />
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE: ORDER TICKET ================= */}
        <div className="w-100 bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)] z-10 relative">
          
          {/* Close Button (Absolute Top Right) */}
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>

          {/* Ticket Header */}
          <div className="px-6 pt-8 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={14} />
              Current Order
            </h3>
            
            {/* Tag Input - Styled as a primary field */}
            <div className="relative">
              <input
                id="order-tag"
                type="text"
                value={order.tag}
                onChange={handleTagChange}
                disabled={isSubmitting}
                placeholder="Table Number / Customer Name"
                className={`
                  w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-lg font-bold text-gray-800 placeholder:font-normal placeholder:text-gray-400
                  focus:outline-none focus:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed
                  ${tagError ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-gray-100 focus:border-blue-500'}
                `}
              />
              {tagError && (
                <div className="absolute -bottom-5 left-1 text-xs text-red-500 font-semibold animate-pulse">
                  {tagError}
                </div>
              )}
            </div>
          </div>

          {/* Order Items Scroll Area */}
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

          {/* Footer / Checkout */}
          <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
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

export default OrderPopup;