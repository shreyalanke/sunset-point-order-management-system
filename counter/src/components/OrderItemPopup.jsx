import { X, Plus, Minus } from 'lucide-react';

function OrderItemPopup({ 
  item, 
  onRemove, 
  onUpdateQuantity
}) {
  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 transition-all hover:border-blue-200">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">
          {item.name}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          ₹{(item.price / 100).toFixed(2)} each
        </p>
        <p className="text-sm font-semibold text-blue-600 mt-1">
          Subtotal: ₹{(item.price * item.quantity / 100).toFixed(2)}
        </p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-md bg-white px-1 py-0.5">
          <button
            onClick={handleDecrement}
            disabled={item.quantity === 1}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-bold text-gray-900 px-2 min-w-8 text-center">
            {Number(item.quantity)}
          </span>
          <button
            onClick={handleIncrement}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
            title="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-all cursor-pointer"
          title="Remove Item"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default OrderItemPopup;
