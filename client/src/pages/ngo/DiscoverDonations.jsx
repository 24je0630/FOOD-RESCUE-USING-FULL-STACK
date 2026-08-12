import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';
import ngoService from '../../services/ngoService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Search, MapPin, List } from 'lucide-react';

// Fix for default leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = ['ALL', 'PRODUCE', 'BAKED_GOODS', 'PREPARED_MEALS', 'DAIRY', 'MEAT', 'BEVERAGES', 'OTHER'];

const DiscoverDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  // Mocking NGO location for distance filter demonstration
  const [lat, _setLat] = useState('40.7128');
  const [lng, _setLng] = useState('-74.0060');

  const navigate = useNavigate();

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (category !== 'ALL') filters.category = category;
      
      // We pass lat/lng/radius to demo the haversine distance filtering on backend
      filters.lat = lat;
      filters.lng = lng;
      filters.radius = '50'; // 50km radius default

      const data = await ngoService.discoverDonations(filters);
      setDonations(data.donations || []);
    } catch (error) {
      console.error('Failed to load donations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // re-fetch when category changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonations();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Discover Donations</h1>
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button variant={viewMode === 'list' ? 'primary' : 'secondary'} onClick={() => setViewMode('list')}>
            <List className="mr-2 h-4 w-4" /> List
          </Button>
          <Button variant={viewMode === 'map' ? 'primary' : 'secondary'} onClick={() => setViewMode('map')}>
            <MapPin className="mr-2 h-4 w-4" /> Map
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
              <Input 
                placeholder="Search food, descriptions..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Loader className="h-64" />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {donations.length > 0 ? (
            donations.map((donation) => (
              <Card key={donation.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gray-100 h-32 flex items-center justify-center border-b border-gray-200 text-gray-400">
                  {/* Placeholder for image */}
                  <span className="text-sm">No Image</span>
                </div>
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate" title={donation.title}>{donation.title}</h3>
                    <Badge variant="success">Available</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{donation.description || 'No description'}</p>
                  
                  <div className="mt-auto space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Qty:</span> {donation.quantity} {donation.unit}
                    </div>
                    <div className="flex items-center text-red-500">
                      <span className="font-medium mr-2">Deadline:</span> {format(new Date(donation.pickupDeadline), 'MMM d, h:mm a')}
                    </div>
                    {donation.distanceKm !== undefined && (
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" /> {donation.distanceKm.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => navigate(`/ngo/donations/${donation.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              No available donations found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-gray-200">
          <MapContainer 
            center={[parseFloat(lat), parseFloat(lng)]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* NGO Marker */}
            <Marker position={[parseFloat(lat), parseFloat(lng)]}>
              <Popup>
                <strong>Your Location</strong>
              </Popup>
            </Marker>

            {/* Donation Markers */}
            {donations.map(donation => (
              donation.restaurant?.latitude && donation.restaurant?.longitude ? (
                <Marker 
                  key={donation.id} 
                  position={[donation.restaurant.latitude, donation.restaurant.longitude]}
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-semibold">{donation.title}</h3>
                      <p className="text-xs mt-1 mb-2 text-gray-600">{donation.quantity} {donation.unit}</p>
                      <Button size="sm" onClick={() => navigate(`/ngo/donations/${donation.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default DiscoverDonations;
