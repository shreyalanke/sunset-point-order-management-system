import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Analytics from './pages/Analytics.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import Menu from './pages/Menu.jsx';
import Staff from './pages/Staff.jsx';
import MenuItemPage from './pages/MenuItemPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import InventoryItemDetailPage from './pages/InventoryItemDetailPage.jsx';
import AddInventoryItemPage from './pages/AddInventoryItemPage.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50/50 flex font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <Routes>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/item/:id" element={<MenuItemPage />} /> 
            <Route path="/staff" element={<Staff />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/add" element={<AddInventoryItemPage />} />
            <Route path="/inventory/:id" element={<InventoryItemDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
