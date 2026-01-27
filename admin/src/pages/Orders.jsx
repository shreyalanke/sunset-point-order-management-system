import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  DollarSign, 
  ChefHat,
  Receipt,
  UtensilsCrossed,
  CreditCard,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { getOrders } from '../API/orders';

// --- MOCK API GENERATOR ---
const generateMockOrders = (count) => {
  const statuses = ['OPEN', 'CLOSED', 'CANCELLED'];
  const data = [];
  const now = new Date();
  
  for (let i = 1; i <= count; i++) {
    const isClosed = Math.random() > 0.3;
    const date = new Date(now.getTime() - Math.random() * 1000000000); // Random date in past ~10 days
    
    data.push({
      order_id: 1000 + i,
      order_tag: `Table ${Math.floor(Math.random() * 20) + 1}`,
      is_payment_done: isClosed,
      order_total: Math.floor(Math.random() * 8000) + 500,
      order_status: isClosed ? 'CLOSED' : statuses[Math.floor(Math.random() * statuses.length)],
      created_at: date.toISOString(),
      items: [
        { order_item_id: i * 10 + 1, dish_name_snapshot: "Burger Special", quantity: 2, price_snapshot: 1200, item_status: "SERVED" },
        { order_item_id: i * 10 + 2, dish_name_snapshot: "Fries", quantity: 1, price_snapshot: 500, item_status: "SERVED" }
      ]
    });
  }
  return data;
};

const fetchOrdersData = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return generateMockOrders(45); // Generating 45 orders to test pagination
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // --- FILTERS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  
  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadOrders();
  }, [searchQuery, dateRange, sortConfig, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange]);
      

  const loadOrders = async () => {
    setLoading(true);
    try {
      
      let data = await getOrders({searchQuery, dateRange, sortConfig, currentPage});
      console.log("Fetched orders data:", data);
      data = await fetchOrdersData();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // --- COMPUTED DATA ---
  const processedData = useMemo(() => {
    let result = [...orders];

    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.order_tag.toLowerCase().includes(query) || 
        o.order_id.toString().includes(query)
      );
    }

    // 2. Date Range Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.created_at) >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.created_at) <= end);
    }

    // 3. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'created_at') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [orders, searchQuery, dateRange, sortConfig]);

  // 4. Pagination Slicing
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedOrders = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- FORMATTERS ---
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  };

  // --- COMPONENTS ---
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-600" /> 
      : <ArrowDown size={14} className="text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Order History</h1>
            <p className="text-slate-500 text-sm">Review past transactions and order details.</p>
          </div>
          
          <div className="flex gap-3">
             {/* Simple Stats Summary */}
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
               <div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</p>
                 <p className="text-lg font-bold text-slate-800">
                   {formatCurrency(orders.reduce((acc, curr) => acc + (curr.order_status !== 'CANCELLED' ? curr.order_total : 0), 0))}
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* CONTROLS: SEARCH & DATE RANGE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center sticky top-0 z-10">
          
          {/* Search */}
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order Tag or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          
          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <span className="text-xs font-bold text-slate-500 uppercase">From:</span>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              />
            </div>
            <div className="hidden sm:block text-slate-300">-</div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <span className="text-xs font-bold text-slate-500 uppercase">To:</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button 
                onClick={() => setDateRange({ start: "", end: "" })}
                className="text-xs font-bold text-red-500 hover:text-red-700 ml-2"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th 
                    onClick={() => handleSort('order_tag')}
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      Order Tag / ID
                      <SortIcon columnKey="order_tag" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      Date & Time
                      <SortIcon columnKey="created_at" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('order_total')}
                    className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total Amount
                      <SortIcon columnKey="order_total" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-12 text-center text-slate-500">Loading orders...</td></tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr><td colSpan="4" className="p-12 text-center text-slate-500">No orders found matching your criteria.</td></tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr 
                      key={order.order_id} 
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-800">{order.order_tag}</p>
                          <p className="text-xs text-slate-400">ID: #{order.order_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={14} className="text-slate-400"/>
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-slate-800">{formatCurrency(order.order_total)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                         <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors">
                           <ChevronRight size={16} />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {!loading && processedData.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="font-bold text-slate-700">{processedData.length}</span> results
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <div className="flex items-center gap-1">
                   {/* Simple Page Numbers logic */}
                   {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Show first, last, current, and adjacent pages
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                         return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page 
                                  ? 'bg-slate-900 text-white shadow-md' 
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                         );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-slate-400 text-xs">...</span>;
                      }
                      return null;
                   })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* --- ORDER DETAILS SLIDE-OVER --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end isolate">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrder(null)}
          ></div>
          
          {/* Slide-over Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedOrder.order_tag}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-400">ID: #{selectedOrder.order_id}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Internal Status Banner (still visible in detail view) */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${
                selectedOrder.order_status === 'CLOSED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                selectedOrder.order_status === 'CANCELLED' ? 'bg-red-50 border-red-200 text-red-800' : 
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                 <div className="flex items-center gap-2">
                    <Receipt size={20} />
                    <span className="font-bold text-sm">Status</span>
                 </div>
                 <span className="font-black tracking-wide text-sm">{selectedOrder.order_status}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.order_item_id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex gap-3">
                        <div className="mt-1 p-1.5 bg-white rounded border border-slate-200 text-slate-400">
                          <UtensilsCrossed size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.dish_name_snapshot}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {formatCurrency(item.price_snapshot * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Subtotal</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedOrder.order_total)}</span>
                 </div>
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-slate-500">Tax (5%)</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedOrder.order_total * 0.05)}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl text-white">
                    <span className="font-bold">Total Amount</span>
                    <span className="text-xl font-black">{formatCurrency(selectedOrder.order_total)}</span>
                 </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50">
               <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                     <Receipt size={16} /> Print
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-colors">
                     <CreditCard size={16} /> View Transaction
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}