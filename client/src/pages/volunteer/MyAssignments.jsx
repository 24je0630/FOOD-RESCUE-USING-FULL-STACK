import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import volunteerService from '../../services/volunteerService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { MapPin, Eye } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'ASSIGNED': return <Badge variant="warning">Assigned</Badge>;
    case 'ACCEPTED': return <Badge variant="primary">Accepted</Badge>;
    case 'PICKUP_STARTED': return <Badge variant="info">In Transit (Pickup)</Badge>;
    case 'FOOD_COLLECTED': return <Badge variant="info">In Transit (Delivery)</Badge>;
    case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
    case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await volunteerService.getMyAssignments();
        setAssignments(data.assignments || []);
      } catch (err) {
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const filteredAssignments = assignments.filter(a => filter === 'ALL' || a.status === filter);

  if (loading) return <Loader className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Assignments</h1>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 pb-4 overflow-x-auto">
        {['ALL', 'ASSIGNED', 'ACCEPTED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {f === 'ALL' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => {
            const request = assignment.pickupRequest;
            const donation = request?.donation;
            
            return (
              <div key={assignment.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-900">{donation?.title || 'Unknown Donation'}</h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-blue-500" /> 
                          <span>
                            <strong>Pickup:</strong> {donation?.restaurant?.organizationName}<br/>
                            <span className="text-gray-500">{donation?.restaurant?.address}</span>
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-emerald-500" /> 
                          <span>
                            <strong>Dropoff:</strong> {request?.ngo?.organizationName}<br/>
                            <span className="text-gray-500">{request?.ngo?.address}</span>
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-red-500 font-medium">
                      Deadline: {donation?.pickupDeadline ? format(new Date(donation.pickupDeadline), 'MMM d, h:mm a') : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex flex-col items-end space-y-2">
                    <Button onClick={() => navigate(`/volunteer/assignments/${assignment.id}`)}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No assignments found matching this filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;
