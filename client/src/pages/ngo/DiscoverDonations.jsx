import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ngoService from '../../services/ngoService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Search, MapPin, List, Compass } from 'lucide-react';
import MapView from '../../components/maps/MapView';
import LocationMarker, { ICONS } from '../../components/maps/LocationMarker';
import { getUserLocation, isValidCoordinate, formatDistance } from '../../components/maps/mapUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const CATEGORIES = ['ALL', 'PRODUCE', 'BAKED_GOODS', 'PREPARED_MEALS', 'DAIRY', 'MEAT', 'BEVERAGES', 'OTHER'];

const DiscoverDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [page, setPage] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [radius, setRadius] = useState('50'); // Default 50km
  
  // Location
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const navigate = useNavigate();

  // Try to use fallback NGO profile location on mount if available
  useEffect(() => {
    if (user?.ngoProfile?.latitude && user?.ngoProfile?.longitude) {
      setLocation({
        lat: user.ngoProfile.latitude,
        lng: user.ngoProfile.longitude
      });
    }
  }, [user]);

  const fetchDonations = async (currentLoc = location) => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (category !== 'ALL') filters.category = category;
      
      if (currentLoc && isValidCoordinate(currentLoc.lat, currentLoc.lng)) {
        filters.lat = currentLoc.lat;
        filters.lng = currentLoc.lng;
        filters.radius = radius;
      }
      filters.page = page;

      const data = await ngoService.discoverDonations(filters);
      setDonations(data.data.donations || []);
      setMeta(data.meta);
    } catch (error) {
      console.error('Failed to load donations', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, radius, location, page]); 

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDonations();
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationError('');
    try {
      const pos = await getUserLocation();
      setLocation(pos);
      toast.success('Location updated');
    } catch (err) {
      setLocationError(err.message);
      toast.error(err.message || 'Failed to get location');
    } finally {
      setIsLocating(false);
    }
  };

  // Compile map bounds based on current location and donation locations
  const mapBounds = [];
  if (location && isValidCoordinate(location.lat, location.lng)) {
    mapBounds.push([location.lat, location.lng]);
  }
  donations.forEach(d => {
    // Stage 15 data models state donation coordinates reside either on donation.latitude/longitude OR donation.restaurant.latitude/longitude. 
    // Usually fallback to restaurant coords for pickup if not specified explicitly on donation.
    const lat = d.latitude || d.restaurant?.latitude;
    const lng = d.longitude || d.restaurant?.longitude;
    if (isValidCoordinate(lat, lng)) {
      mapBounds.push([lat, lng]);
    }
  });

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
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0 items-end">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 items-end">
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
              <div className="w-full sm:w-32">
                <label className="mb-1 block text-sm font-medium text-gray-700">Radius (km)</label>
                <Select value={radius} onChange={(e) => setRadius(e.target.value)}>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </Select>
              </div>
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </form>
            <div className="w-full lg:w-auto mt-4 lg:mt-0 flex items-center justify-end">
              <Button 
                variant="secondary" 
                onClick={handleGetLocation} 
                isLoading={isLocating}
                title="Use Device Location"
              >
                <Compass className="mr-2 h-4 w-4 text-emerald-600" /> 
                {location ? 'Update Location' : 'Locate Me'}
              </Button>
            </div>
          </div>
          {locationError && (
            <p className="mt-2 text-sm text-red-500">{locationError}</p>
          )}
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
                        <MapPin className="mr-1 h-3 w-3" /> {formatDistance(donation.distanceKm)} away
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
          <div className="col-span-full">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        </div>
      ) : (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
          <MapView 
            center={location}
            zoom={12}
            bounds={mapBounds}
            className="h-[600px] w-full z-0"
          >
            {/* NGO Marker */}
            {location && isValidCoordinate(location.lat, location.lng) && (
              <LocationMarker 
                lat={location.lat} 
                lng={location.lng} 
                icon={ICONS.blue}
                popup={<strong>Your Search Origin</strong>}
              />
            )}

            {/* Donation Markers */}
            {donations.map(donation => {
              const dLat = donation.latitude || donation.restaurant?.latitude;
              const dLng = donation.longitude || donation.restaurant?.longitude;
              if (isValidCoordinate(dLat, dLng)) {
                return (
                  <LocationMarker 
                    key={donation.id} 
                    lat={dLat} 
                    lng={dLng} 
                    icon={ICONS.green}
                    popup={(
                      <div className="p-1 min-w-[150px]">
                        <h3 className="font-semibold">{donation.title}</h3>
                        <p className="text-xs mt-1 text-gray-600">{donation.quantity} {donation.unit}</p>
                        <p className="text-xs text-red-500 mb-2">by {format(new Date(donation.pickupDeadline), 'h:mm a')}</p>
                        <Button size="sm" className="w-full" onClick={() => navigate(`/ngo/donations/${donation.id}`)}>
                          Details
                        </Button>
                      </div>
                    )}
                  />
                );
              }
              return null;
            })}
          </MapView>
        </div>
      )}
    </div>
  );
};

export default DiscoverDonations;
