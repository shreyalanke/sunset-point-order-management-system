import { Package } from 'lucide-react';
import OrderItem from './OrderItem';

function OrderItemsList({ 
  items, 
  onUpdateQuantity, 
  onRemove, 
  onToggleServed = null,
  showCheckbox = false,
  variant = 'default' // 'default' or 'popup'
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <Package size={40} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm font-medium">No items selected yet</p>
        <p className="text-xs text-gray-400 mt-1">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${variant === 'popup' ? 'border border-gray-200 rounded-lg p-3 bg-white' : ''}`}>
      {items.map(item => (
        <OrderItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onToggleServed={onToggleServed}
          showCheckbox={showCheckbox}
        />
      ))}
    </div>
  );
}

export default OrderItemsList;
