import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import OrderPopup from "../components/OrderPopup";
import OrderCard from "../components/OrderCard";
import {
  getOrders,
  closeOrder,
  toggleServedStatus,
  deleteItemFromOrder,
  toggleOrderPayment,
} from "../API/orders.js";
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  IndianRupeeIcon,
  Menu,
  ReceiptIndianRupeeIcon,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Utensils, // Imported Utensils icon
} from "lucide-react";
import dayjs from "dayjs";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active"); // 'all', 'active', 'closed'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: null,
    orderId: null,
    callBack: null,
  });

  // --- Data Fetching ---
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const fetchedOrders = await getOrders();
    setOrders(fetchedOrders);
  };

  // --- Computed Stats & Helpers ---
  const getOrderTotal = (order) => {
    return order.orderTotal;
  };

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "CLOSED").length;
    const closed = orders.filter((o) => o.status === "CLOSED").length;
    const revenue = orders
      .filter((o) => o.paymentDone)
      .reduce((sum, order) => {
        return sum + parseFloat(getOrderTotal(order));
      }, 0);
    return { active, closed, revenue };
  }, [orders]);

  // --- Filtering Logic ---
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active")
      return matchesSearch && order.status !== "CLOSED";
    if (filterStatus === "closed")
      return matchesSearch && order.status === "CLOSED";
    return matchesSearch;
  });

  const visibleOrders = useMemo(() => {
    return filteredOrders.sort((a, b) => {
      // Sort by status (active first) then by ID (newest first)
      if (a.status === "CLOSED" && b.status !== "CLOSED") return 1;
      if (b.status === "CLOSED" && a.status !== "CLOSED") return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredOrders]);

  // --- Handlers ---
  const handleCreateOrder = () => setShowOrderPopup(true);

  const handleConfirmOrderCreation = () => {
    fetchOrders();
    setShowOrderPopup(false);
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item,
        ),
      })),
    );
  };

  const handleRemoveItem = (itemId) => {
    (async () => {
      try {
        await deleteItemFromOrder(itemId);
        setOrders((prev) =>
          prev.map((order) => ({
            ...order,
            items: order.items.filter((item) => item.id !== itemId),
          })),
        );
      } catch (error) {
        console.log(error);
      }
    })();
  };

  const handleToggleServed = (orderId, itemId) => {
    (async () => {
      try {
        let result = await toggleServedStatus(orderId, itemId);
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== orderId) return order;
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      status: result.status,
                    }
                  : item,
              ),
            };
          }),
        );
      } catch (error) {
        console.log(error);
      }
    })();
  };

  const handleTogglePayment = (orderId) => {
    (async () => {
      try {
        let result = await toggleOrderPayment(orderId);
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, paymentDone: result.isPaymentDone }
              : order,
          ),
        );
      } catch (error) {
        console.log(error);
      }
    })();
  };

  const openConfirmDialog = (type, orderId, callBack) =>
    setConfirmDialog({ show: true, type, orderId, callBack });

  const executeDialogAction = () => {
    const { type, orderId } = confirmDialog;
    if (type === "cancel") {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (confirmDialog.callBack) confirmDialog.callBack();
      if (selectedOrderId === orderId) setSelectedOrderId(null);
      setConfirmDialog({
        show: false,
        type: null,
        orderId: null,
        callBack: null,
      });
    } else if (type === "close") {
      (async () => {
        try {
          await closeOrder(orderId);
          fetchOrders();
          setConfirmDialog({
            show: false,
            type: null,
            orderId: null,
            callBack: null,
          });
        } catch (err) {
          console.error("Error closing order:", err);
        } finally {
          if (confirmDialog.callBack) confirmDialog.callBack();
        }
      })();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-slate-900">
      <Header />

      {/* --- Dashboard Stats Bar --- */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Active Orders"
              value={stats.active}
              icon={Clock}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              label="Ready / Closed"
              value={stats.closed}
              icon={CheckCircle2}
              color="text-green-600"
              bg="bg-green-50"
            />
            <StatCard
              label="Total Revenue"
              value={`₹${stats.revenue.toFixed(2)}`}
              icon={IndianRupeeIcon}
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <button
              onClick={handleCreateOrder}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
              <span>New Order</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row w-full flex-1 gap-6 h-[calc(100vh-180px)]">
        {/* --- Sidebar (Detailed List) --- */}
        <aside
          className={`
          w-full lg:w-87.5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0
          ${isSidebarOpen ? "fixed inset-0 z-40 m-4 lg:m-0 lg:static" : "hidden lg:flex"}
        `}
        >
          {/* Mobile Close Button */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Search Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ReceiptIndianRupeeIcon size={18} className="text-blue-600" />
              Orders List
            </h2>
            <div className="relative mb-3 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>

            <div className="flex bg-gray-100/50 p-1 rounded-lg">
              {["active", "closed", "all"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`
                    flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all
                    ${
                      filterStatus === tab
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/50 cursor-pointer"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-gray-50/30">
            {visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <ReceiptIndianRupeeIcon size={32} className="mb-2 opacity-20" />
                <p>No orders found</p>
              </div>
            ) : (
              visibleOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                const total = getOrderTotal(order);
                const itemCount = order.items.reduce(
                  (acc, item) => acc + item.quantity,
                  0,
                );

                // Calculate Pending Items
                const pendingItems = order.items.filter(
                  (item) => item.status !== "SERVED",
                ).length;
                const isFullyServed = pendingItems === 0 && itemCount > 0;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? order.status === "CLOSED"
                            ? "bg-[#F3F4F6] border-green-700 shadow-lg"
                            : "bg-blue-600 border-blue-600 shadow-md shadow-blue-200"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                      }
                    `}
                  >
                    {/* Top Row: ID and Time */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${isSelected && order.status !== "CLOSED" ? "text-white" : "text-gray-900"}`}
                        >
                          #{order.tag}
                        </span>
                        {order.status === "CLOSED" && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isSelected && order.status !== "CLOSED" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
                          >
                            Closed
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${isSelected && order.status !== "CLOSED" ? "text-blue-100" : "text-gray-400"} flex items-center gap-1`}
                      >
                        {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </span>
                    </div>

                    {/* Bottom Row: Details */}
                    <div className="flex justify-between items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs ${isSelected && order.status !== "CLOSED" ? "text-blue-100" : "text-gray-500"}`}
                        >
                          {itemCount} items
                        </span>

                        {/* PENDING ITEMS BADGE - ONLY SHOW IF NOT CLOSED */}
                        {order.status !== "CLOSED" && pendingItems > 0 && (
                          <div
                            className={`
                            flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded animate-pulse
                            ${isSelected && order.status !== "CLOSED" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600 border border-orange-100"}
                          `}
                          >
                            <Utensils size={10} />
                            {pendingItems} Left
                          </div>
                        )}

                        {/* ALL SERVED BADGE - OPTIONAL */}
                        {order.status !== "CLOSED" && isFullyServed && (
                          <span
                            className={`text-[10px] font-bold ${isSelected && order.status !== "CLOSED" ? "text-blue-200" : "text-blue-400"}`}
                          >
                            All Served
                          </span>
                        )}

                        {/* Payment Icon Indicator */}
                        {order.paymentDone && (
                          <div
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase ${isSelected && order.status !== "CLOSED" ? "text-green-300" : "text-green-600 bg-green-50 px-1.5 py-0.5 rounded"}`}
                          >
                            <CreditCard size={10} />
                            Paid
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-lg font-black ${isSelected && order.status !== "CLOSED" ? "text-white" : "text-gray-900"}`}
                      >
                        ₹{total}
                      </span>
                    </div>

                    {/* Active Indicator Arrow */}
                    {isSelected && (
                      <ChevronRight
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20"
                        size={40}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          {/* Mobile Toggle Bar */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 w-full"
            >
              <Menu size={16} />
              View Order List ({visibleOrders.length})
            </button>
          </div>

          {selectedOrderId ? (
            <div className="h-full overflow-y-auto pb-20 custom-scrollbar pr-1">
              <OrderCard
                order={orders.find((o) => o.id === selectedOrderId)}
                onRemoveItem={handleRemoveItem}
                onToggleServed={handleToggleServed}
                onCancelOrder={async (callBack) =>
                  openConfirmDialog("cancel", selectedOrderId, callBack)
                }
                onCloseOrder={(callBack) =>
                  openConfirmDialog("close", selectedOrderId, callBack)
                }
                onTogglePayment={handleTogglePayment}
                getOrderTotal={getOrderTotal}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 text-center p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ReceiptIndianRupeeIcon className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Order Selected
              </h3>
              <p className="text-gray-500 max-w-sm">
                Select an order from the list on the left to view details,
                manage items, or process payments.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* --- Global Confirmation Dialog --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === "close" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
              >
                {confirmDialog.type === "close" ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <AlertCircle size={24} />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {confirmDialog.type === "close"
                  ? "Complete Order?"
                  : "Cancel Order?"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {confirmDialog.type === "close"
                  ? "This will mark the order as delivered and move it to history."
                  : "Are you sure? This action will permanently remove the order."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    confirmDialog.callBack && confirmDialog.callBack();
                    setConfirmDialog({
                      show: false,
                      type: null,
                      orderId: null,
                    });
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={executeDialogAction}
                  className={`px-4 py-2 text-white rounded-lg font-medium shadow-md transition-colors ${
                    confirmDialog.type === "close"
                      ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                      : "bg-red-600 hover:bg-red-700 shadow-red-200"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Create Order Popup --- */}
      {showOrderPopup && (
        <OrderPopup
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          onConfirm={handleConfirmOrderCreation}
          onCancel={() => setShowOrderPopup(false)}
        />
      )}
    </div>
  );
}

// Simple internal component for stats
function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4 transition-transform hover:scale-[1.02]">
      <div className={`p-2 sm:p-3 rounded-lg ${bg} ${color} shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-lg sm:text-xl font-black text-gray-900 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export default OrdersPage;
