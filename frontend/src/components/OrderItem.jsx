import { X, Check, Utensils } from 'lucide-react';

function OrderItem({ 
  item, 
  onRemove, 
  onToggleServed = null,
  showCheckbox = false,
  readOnly = false
}) {
  const isServed = item.status === 'served';

  return (
    <div className="group relative grid grid-cols-12 gap-4 py-4 border-b border-gray-50 last:border-0 hover:bg-blue-50/50 transition-colors items-center px-4 -mx-2 rounded-lg">
      
      {/* --- COL 1-6: Item Details --- */}
      <div className="col-span-6 flex items-start gap-3 overflow-hidden">
        {/* Served Checkbox / Status Icon */}
        {showCheckbox && !readOnly && (
          <button
            onClick={() => onToggleServed(item.id)}
            className={`
              shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer
              ${isServed 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-white border-gray-300 text-transparent hover:border-green-400'}
            `}
          >
            <Check size={12} strokeWidth={3} />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <span className={`
            text-sm font-bold truncate transition-all cursor-pointer
            ${isServed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}
          `} onClick={() => onToggleServed(item.id)}>
            {item.name}
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            @ ₹{Number(item.price).toFixed(2)} / unit
          </span>
        </div>
      </div>

      {/* --- COL 7-9: Quantity --- */}
      <div className="col-span-3 flex items-center justify-center">
        <span className={`
          text-xs font-bold px-2.5 py-1 rounded-md
          ${isServed ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'}
        `}>
          x{item.quantity}
        </span>
      </div>

      {/* --- COL 10-12: Total Price & Actions --- */}
      <div className="col-span-3 flex items-center justify-end gap-3">
        <span className={`
          font-bold text-sm
          ${isServed ? 'text-gray-400' : 'text-gray-900'}
        `}>
          ₹{(item.price * item.quantity).toFixed(2)}
        </span>

        {/* Delete Button - Shows on Hover */}
        {!readOnly && (
          <button
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all absolute right-2 lg:static cursor-pointer"
            title="Remove Item"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderItem;