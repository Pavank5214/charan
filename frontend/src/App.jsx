import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import UserLayout from "./components/layouts/UserLayout";
import Home from "./components/pages/Home";
import Dashboard from './components/pages/Dashboard';
import Invoices from './components/pages/Invoices';
import Payments from './components/pages/Payments';
import Reports from './components/pages/Report';
import Settings from './components/pages/Setting';
import Quotation from './components/pages/Quatation';

import BOMList from "./components/pages/BOMList";
import Clients from './components/pages/Clients';
import ItemsPage from "./components/pages/ItemsPage";
import Expenses from "./components/pages/Expenses"
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import PurchaseOrders from "./components/pages/PurchaseOrders";
import UserManagement from "./components/pages/UserManagement";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-indigo-600">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};


const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-indigo-600">Loading...</div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login"element={<AuthRoute><Login /></AuthRoute> } />

          {/* Protected Routes */}
            <Route path="/" element={<UserLayout /> } >
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="quotations" element={<Quotation />} />
            <Route path="bom" element={<BOMList />}/>
            <Route path="clients" element={<Clients />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="payments" element={<Payments />} />
            <Route path="purchase-orders" element={<PurchaseOrders/>} />
            <Route path="expenses" element={<Expenses/>} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />}/>
          </Route>

          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
