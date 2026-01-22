import React from "react";
import Header from "../components/Header";

export default function Menu() {
  return (
    <>
      <Header 
        title="Menu Items" 
        subtitle="Manage your restaurant menu" 
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu Management</h2>
          <p className="text-gray-500">Coming soon - Add, edit, and organize menu items</p>
        </div>
      </div>
    </>
  );
}
