import React, { useState } from 'react';
import {
  X,
  Save,
  Edit3,
  TrendingUp
} from 'lucide-react';

export default function RefillModal({ isOpen, selectedItem, onClose, onSubmit }) {
  const [refillAmount, setRefillAmount] = useState("");
  const [updateMode, setUpdateMode] = useState("add");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(refillAmount, updateMode);
    setRefillAmount("");
    setUpdateMode("add");
  };

  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Update Stock</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="text-center mb-2">
             <p className="text-sm text-slate-500">Updating inventory for</p>
             <p className="text-xl font-black text-slate-800">{selectedItem.name}</p>
             <p className="text-xs font-bold text-slate-400 mt-1">Current: {selectedItem.current} {selectedItem.unit}</p>
          </div>

          {/* Toggle Switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => setUpdateMode('add')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                updateMode === 'add' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp size={16} />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => setUpdateMode('set')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                updateMode === 'set' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 size={16} />
              Set Total
            </button>
          </div>

          {/* Input Area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
               {updateMode === 'add' ? `Amount to Add (${selectedItem.unit})` : `New Total Count (${selectedItem.unit})`}
            </label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              autoFocus
              required
              placeholder={updateMode === 'add' ? "e.g. 5.0" : "e.g. 20.0"}
              value={refillAmount}
              onChange={(e) => setRefillAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          {/* Calculation Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 uppercase">New Stock Level:</span>
             <span className={`font-bold text-lg ${
                (updateMode === 'add' 
                  ? (selectedItem.current + (parseFloat(refillAmount)||0)) 
                  : (parseFloat(refillAmount)||0)) > selectedItem.max 
                  ? 'text-orange-500' 
                  : 'text-slate-800'
             }`}>
                {updateMode === 'add' 
                  ? (selectedItem.current + (parseFloat(refillAmount) || 0)).toFixed(2)
                  : (parseFloat(refillAmount) || 0).toFixed(2)
                } 
                <span className="text-xs ml-1 text-slate-400 font-normal">{selectedItem.unit}</span>
             </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                updateMode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Save size={18} />
              {updateMode === 'add' ? 'Confirm Add' : 'Update Total'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
