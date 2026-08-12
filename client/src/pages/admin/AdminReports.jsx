import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import analyticsService from '../../services/analyticsService';
import Loader from '../../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For the sake of the demonstration without deep time-series backend endpoints,
  // we will map the high-level impact stats and mock a simplified trend line if needed,
  // or rely strictly on the existing global impact stats payload.
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const stats = await analyticsService.getGlobalAnalytics();
        setData(stats);
      } catch (err) {
        console.error('Failed to load global analytics', err);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loader className="h-64" />;
  if (!data) return null;

  const { profiles, donations, impact } = data;

  // Chart data formatting based on current totals
  const userDistData = [
    { name: 'Restaurants', value: profiles.restaurants },
    { name: 'NGOs', value: profiles.ngos },
    { name: 'Volunteers', value: profiles.volunteers },
  ];

  const donationStatusData = [
    { name: 'Active', value: donations.active },
    { name: 'Completed', value: donations.completed },
    { name: 'Cancelled', value: donations.cancelled },
    { name: 'Expired', value: donations.expired },
  ];

  // We can construct a mock 7-day impact trend since the backend doesn't provide granular time-series yet,
  // but to strictly adhere to "Do not use hardcoded statistics", we will visualize actual aggregate fields.
  const overallImpactData = [
    { name: 'Food Rescued', value: impact.foodRescued },
    { name: 'Meals Saved', value: impact.mealsSaved },
    { name: 'Successful Pickups', value: impact.successfulPickups }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Analytics & Reports</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donation Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {donationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Impact Aggregates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Global Impact Totals</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overallImpactData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
