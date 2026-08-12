import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages (Minimal for testing architecture)
const Login = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Login Page</h1><p className="mt-4 text-gray-500">Go to /login to use AuthContext</p></div>;
const Register = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">Register Page</h1></div>;
const Unauthorized = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">403 - Unauthorized</h1></div>;
const NotFound = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Not Found</h1></div>;

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import CreateDonation from './pages/restaurant/CreateDonation';
import DonationList from './pages/restaurant/DonationList';
import DonationDetails from './pages/restaurant/DonationDetails';
const RestaurantSettings = () => <div className="p-8"><h1>Settings</h1></div>;

// NGO Pages
import NgoDashboard from './pages/ngo/NgoDashboard';
import DiscoverDonations from './pages/ngo/DiscoverDonations';
import NgoDonationDetails from './pages/ngo/NgoDonationDetails';
import PickupRequests from './pages/ngo/PickupRequests';
const NgoSettings = () => <div className="p-8"><h1>NGO Settings</h1></div>;

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import MyAssignments from './pages/volunteer/MyAssignments';
import VolunteerPickupDetails from './pages/volunteer/PickupDetails';
const VolunteerSettings = () => <div className="p-8"><h1>Volunteer Settings</h1></div>;

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import VerificationManagement from './pages/admin/VerificationManagement';
import DonationMonitoring from './pages/admin/DonationMonitoring';
import PickupMonitoring from './pages/admin/PickupMonitoring';
import ActivityLogs from './pages/admin/ActivityLogs';
import AdminReports from './pages/admin/AdminReports';
const AdminSettings = () => <div className="p-8"><h1>Admin Settings</h1></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Restaurant Routes */}
          <Route path="/restaurant" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                <RestaurantDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/restaurant/donations" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                <DonationList />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/restaurant/history" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                {/* History is just the donation list with implicit completion filters often, or same UI component */}
                <DonationList />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/restaurant/donations/new" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                <CreateDonation />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/restaurant/donations/:id" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                <DonationDetails />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/restaurant/settings" element={
            <ProtectedRoute allowedRoles={['RESTAURANT']}>
              <DashboardLayout>
                <RestaurantSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><UserManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><VerificationManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><DonationMonitoring /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/pickups" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><PickupMonitoring /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminReports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/activity-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><ActivityLogs /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />
          {/* NGO Routes */}
          <Route path="/ngo" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><NgoDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ngo/discover" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><DiscoverDonations /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ngo/donations/:id" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><NgoDonationDetails /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ngo/requests" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><PickupRequests /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ngo/history" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><PickupRequests /></DashboardLayout></ProtectedRoute>} />
          <Route path="/ngo/settings" element={<ProtectedRoute allowedRoles={['NGO']}><DashboardLayout><NgoSettings /></DashboardLayout></ProtectedRoute>} />

          {/* Volunteer Routes */}
          <Route path="/volunteer" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><DashboardLayout><VolunteerDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/volunteer/assignments" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><DashboardLayout><MyAssignments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/volunteer/assignments/:id" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><DashboardLayout><VolunteerPickupDetails /></DashboardLayout></ProtectedRoute>} />
          <Route path="/volunteer/history" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><DashboardLayout><MyAssignments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/volunteer/settings" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><DashboardLayout><VolunteerSettings /></DashboardLayout></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
