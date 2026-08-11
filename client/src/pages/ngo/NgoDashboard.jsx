import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import analyticsService from '../../services/analyticsService';
import Loader from '../../components/ui/Loader';
import { Package, CheckCircle, Utensils, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const NgoDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const stats = await analyticsService.getNgoAnalytics();
        setData(stats);
      } catch (err) {
        setError('Failed to load NGO analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loader className="h-64" />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  const { requests, impact, categoryDistribution } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">NGO Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Requests" 
          value={requests.total} 
          icon={Package} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Completed Pickups" 
          value={requests.completed} 
          icon={CheckCircle} 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Meals Served" 
          value={impact.mealsServed} 
          icon={Utensils} 
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Pickup Success Rate" 
          value={`${impact.pickupSuccessRate}%`} 
          icon={Percent} 
          colorClass="bg-amber-100 text-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Received by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDistribution && categoryDistribution.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-gray-500">
                No categorical data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Total Requests Made</span>
               <span className="font-semibold text-gray-900">{requests.total}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Accepted Requests</span>
               <span className="font-semibold text-emerald-600">{requests.accepted}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Rejected Requests</span>
               <span className="font-semibold text-red-600">{requests.rejected}</span>
             </div>
             <div className="flex justify-between pb-2">
               <span className="text-gray-600">Cancelled Requests</span>
               <span className="font-semibold text-gray-900">{requests.cancelled}</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NgoDashboard;
