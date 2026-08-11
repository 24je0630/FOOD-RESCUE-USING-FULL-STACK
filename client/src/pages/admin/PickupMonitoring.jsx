import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Truck } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING': return <Badge variant="warning">Pending</Badge>;
    case 'ACCEPTED': return <Badge variant="primary">Accepted / Wait Vol</Badge>;
    case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const PickupMonitoring = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await adminService.getPickups(filters);
      setPickups(data.pickups);
    } catch (err) {
      toast.error('Failed to load pickups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pickup Requests Monitoring</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending NGO Request</option>
              <option value="ACCEPTED">Accepted by Restaurant</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <Button variant="secondary" onClick={fetchPickups}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Loader className="h-64" />
        ) : pickups.length > 0 ? (
          pickups.map((pickup) => (
            <div key={pickup.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-gray-900">{pickup.donation?.title || 'Unknown Donation'}</h3>
                  {getStatusBadge(pickup.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-900">From:</span> {pickup.donation?.restaurant?.organizationName}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">To:</span> {pickup.ngo?.organizationName}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Requested on {format(new Date(pickup.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>

              <div className="w-full lg:w-1/3 bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-2">
                  <Truck className="h-4 w-4 mr-1 text-emerald-600" />
                  Volunteer Assignment
                </h4>
                {pickup.assignments && pickup.assignments.length > 0 ? (
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Status:</span> <Badge variant="info">{pickup.assignments[0].status}</Badge></p>
                    <p className="mt-1 truncate"><span className="font-medium">Vol:</span> {pickup.assignments[0].volunteer?.user?.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No volunteer assigned yet.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No pickup requests found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupMonitoring;
