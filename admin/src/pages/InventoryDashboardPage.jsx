import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingUp, BarChart3, Plus, ArrowRight } from 'lucide-react';
import { INITIAL_INVENTORY } from '../data/inventoryData';

export default function InventoryDashboardPage() {
  const [items] = useState(INITIAL_INVENTORY);

  // Calculate metrics
  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.current <= i.threshold).length;
  const categories = [...new Set(items.map(i => i.category))];
  
  const averageStockPercentage = (
    items.reduce((sum, item) => sum + (item.current / item.max) * 100, 0) / items.length
  ).toFixed(0);

  const highestStock = items.reduce((max, item) => 
    (item.current / item.max) * 100 > (max.current / max.max) * 100 ? item : max
  );

  const lowestStock = items.reduce((min, item) => 
    (item.current / item.max) * 100 < (min.current / min.max) * 100 ? item : min
  );

  const stats = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockCount,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600 border-red-200',
      bgColor: 'bg-red-100',
      alert: lowStockCount > 0
    },
    {
      title: 'Categories',
      value: categories.length,
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Avg Stock Level',
      value: `${averageStockPercentage}%`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bgColor: 'bg-emerald-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Inventory Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your stock and supplies.</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx}
                className={`rounded-xl border shadow-sm p-6 transition-all hover:shadow-md ${stat.color}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase opacity-80">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon size={24} />
                  </div>
                </div>
                {stat.alert && (
                  <p className="text-xs font-bold mt-3 opacity-80">Action needed</p>
                )}
              </div>
            );
          })}
        </div>

        {/* QUICK ACCESS & ITEMS SPOTLIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
            
            <button className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                  <Plus size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Add New Item</p>
                  <p className="text-xs text-slate-500">Register a new ingredient</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100">
                  <AlertTriangle size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">View Low Stock Items</p>
                  <p className="text-xs text-slate-500">{lowStockCount} items need restocking</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-red-600" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100">
                  <TrendingUp size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">View All Items</p>
                  <p className="text-xs text-slate-500">Browse complete inventory</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-600" />
            </button>
          </div>

          {/* SPOTLIGHT ITEMS */}
          <div className="space-y-4">
            {/* Highest Stock */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Best Stocked</p>
              <p className="text-2xl font-bold text-slate-800">{highestStock.name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {highestStock.current} / {highestStock.max} {highestStock.unit}
              </p>
              <div className="mt-3 w-full bg-emerald-100 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.min((highestStock.current / highestStock.max) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Lowest Stock */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-xs font-bold text-red-600 uppercase mb-2">Needs Attention</p>
              <p className="text-2xl font-bold text-slate-800">{lowestStock.name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {lowestStock.current} / {lowestStock.max} {lowestStock.unit}
              </p>
              <div className="mt-3 w-full bg-red-100 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${Math.min((lowestStock.current / lowestStock.max) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORIES OVERVIEW */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const categoryItems = items.filter(i => i.category === category);
              const categoryLowStock = categoryItems.filter(i => i.current <= i.threshold).length;
              
              return (
                <div key={category} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <p className="font-bold text-slate-800 text-sm mb-2">{category}</p>
                  <p className="text-2xl font-bold text-slate-600 mb-1">{categoryItems.length}</p>
                  <p className="text-xs text-slate-500">
                    {categoryLowStock > 0 ? (
                      <span className="text-red-600 font-bold">{categoryLowStock} low stock</span>
                    ) : (
                      <span className="text-emerald-600">All in stock</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
