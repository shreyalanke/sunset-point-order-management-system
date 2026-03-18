import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { invokeNativeApi } from "../API";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  LogOut,
  Package,
  ChefHat,
  Database
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
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const timeoutsRef = useRef([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (window.NativeApi && typeof window.NativeApi.consumeLastRestoreResult === "function") {
      try {
        const buffered = window.NativeApi.consumeLastRestoreResult();
        if (buffered) {
          const result = JSON.parse(buffered);
          const skippedTotal =
            (result.skipped_dishes || 0) +
            (result.skipped_orders || 0) +
            (result.skipped_order_items || 0);

          if (result.success === false) {
            setMessageWithTimeout(`✗ ${result.message || "Restore failed"}`, 6000);
          } else if (skippedTotal > 0) {
            const warningCount = Array.isArray(result.warnings) ? result.warnings.length : 0;
            setMessageWithTimeout(
              `✓ Restored ${result.restored_dishes || 0} dishes, ${result.restored_orders || 0} orders, ${result.restored_order_items || 0} items. Skipped ${skippedTotal}${warningCount > 0 ? ` (${warningCount} warnings)` : ""}`,
              7000
            );
          } else {
            setMessageWithTimeout(
              `✓ Restored ${result.restored_dishes || 0} dishes, ${result.restored_orders || 0} orders, and ${result.restored_order_items || 0} order items`,
              7000
            );
          }
        }
      } catch (error) {
        console.warn("Failed to consume buffered restore result", error);
      }
    }

    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach((timerId) => clearTimeout(timerId));
      timeoutsRef.current = [];
    };
  }, []);

  const setMessageWithTimeout = (message, timeoutMs) => {
    if (!mountedRef.current) {
      return;
    }

    setBackupMessage(message);
    const timerId = setTimeout(() => {
      if (mountedRef.current) {
        setBackupMessage("");
      }
    }, timeoutMs);
    timeoutsRef.current.push(timerId);
  };

  const handleBackup = async () => {
    if (!window.NativeApi) {
      setMessageWithTimeout("Backup is only available on Android", 3000);
      return;
    }

    setIsBackingUp(true);
    setBackupMessage("");

    try {
      const result = await invokeNativeApi("backupDatabase");
      setMessageWithTimeout(`✓ Backup saved: ${result.filename}`, 5000);
    } catch (error) {
      setMessageWithTimeout(`✗ ${error.message}`, 5000);
    } finally {
      if (mountedRef.current) {
        setIsBackingUp(false);
      }
    }
  };

  const handleRestore = async () => {
    if (!window.NativeApi) {
      setMessageWithTimeout("Restore is only available on Android", 3000);
      return;
    }

    const shouldRestore = window.confirm(
      "This will permanently delete the current local data and restore the selected backup. Continue?"
    );

    if (!shouldRestore) {
      return;
    }

    setIsRestoring(true);
    setBackupMessage("");

    try {
      const result = await invokeNativeApi("restoreDatabase", true);
      const skippedTotal =
        (result.skipped_dishes || 0) +
        (result.skipped_orders || 0) +
        (result.skipped_order_items || 0);

      if (skippedTotal > 0) {
        const warningCount = Array.isArray(result.warnings) ? result.warnings.length : 0;
        setMessageWithTimeout(
          `✓ Restored ${result.restored_dishes} dishes, ${result.restored_orders} orders, ${result.restored_order_items} items. Skipped ${skippedTotal}${warningCount > 0 ? ` (${warningCount} warnings)` : ""}`,
          6000
        );
      } else {
        setMessageWithTimeout(
          `✓ Restored ${result.restored_dishes} dishes, ${result.restored_orders} orders, and ${result.restored_order_items} order items`,
          6000
        );
      }
    } catch (error) {
      setMessageWithTimeout(`✗ ${error.message}`, 5000);
    } finally {
      if (window.NativeApi && typeof window.NativeApi.consumeLastRestoreResult === "function") {
        try {
          window.NativeApi.consumeLastRestoreResult();
        } catch (error) {
          console.warn("Failed to clear buffered restore result", error);
        }
      }

      if (mountedRef.current) {
        setIsRestoring(false);
      }
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col fixed h-full z-20">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ChefHat className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">RestoAdmin</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">
          Overview
        </div>
        <SidebarItem to="/analytics" icon={TrendingUp} label="Analytics" />

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">
          Management
        </div>
        <SidebarItem to="/orders" icon={ShoppingBag} label="Orders History" />
        <SidebarItem to="/menu" icon={UtensilsCrossed} label="Menu Items" />
        {/* Inventory is disabled on Android - only available on web */}
        {!window.NativeApi && <SidebarItem to="/inventory" icon={Package} label="Inventory" />}
      </nav>

      {/* Backup Section - Only visible on Android */}
      {window.NativeApi && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleBackup}
            disabled={isBackingUp || isRestoring}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${isBackingUp || isRestoring
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"}
            `}
          >
            <Database size={20} />
            <span>{isBackingUp ? "Backing up..." : "Backup Database"}</span>
          </button>
          <button
            onClick={handleRestore}
            disabled={isBackingUp || isRestoring}
            className={`
              mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${isBackingUp || isRestoring
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"}
            `}
          >
            <Database size={20} />
            <span>{isRestoring ? "Restoring..." : "Restore And Wipe"}</span>
          </button>
          {backupMessage && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium ${
              backupMessage.startsWith("✓") 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              {backupMessage}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
