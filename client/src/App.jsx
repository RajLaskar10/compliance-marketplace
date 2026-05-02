import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { KYCProvider } from './context/KYCContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import KYCPage from './pages/KYCPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CreateProductPage from './pages/CreateProductPage';
import TransactionsPage from './pages/TransactionsPage';
import AdminFlagsPage from './pages/AdminFlagsPage';
import AdminAuditPage from './pages/AdminAuditPage';

export default function App() {
  return (
    <AuthProvider>
      <KYCProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={
              <ProtectedRoute role="seller"><CreateProductPage /></ProtectedRoute>
            } />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/admin/flags" element={<ProtectedRoute role="admin"><AdminFlagsPage /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute role="admin"><AdminAuditPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </KYCProvider>
    </AuthProvider>
  );
}
