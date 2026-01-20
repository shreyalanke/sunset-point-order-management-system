import { X } from 'lucide-react';
import MenuSearch from './MenuSearch';
import MenuItemsList from './MenuItemsList';
import OrderItemsListPopup from './OrderItemsListPopup';
import { useEffect, useState } from 'react';
import { getDishes } from '../API/dishes.js';
import { createOrder } from '../API/orders.js';

function OrderPopup({
  searchQuery,
  onSearchChange,
  onConfirm,
  onCancel,
  getOrderTotal
}) {

  let [filteredMenuItems, setFilteredMenuItems] = useState([]);
  let [order, setOrder] = useState({items: []});

  // Fetch and filter menu items based on search query
  useEffect(() => {
    (async () => {
      try {
        let dishes = await getDishes();
        setFilteredMenuItems(dishes);
      } catch (error) {
        console.error("Error fetching dishes:", error);
        let dishes = [];
        setFilteredMenuItems(dishes);
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
    // Check if item already exists in order
    const existingItem = order.items.find(i => i.id === item.id);
    let updatedItems;   
    if (existingItem) {
      // If it exists, increase quantity
      updatedItems = order.items.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      // If not, add new item with quantity 1
      updatedItems = [...order.items, { ...item, quantity: 1 }];
    }   
    setOrder({ ...order, items: updatedItems });
  }


  function onOrderConfirm(){
    (async ()=>{
      try {
        await createOrder(order);
        onConfirm();
      } catch (error) {
        console.error("Error saving order:", error);
      }
    })();
  }


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[1100px] h-[650px] flex flex-col overflow-hidden">
        {/* Popup Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          {/* <div>
            <h2 className="text-xl font-bold text-white">New Order #{order.id}</h2>
            <p className="text-xs text-blue-100 mt-0.5">{order.createdAt}</p>
          </div> */}
          <button
            onClick={onCancel}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Popup Content - Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Order Items */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Order Items</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <OrderItemsListPopup
                items={order.items}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            </div>
          </div>

          {/* Right Side - Menu Items */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Menu Items</h3>
              <MenuSearch searchQuery={searchQuery} onSearchChange={onSearchChange} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <MenuItemsList
                groupedItems={filteredMenuItems}
                onSelectItem={onSelectMenuItem}
              />
            </div>
          </div>
        </div>

        {/* Popup Footer */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-base font-bold text-gray-700">Total:</span>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">${getOrderTotal(order)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-bold shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onOrderConfirm}
              disabled={order.items.length === 0}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPopup;
