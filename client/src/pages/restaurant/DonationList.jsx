import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import donationService from '../../services/donationService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import { Eye, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';

const getStatusBadge = (status) => {
  switch (status) {
    case 'AVAILABLE': return <Badge variant="info">Available</Badge>;
    case 'ASSIGNED': return <Badge variant="primary">Assigned</Badge>;
    case 'PICKUP_STARTED': return <Badge variant="warning">Pickup Started</Badge>;
    case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
    case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
    case 'EXPIRED': return <Badge variant="default">Expired</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const data = await donationService.getMyDonations();
        setDonations(data);
      } catch (err) {
        console.error('Failed to load donations');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(d => filter === 'ALL' || d.status === filter);

  if (loading) return <Loader className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Donations</h1>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => navigate('/restaurant/donations/new')} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Donation
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 pb-4">
        {['ALL', 'AVAILABLE', 'ASSIGNED', 'DELIVERED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === f ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {f === 'ALL' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title & Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Deadline</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDonations.length > 0 ? (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{donation.title}</div>
                      <div className="text-sm text-gray-500">{donation.category}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {donation.quantity} {donation.unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(donation.pickupDeadline), 'MMM d, h:mm a')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(donation.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/restaurant/donations/${donation.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No donations found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonationList;
