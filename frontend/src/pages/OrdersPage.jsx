import { useEffect, useState } from 'react';
import Header from '../components/Header';
import OrderPopup from '../components/OrderPopup';
import CreateOrderButton from '../components/CreateOrderButton';
import EmptyState from '../components/EmptyState';
import OrderCard from '../components/OrderCard';
import { MENU_ITEMS } from '../data/menuItems';
import { getOrders } from '../API/orders.js';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: null, orderId: null });

  useEffect(() => {
    // get orders from server
    (async () => {
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    })();
  }, []);

  // Create a new order (open popup)
  const createOrder = () => {
    setShowOrderPopup(true);
  };

  // Confirm order (save to orders list)
  const confirmOrder = () => {
    setOrders([]);
    (async () => {
      let orders = await getOrders();
      setOrders(orders);
    })()
    setShowOrderPopup(false);
  };

  // Cancel order creation
  const cancelOrderCreation = () => {
    setShowOrderPopup(false);
    setCurrentOrder(null);
    setSearchQuery('');
  };

  // Update item quantity
  const updateItemQuantity = (itemId, newQuantity, isPopup = false) => {
    if (newQuantity < 1) return;
    
    if (isPopup && currentOrder) {
      setCurrentOrder({
        ...currentOrder,
        items: currentOrder.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      });
    } else {
      setOrders(orders.map(order => {
        if (order.id === selectedOrderId) {
          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
          };
        }
        return order;
      }));
    }
  };

  // Toggle item served status
  const toggleItemServed = (orderId, itemId) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item =>
            item.id === itemId 
              ? { ...item, status: item.status === 'served' ? 'pending' : 'served' } 
              : item
          )
        };
      }
      return order;
    }));
  };

  // Cancel item
  const cancelItem = (itemId, isPopup = false) => {
    if (isPopup && currentOrder) {
      setCurrentOrder({
        ...currentOrder,
        items: currentOrder.items.filter(item => item.id !== itemId)
      });
    } else {
      setOrders(orders.map(order => {
        if (order.id === selectedOrderId) {
          return {
            ...order,
            items: order.items.filter(item => item.id !== itemId)
          };
        }
        return order;
      }));
    }
  };

  // Cancel entire order
  const requestCancelOrder = (orderId) => {
    setConfirmDialog({ show: true, type: 'cancel', orderId });
  };

  const cancelOrder = () => {
    const orderId = confirmDialog.orderId;
    setOrders(orders.filter(order => order.id !== orderId));
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
    }
    setConfirmDialog({ show: false, type: null, orderId: null });
  };

  // Close order (mark as completed)
  const requestCloseOrder = (orderId) => {
    setConfirmDialog({ show: true, type: 'close', orderId });
  };

  const closeOrder = () => {
    const orderId = confirmDialog.orderId;
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'closed', closedAt: new Date().toLocaleTimeString() }
        : order
    ));
    setConfirmDialog({ show: false, type: null, orderId: null });
  };

  // Toggle payment status
  const togglePaymentStatus = (orderId) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, paymentDone: !order.paymentDone }
        : order
    ));
  };

  // Calculate order total
  const getOrderTotal = (order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {confirmDialog.type === 'close' ? 'Close Order?' : 'Cancel Order?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.type === 'close' 
                ? `Are you sure you want to close Order #${confirmDialog.orderId}? This will mark the order as completed.`
                : `Are you sure you want to cancel Order #${confirmDialog.orderId}? This action cannot be undone.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({ show: false, type: null, orderId: null })}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmDialog.type === 'close' ? closeOrder : cancelOrder}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-semibold text-white ${
                  confirmDialog.type === 'close'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Yes, {confirmDialog.type === 'close' ? 'Close' : 'Cancel'} it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Creation Popup */}
      {showOrderPopup && (
        <OrderPopup
          // order={currentOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onConfirm={confirmOrder}
          onCancel={cancelOrderCreation}
          getOrderTotal={getOrderTotal}
        />
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Order Button */}
        <div className="mb-8">
          <CreateOrderButton onClick={createOrder} />
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateQuantity={(itemId, newQuantity) => updateItemQuantity(itemId, newQuantity, false)}
                onRemoveItem={(itemId) => cancelItem(itemId, false)}
                onToggleServed={toggleItemServed}
                onCancelOrder={requestCancelOrder}
                onCloseOrder={requestCloseOrder}
                onTogglePayment={togglePaymentStatus}
                getOrderTotal={getOrderTotal}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrdersPage;
