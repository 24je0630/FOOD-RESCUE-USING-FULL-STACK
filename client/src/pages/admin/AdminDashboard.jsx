import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import { Users, Building2, HeartHandshake, Package, AlertTriangle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import Badge from '../../components/ui/Badge';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const stats = await adminService.getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error('Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loader className="h-64" />;
  if (!data) return null;

  const { users, profiles, donations, pickups, impact, recentActivity } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Overview</h1>

      {/* High level impact */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={users.total} icon={Users} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Food Rescued" value={impact.foodRescued} icon={Package} colorClass="bg-emerald-100 text-emerald-600" />
        <StatCard title="Meals Saved" value={impact.mealsSaved} icon={HeartHandshake} colorClass="bg-pink-100 text-pink-600" />
        <StatCard title="Active Donations" value={donations.active} icon={AlertTriangle} colorClass="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Restaurants</span>
               <span className="font-semibold text-gray-900">{profiles.restaurants}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">NGOs</span>
               <span className="font-semibold text-gray-900">{profiles.ngos}</span>
             </div>
             <div className="flex justify-between pb-2">
               <span className="text-gray-600">Volunteers</span>
               <span className="font-semibold text-gray-900">{profiles.volunteers}</span>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-200">
               <div className="flex justify-between">
                 <span className="text-sm text-red-500">Suspended Users</span>
                 <span className="text-sm font-semibold text-red-500">{users.suspended}</span>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Operational Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Total Donations</span>
               <span className="font-semibold text-gray-900">{donations.total}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Completed Deliveries</span>
               <span className="font-semibold text-emerald-600">{donations.completed}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Pending Pickups</span>
               <span className="font-semibold text-amber-600">{pickups.pending}</span>
             </div>
             <div className="flex justify-between pb-2">
               <span className="text-gray-600">Completed Pickups</span>
               <span className="font-semibold text-blue-600">{pickups.completed}</span>
             </div>
          </CardContent>
        </Card>

        {/* Recent Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map(log => (
                  <div key={log.id} className="text-sm">
                    <p className="font-medium text-gray-900 truncate" title={log.action}>{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{log.user?.email} • {format(new Date(log.timestamp), 'MMM d, h:mm a')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
