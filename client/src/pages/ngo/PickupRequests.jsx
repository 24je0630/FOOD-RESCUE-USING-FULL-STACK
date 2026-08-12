import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ngoService from '../../services/ngoService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { MapPin, Truck } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING': return <Badge variant="warning">Pending</Badge>;
    case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
    case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
    case 'CANCELLED': return <Badge variant="default">Cancelled</Badge>;
    case 'COMPLETED': return <Badge variant="primary">Completed</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const PickupRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchRequests = async () => {
    try {
      const data = await ngoService.getMyRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        await ngoService.cancelRequest(id);
        toast.success('Request cancelled');
        fetchRequests();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel request');
      }
    }
  };

  const filteredRequests = requests.filter(r => filter === 'ALL' || r.status === filter);

  if (loading) return <Loader className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pickup Requests</h1>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 pb-4 overflow-x-auto">
        {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{req.donation.title}</h3>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-gray-400" /> {req.donation.restaurant?.organizationName || 'Unknown Restaurant'}</p>
                    <p>Requested: {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex flex-col items-end space-y-2">
                  {(req.status === 'PENDING' || req.status === 'ACCEPTED') && (
                    <Button variant="danger" size="sm" onClick={() => handleCancel(req.id)}>
                      Cancel Request
                    </Button>
                  )}
                </div>
              </div>

              {/* Volunteer Assignment Section */}
              {req.assignments && req.assignments.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4 bg-gray-50 -mx-6 px-6 -mb-6 pb-4 rounded-b-xl">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-2">
                    <Truck className="h-4 w-4 mr-1 text-emerald-600" />
                    Volunteer Status: {req.assignments[0].status}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Assigned Volunteer Contact: {req.assignments[0].volunteer.user.email} / {req.assignments[0].volunteer.phone}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No requests found matching this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupRequests;
