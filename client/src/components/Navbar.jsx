import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link to="/products" className="text-lg font-bold text-blue-700">Compliance Market</Link>
      <div className="flex items-center gap-4 text-sm">
        {!user ? (
          <>
            <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        ) : (
          <>
            <Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link>
            {user.role === 'buyer' && <Link to="/transactions" className="text-gray-600 hover:text-blue-600">Orders</Link>}
            {user.role === 'seller' && (
              <>
                <Link to="/transactions" className="text-gray-600 hover:text-blue-600">Sales</Link>
                <Link to="/products/new" className="text-gray-600 hover:text-blue-600">List Item</Link>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/flags" className="text-gray-600 hover:text-blue-600">Flags</Link>
                <Link to="/admin/audit" className="text-gray-600 hover:text-blue-600">Audit</Link>
              </>
            )}
            {user.kyc_status !== 'approved' && (
              <Link to="/kyc" className="text-yellow-600 hover:text-yellow-700">KYC ⚠</Link>
            )}
            <span className="text-gray-400">{user.email}</span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
