import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { getOrders } from '../API/orders';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
      console.log("API Orders Data:", data);

      // data = await fetchOrdersData();

      data = data.map(order => ({
        ...order,
        items: order.items.map(item => ({
          order_item_id: item.order_item_id,
          dish_name_snapshot: item.dish_name,
          quantity: item.quantity,
          price_snapshot: item.price,
          item_status: item.item_status
        }))
      }));
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

  // Backend handles all filtering, sorting, and pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // --- FORMATTERS ---
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount / 100);
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
                ) : orders.length === 0 ? (
                  <tr><td colSpan="4" className="p-12 text-center text-slate-500">No orders found matching your criteria.</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.order_id} 
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${order.order_id}`)}
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
          {!loading && orders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, orders.length)}</span> of <span className="font-bold text-slate-700">{orders.length}</span> results
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
    </div>
  );
}