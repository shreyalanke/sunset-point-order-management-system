import React from "react";
import Header from "../components/Header";

export default function Staff() {
  return (
    <>
      <Header 
        title="Staff & Roles" 
        subtitle="Manage your team members and permissions" 
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Staff Management</h2>
          <p className="text-gray-500">Coming soon - Manage staff members and their roles</p>
        </div>
      </div>
    </>
  );
}
