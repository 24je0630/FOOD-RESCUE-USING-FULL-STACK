import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Placeholder Pages
const Login = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Login Page</h1></div>;
const Register = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Register Page</h1></div>;
const Unauthorized = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">403 - Unauthorized</h1></div>;
const NotFound = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Not Found</h1></div>;

const AdminDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-indigo-600">Admin Dashboard Placeholder</h1></div>;
const RestaurantDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-green-600">Restaurant Dashboard Placeholder</h1></div>;
const NgoDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-blue-600">NGO Dashboard Placeholder</h1></div>;
const VolunteerDashboard = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-yellow-600">Volunteer Dashboard Placeholder</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Role-based Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/restaurant/*" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <RestaurantDashboard />
            </ProtectedRoute>
          } />

          <Route path="/ngo/*" element={
            <ProtectedRoute allowedRoles={['NGO']}>
              <NgoDashboard />
            </ProtectedRoute>
          } />

          <Route path="/volunteer/*" element={
            <ProtectedRoute allowedRoles={['VOLUNTEER']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
