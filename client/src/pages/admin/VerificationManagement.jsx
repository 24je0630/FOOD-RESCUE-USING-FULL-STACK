import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const VerificationManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RESTAURANTS');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [restRes, ngoRes, volRes] = await Promise.all([
        adminService.getRestaurants({ verificationStatus: 'PENDING' }),
        adminService.getNgos({ verificationStatus: 'PENDING' }),
        adminService.getVolunteers({ verificationStatus: 'PENDING' })
      ]);
      setRestaurants(restRes.restaurants);
      setNgos(ngoRes.ngos);
      setVolunteers(volRes.volunteers);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleUpdate = async (type, id, status) => {
    if (window.confirm(`Are you sure you want to ${status.toLowerCase()} this verification?`)) {
      try {
        if (type === 'RESTAURANT') await adminService.updateRestaurantVerification(id, status);
        if (type === 'NGO') await adminService.updateNgoVerification(id, status);
        if (type === 'VOLUNTEER') await adminService.updateVolunteerVerification(id, status);
        toast.success(`${type} verification ${status.toLowerCase()}`);
        fetchPending();
      } catch (err) {
        console.error(err);
        toast.error(`Failed to update ${type} verification`);
      }
    }
  };

  const renderTable = (items, type) => {
    if (items.length === 0) {
      return <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">No pending {type.toLowerCase()} verifications.</div>;
    }

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {type === 'VOLUNTEER' ? 'Name/Phone' : 'Organization'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Address/Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{type === 'VOLUNTEER' ? 'Volunteer' : item.organizationName}</div>
                    <div className="text-sm text-gray-500">{item.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.address || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.user?.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleUpdate(type, item.id, 'VERIFIED')}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => handleUpdate(type, item.id, 'REJECTED')}>Reject</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) return <Loader className="h-64" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pending Verifications</h1>

      <div className="flex space-x-2 border-b border-gray-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('RESTAURANTS')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'RESTAURANTS' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          Restaurants <Badge variant="warning" className="ml-2">{restaurants.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('NGOS')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'NGOS' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          NGOs <Badge variant="warning" className="ml-2">{ngos.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('VOLUNTEERS')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'VOLUNTEERS' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          Volunteers <Badge variant="warning" className="ml-2">{volunteers.length}</Badge>
        </button>
      </div>

      {activeTab === 'RESTAURANTS' && renderTable(restaurants, 'RESTAURANT')}
      {activeTab === 'NGOS' && renderTable(ngos, 'NGO')}
      {activeTab === 'VOLUNTEERS' && renderTable(volunteers, 'VOLUNTEER')}
    </div>
  );
};

export default VerificationManagement;
