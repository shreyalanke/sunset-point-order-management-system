import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Receipt,
  UtensilsCrossed,
  CreditCard,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hash,
  ChefHat,
  Timer
} from 'lucide-react';
import { getOrderById } from '../API/orders';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order", err);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState navigate={navigate} />;
  if (error || !order) return <ErrorState error={error} navigate={navigate} />;

  // Derived state
  const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  const subTotal = order.order_total; 

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/orders')}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{order.order_tag}</h1>
                <StatusBadge status={order.order_status} />
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Hash size={14} />
                  {order.order_id}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ORDER ITEMS CARD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-slate-500" />
                  Order Items
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  {totalItems} items
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.order_item_id} className="p-4 hover:bg-slate-50/80 transition-colors flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 font-bold shrink-0 text-sm">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-base">
                            {item.dish_name || item.dish_name_snapshot}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(item.price || item.price_snapshot)} per item
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-slate-800">
                          {formatCurrency((item.price || item.price_snapshot) * item.quantity)}
                        </p>
                        {item.item_status && (
                           <span className="text-xs font-medium text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full mt-1 inline-block border border-emerald-100">
                             {item.item_status}
                           </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-20" />
                    <p>No items in this order</p>
                  </div>
                )}
              </div>
              
              {/* Optional: Add notes section if data exists */}
              {order.notes && (
                <div className="p-4 bg-yellow-50/50 border-t border-yellow-100 text-sm text-slate-700">
                  <span className="font-semibold text-yellow-700 mr-2">Note:</span>
                  {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-6">
            
            {/* PAYMENT SUMMARY */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                 <h2 className="font-bold text-slate-800 flex items-center gap-2">
                   <Receipt size={18} className="text-slate-500" />
                   Payment Summary
                 </h2>
              </div>
              <div className="p-5 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <CreditCard size={16} />
                        Payment
                     </div>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        order.order_status === 'CLOSED' ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                     }`}>
                        {order.order_status === 'CLOSED' ? 'PAID' : 'PENDING'}
                     </span>
                  </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatusBadge({ status }) {
  if (status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle2 size={12} strokeWidth={3} />
        CLOSED
      </span>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
        <XCircle size={12} strokeWidth={3} />
        CANCELLED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
      <AlertCircle size={12} strokeWidth={3} />
      {status}
    </span>
  );
}

function LoadingState({ navigate }) {
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
         <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
         <h2 className="text-lg font-bold text-slate-800 mb-2">Loading Order...</h2>
         <p className="text-slate-500 mb-6 text-sm">Please wait while we fetch the details.</p>
         <button 
           onClick={() => navigate('/orders')}
           className="text-sm font-medium text-slate-600 hover:text-slate-900 border-b border-transparent hover:border-slate-800 transition-all"
         >
           Cancel
         </button>
      </div>
    </div>
  );
}

function ErrorState({ error, navigate }) {
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
         <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <XCircle size={24} />
         </div>
         <h2 className="text-lg font-bold text-slate-800 mb-2">Error Loading Order</h2>
         <p className="text-slate-500 mb-6 text-sm">{error || "The order could not be found."}</p>
         <button 
           onClick={() => navigate('/orders')}
           className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-sm"
         >
           Back to Orders
         </button>
      </div>
    </div>
  );
}

// --- UTILS ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount / 100);
};
