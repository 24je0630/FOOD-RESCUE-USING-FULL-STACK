import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import analyticsService from '../../services/analyticsService';
import volunteerService from '../../services/volunteerService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import { Truck, CheckCircle, Package, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

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

const VolunteerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default availability status can be pulled from user context or stats, we'll maintain state
  const [isAvailable, setIsAvailable] = useState(true); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const stats = await analyticsService.getVolunteerAnalytics();
        setData(stats);
      } catch (err) {
        setError('Failed to load volunteer analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const newState = !isAvailable;
      await volunteerService.toggleAvailability(newState);
      setIsAvailable(newState);
      toast.success(`You are now ${newState ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  if (loading) return <Loader className="h-64" />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  const { assignments, impact } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Volunteer Dashboard</h1>
        <div className="mt-4 sm:mt-0 flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <span className="mr-3 text-sm font-medium text-gray-700">Status:</span>
          <button 
            onClick={handleToggleAvailability}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isAvailable ? 'bg-emerald-500' : 'bg-gray-200'}`}
          >
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="ml-3 text-sm font-medium">
            {isAvailable ? <Badge variant="success">AVAILABLE</Badge> : <Badge variant="default">UNAVAILABLE</Badge>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Assignments" 
          value={assignments.total} 
          icon={Package} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Completed Deliveries" 
          value={assignments.completed} 
          icon={CheckCircle} 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Food Delivered (Items)" 
          value={impact.foodDelivered} 
          icon={Truck} 
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Delivery Success Rate" 
          value={`${impact.deliverySuccessRate}%`} 
          icon={Percent} 
          colorClass="bg-amber-100 text-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Total Assignments</span>
               <span className="font-semibold text-gray-900">{assignments.total}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Accepted</span>
               <span className="font-semibold text-emerald-600">{assignments.accepted}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-4">
               <span className="text-gray-600">Completed Pickups</span>
               <span className="font-semibold text-blue-600">{assignments.completed}</span>
             </div>
             <div className="flex justify-between pb-2">
               <span className="text-gray-600">Cancelled Assignments</span>
               <span className="font-semibold text-red-600">{assignments.cancelled}</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
