export default function StatCard({ label, value, subtext, icon: Icon, color, bg, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-2 bg-gray-200 rounded w-28"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon size={22} />
        </div>
      </div>
      {subtext && <p className="text-xs font-semibold text-gray-400">{subtext}</p>}
    </div>
  );
}
