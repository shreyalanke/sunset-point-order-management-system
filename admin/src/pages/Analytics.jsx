import React from "react";
import Header from "../components/Header";

export default function Analytics() {
  return (
    <>
      <Header 
        title="Analytics" 
        subtitle="Detailed performance metrics and insights" 
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-500">Coming soon - Advanced analytics and reporting features</p>
        </div>
      </div>
    </>
  );
}
