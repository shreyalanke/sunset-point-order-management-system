import { X } from 'lucide-react';

function OrderItem({ 
  item, 
  onRemove, 
  onToggleServed = null,
  showCheckbox = false 
}) {
  console.log('Rendering OrderItem:', item);
  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
        showCheckbox && item.status === 'served'
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
      }`}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={item.status === 'served'}
          onChange={() => onToggleServed(item.id)}
          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${
          showCheckbox && item.status === 'served' ? 'text-green-900 line-through' : 'text-gray-900'
        }`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          ${item.price.toFixed(2)} × {item.quantity} = <span className="font-semibold text-blue-600">${(item.price * item.quantity).toFixed(2)}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center border border-gray-300 rounded-md bg-white px-2 py-1">
          <span className="text-xs text-gray-500 mr-1">Qty</span>
          <span className="text-sm font-bold text-gray-900">
            {Number(item.quantity)}
          </span>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-all"
          title="Remove Item"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default OrderItem;
