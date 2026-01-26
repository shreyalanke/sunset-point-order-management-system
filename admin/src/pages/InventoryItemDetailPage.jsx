import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { INITIAL_INVENTORY } from '../data/inventoryData';

export default function InventoryItemDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get item from data
  const item = INITIAL_INVENTORY.find(i => i.id === parseInt(id));

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Item Not Found</h2>
          <p className="text-slate-500 mb-6">The inventory item you're looking for doesn't exist.</p>
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min((item.current / item.max) * 100, 100);
  const isLow = item.current <= item.threshold;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Settings size={32} />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{item.name}</h2>
          <p className="text-slate-500">Detailed analytics and history for this item are coming soon.</p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Category</p>
            <p className="text-lg font-bold text-slate-800">{item.category}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Current Stock</p>
            <p className="text-lg font-bold text-slate-800">{item.current} {item.unit}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Max Capacity</p>
            <p className="text-lg font-bold text-slate-800">{item.max} {item.unit}</p>
          </div>
          <div className={`p-4 rounded-lg border ${isLow ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: isLow ? '#dc2626' : '#059669' }}>
              {isLow ? 'Low Stock Alert' : 'Stock Status'}
            </p>
            <p style={{ color: isLow ? '#dc2626' : '#059669' }} className="text-lg font-bold">
              {isLow ? 'Below Threshold' : 'Healthy'}
            </p>
          </div>
        </div>

        {/* Stock Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-slate-600">Stock Level</span>
            <span className="text-sm font-bold text-slate-600">{percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={18} />
          Back to Inventory
        </button>
      </div>
    </div>
  );
}
