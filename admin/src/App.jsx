import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Orders from './pages/Orders.jsx';
import Menu from './pages/Menu.jsx';
import Staff from './pages/Staff.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50/50 flex font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/staff" element={<Staff />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
