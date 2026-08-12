import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { List, MapPin } from 'lucide-react';
import MapView from '../../components/maps/MapView';
import LocationMarker, { ICONS } from '../../components/maps/LocationMarker';
import { isValidCoordinate } from '../../components/maps/mapUtils';

const getStatusBadge = (status) => {
  switch (status) {
    case 'AVAILABLE': return <Badge variant="info">Available</Badge>;
    case 'REQUESTED': return <Badge variant="warning">Requested</Badge>;
    case 'ASSIGNED': return <Badge variant="primary">Assigned</Badge>;
    case 'DELIVERED': return <Badge variant="success">Delivered</Badge>;
    case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
    case 'EXPIRED': return <Badge variant="default">Expired</Badge>;
    default: return <Badge variant="default">{status}</Badge>;
  }
};

const DonationMonitoring = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await adminService.getDonations(filters);
      setDonations(data.donations);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Donation Monitoring</h1>
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button variant={viewMode === 'map' ? 'primary' : 'secondary'} onClick={() => setViewMode('map')}>
            <MapPin className="mr-2 h-4 w-4" /> Map
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="REQUESTED">Requested</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </Select>
          </div>
          <Button variant="secondary" onClick={fetchDonations}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <Loader className="h-64" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Food / Restaurant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category & Qty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Deadlines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {donations.length > 0 ? (
                    donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 truncate max-w-xs">{donation.title}</div>
                          <div className="text-sm text-gray-500">{donation.restaurant?.organizationName || 'Unknown'}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {donation.category}<br/>
                          <span className="font-medium text-gray-900">{donation.quantity} {donation.unit}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {getStatusBadge(donation.status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          Exp: {format(new Date(donation.expiryTime), 'MMM d, h:mm a')}<br/>
                          <span className="text-red-500">Pick: {format(new Date(donation.pickupDeadline), 'MMM d, h:mm a')}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No donations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <MapView 
              bounds={donations.map(d => {
                const lat = d.latitude || d.restaurant?.latitude;
                const lng = d.longitude || d.restaurant?.longitude;
                return isValidCoordinate(lat, lng) ? [lat, lng] : null;
              }).filter(Boolean)}
              className="h-[600px] w-full z-0"
            >
              {donations.map(donation => {
                const lat = donation.latitude || donation.restaurant?.latitude;
                const lng = donation.longitude || donation.restaurant?.longitude;
                if (isValidCoordinate(lat, lng)) {
                  let icon = ICONS.blue;
                  if (donation.status === 'AVAILABLE') icon = ICONS.green;
                  if (donation.status === 'ASSIGNED') icon = ICONS.orange;
                  if (donation.status === 'CANCELLED' || donation.status === 'EXPIRED') icon = ICONS.red;
                  
                  return (
                    <LocationMarker 
                      key={donation.id} 
                      lat={lat} 
                      lng={lng} 
                      icon={icon}
                      popup={
                        <div className="p-1 min-w-[150px]">
                          <h3 className="font-semibold">{donation.title}</h3>
                          <div className="mt-1">{getStatusBadge(donation.status)}</div>
                          <p className="text-xs mt-2 text-gray-600">{donation.restaurant?.organizationName}</p>
                        </div>
                      }
                    />
                  );
                }
                return null;
              })}
            </MapView>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationMonitoring;
