import React, { useState, useMemo } from 'react';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { INITIAL_INVENTORY } from '../data/inventoryData';
import RefillModal from '../components/inventory/RefillModal';

export default function LowStockAlertsPage() {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Get only low stock items
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.current <= item.threshold);
  }, [items]);

  const openRefillModal = (e, item) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsRefillOpen(true);
  };

  const handleRefillSubmit = (refillAmount, updateMode) => {
    if (!selectedItem || !refillAmount) return;

    const inputVal = parseFloat(refillAmount);
    
    setItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        let newAmount = item.current;
        
        if (updateMode === 'add') {
          newAmount = item.current + inputVal;
        } else {
          newAmount = inputVal;
        }

        newAmount = Math.max(0, newAmount);

        return { ...item, current: parseFloat(newAmount.toFixed(2)) };
      }
      return item;
    }));

    setIsRefillOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Low Stock Alerts</h1>
            <p className="text-sm text-slate-500">Items that need immediate restocking.</p>
          </div>
        </div>

        {/* ALERT COUNT CARD */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm text-red-600 font-bold uppercase">Items Below Threshold</p>
            <p className="text-3xl font-bold text-red-700">{lowStockItems.length}</p>
          </div>
        </div>

        {/* ITEMS LIST */}
        {lowStockItems.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-600 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-600 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-600 uppercase tracking-wider">Threshold</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-600 uppercase tracking-wider">Shortage</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-red-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((item) => {
                  const shortage = item.threshold - item.current;
                  
                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-red-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.name}</p>
                          <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1.5 bg-red-100 text-red-700 font-bold text-sm rounded-lg">
                          {item.current} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold text-slate-700">{item.threshold} {item.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1.5 bg-orange-100 text-orange-700 font-bold text-sm rounded-lg">
                          {shortage.toFixed(1)} {item.unit} needed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => openRefillModal(e, item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                        >
                          <RefreshCcw size={14} />
                          Refill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">All Items in Stock!</h3>
            <p className="text-slate-500">No items are currently below their threshold levels.</p>
          </div>
        )}
      </div>

      {/* REFILL MODAL */}
      <RefillModal 
        isOpen={isRefillOpen}
        selectedItem={selectedItem}
        onClose={() => setIsRefillOpen(false)}
        onSubmit={handleRefillSubmit}
      />
    </div>
  );
}
