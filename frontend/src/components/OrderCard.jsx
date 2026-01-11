import { Trash2, Package, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import OrderItemsList from './OrderItemsList';

function OrderCard({ 
  order,
  showItemSelector,
  searchQuery,
  menuItems,
  isExpanded,
  onToggleExpand,
  onToggleItemSelector,
  onSearchChange,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  onToggleServed,
  onCancelOrder,
  onCloseOrder,
  onTogglePayment,
  getOrderTotal
}) {
  const filteredAndGroupedMenuItems = menuItems
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-blue-300">
      {/* Horizontal Row Layout */}
      <div className="flex items-stretch">
        {/* Order Items - Left Section */}
        <div className="flex-1 min-w-0">
          {/* Collapsed View */}
          {!isExpanded ? (
            <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={onToggleExpand}>
              <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {order.createdAt}
                </p>
              </div>
            </div>
          ) : (
            /* Expanded View */
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={onToggleExpand}>
                <ChevronDown size={20} className="text-gray-400" />
                <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                <span className="text-xs text-gray-500">• {order.createdAt}</span>
              </div>
              {order.items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <div className="text-center">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">No items yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <OrderItemsList
                    items={order.items}
                    onUpdateQuantity={(itemId, newQuantity) => onUpdateQuantity(itemId, newQuantity)}
                    onRemove={onRemoveItem}
                    onToggleServed={(itemId) => onToggleServed(order.id, itemId)}
                    showCheckbox={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details - Right Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3 min-w-[320px] border-l border-gray-200">
          <div className="flex-1">
            <div className="text-xs text-blue-100 mb-1">Total Amount</div>
            <div className="text-2xl font-black text-white">${getOrderTotal(order)}</div>
            {order.items.length > 0 && isExpanded && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-blue-100">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-white/20">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={order.paymentDone || false}
                  onChange={() => onTogglePayment(order.id)}
                  className="w-4 h-4 rounded border-2 border-white/30 text-green-500 focus:ring-2 focus:ring-green-400 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-white font-medium group-hover:text-blue-50 transition-colors">
                  Payment Done
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onCloseOrder(order.id)}
              disabled={order.status === 'closed'}
              className="px-3 py-2 bg-green-500 border-2 border-green-400 text-white text-xs rounded-lg hover:bg-green-600 transition-all inline-flex items-center justify-center gap-1.5 font-semibold flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-500"
              title={order.status === 'closed' ? 'Order already closed' : 'Close Order'}
            >
              <CheckCircle size={14} />
              {order.status === 'closed' ? 'Closed' : 'Close'}
            </button>
            <button
              onClick={() => onCancelOrder(order.id)}
              className="px-3 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-xs rounded-lg hover:bg-white/20 transition-all inline-flex items-center justify-center gap-1.5 font-semibold flex-shrink-0"
              title="Cancel Order"
            >
              <Trash2 size={14} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
