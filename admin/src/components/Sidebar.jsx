import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  LogOut,
  ChefHat
} from "lucide-react";

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
        ${isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
      `}
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logging out...");
    navigate("/");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col fixed h-full z-20">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ChefHat className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">RestoAdmin</h1>
          <p className="text-xs text-gray-400 font-medium">Manager Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">
          Overview
        </div>
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <SidebarItem to="/analytics" icon={TrendingUp} label="Analytics" />

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">
          Management
        </div>
        <SidebarItem to="/orders" icon={ShoppingBag} label="Orders History" />
        <SidebarItem to="/menu" icon={UtensilsCrossed} label="Menu Items" />
        <SidebarItem to="/staff" icon={Users} label="Staff & Roles" />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
