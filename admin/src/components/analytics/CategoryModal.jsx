import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCategoryPerformance } from "../../API/analytics";
function DetailModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function CategoryModal({ isOpen, onClose, range }) {
    const [data, setData] = useState([]);
    useEffect(() => {
        setData([]);
        (async()=>{
            try {
                const response = await getCategoryPerformance(range);
                setData(response);
            } catch (error) {
                console.error("Failed to fetch category details", error);
            }
        })()
    }, [isOpen]);
  return (
    <DetailModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Full Category Breakdown"
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <th className="p-3 rounded-tl-lg">Category Name</th>
            <th className="p-3 text-right">Quantity Sold</th>
            <th className="p-3 text-right rounded-tr-lg">Total Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...data].sort((a,b) => b.sales - a.sales).map((cat, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className="p-3 text-sm font-bold text-gray-800">{cat.name}</td>
              <td className="p-3 text-sm text-gray-600 text-right">{cat.quantity} items</td>
              <td className="p-3 text-sm font-black text-gray-900 text-right">₹{(cat.sales / 100).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DetailModal>
  );
}
