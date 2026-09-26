import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Dashboard'; // Or keep it standalone and render it as is
import ProtectedRoute from './components/ProtectedRoute';
import MaterialLayout from './components/MaterialLayout';
import Adjustments from './pages/adjustments/Adjustments';
import NewAdjustment from './pages/adjustments/NewAdjustment';
import Products from './pages/inventory/Products';
import Locations from './pages/inventory/Locations';
import Receipts from './pages/receiving/Receipts';
import Deliveries from './pages/receiving/Deliveries';
import Putaway from './pages/receiving/Putaway';
import TransferList from './pages/transfers/TransferList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
              {/* Standalone Dashboard mapping for now, or wrapped in MaterialLayout */}
              <Route path="/dashboard" element={<Dashboard />} />

              <Route element={<MaterialLayout />}>
                <Route path="/products" element={<Products />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/deliveries" element={<Deliveries />} />
                <Route path="/putaway" element={<Putaway />} />
                <Route path="/transfers" element={<TransferList />} />
                <Route path="/adjustments" element={<Adjustments />} />
                <Route path="/adjustments/new" element={<NewAdjustment />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
