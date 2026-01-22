import React from "react";
import { Search, Calendar, ChevronDown, Bell } from "lucide-react";

export default function Header({ title, subtitle, timeRange = "This Week", onTimeRangeChange }) {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-200 rounded-lg text-sm outline-none transition-all w-64"
          />
        </div>

        {/* Time Range Filter */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Calendar size={16} className="text-gray-500" />
            {timeRange}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>

        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
          AD
        </div>
      </div>
    </header>
  );
}
