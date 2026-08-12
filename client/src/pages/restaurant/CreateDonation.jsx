import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import donationService from '../../services/donationService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import MapView from '../../components/maps/MapView';
import LocationMarker from '../../components/maps/LocationMarker';
import { isValidCoordinate } from '../../components/maps/mapUtils';
import ImageUploader from '../../components/common/ImageUploader';

const CATEGORIES = ['PRODUCE', 'BAKED_GOODS', 'PREPARED_MEALS', 'DAIRY', 'MEAT', 'BEVERAGES', 'OTHER'];

const CreateDonation = () => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Try to default to restaurant profile location if available
  const defaultLat = user?.restaurantProfile?.latitude || 40.7128;
  const defaultLng = user?.restaurantProfile?.longitude || -74.0060;

  const [selectedLocation, setSelectedLocation] = React.useState({
    lat: defaultLat,
    lng: defaultLng
  });
  
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Register hidden fields for react-hook-form
  React.useEffect(() => {
    register('latitude');
    register('longitude');
    setValue('latitude', selectedLocation.lat);
    setValue('longitude', selectedLocation.lng);
  }, [register, setValue, selectedLocation]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    if (isValidCoordinate(lat, lng)) {
      setSelectedLocation({ lat, lng });
      setValue('latitude', lat);
      setValue('longitude', lng);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Data casting matching Zod validation on backend
      const payload = {
        ...data,
        quantity: parseFloat(data.quantity),
        preparationTime: data.preparationTime ? new Date(data.preparationTime).toISOString() : undefined,
        expiryTime: new Date(data.expiryTime).toISOString(),
        pickupDeadline: new Date(data.pickupDeadline).toISOString(),
      };

      const createdDonation = await donationService.createDonation(payload);
      
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          await donationService.uploadDonationImage(createdDonation.donation.id, selectedImage);
          toast.success('Donation and image uploaded successfully!');
        } catch (imgError) {
          toast.error('Donation created, but image upload failed. You can retry later.');
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        toast.success('Donation created successfully!');
      }

      navigate('/restaurant/donations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create donation');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Donation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Food Title</label>
                <Input 
                  placeholder="e.g. 5 Trays of Lasagna" 
                  {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Minimum 3 characters' } })} 
                  error={errors.title?.message} 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Additional details about the food..."
                  {...register('description')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                <Select {...register('category', { required: 'Category is required' })} error={errors.category?.message}>
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Quantity</label>
                  <Input 
                    type="number" 
                    step="0.1"
                    {...register('quantity', { required: 'Required', min: { value: 0.1, message: 'Must be positive' } })} 
                    error={errors.quantity?.message} 
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Unit</label>
                  <Input 
                    placeholder="lbs, trays, portions" 
                    {...register('unit', { required: 'Required' })} 
                    error={errors.unit?.message} 
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Preparation Time (Optional)</label>
                <Input type="datetime-local" {...register('preparationTime')} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Expiry Time</label>
                <Input type="datetime-local" {...register('expiryTime', { required: 'Expiry time is required' })} error={errors.expiryTime?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Pickup Deadline</label>
                <Input type="datetime-local" {...register('pickupDeadline', { required: 'Pickup deadline is required' })} error={errors.pickupDeadline?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Pickup Address</label>
                <Input 
                  placeholder="123 Main St, City, ZIP" 
                  {...register('pickupAddress', { required: 'Pickup address is required' })} 
                  error={errors.pickupAddress?.message} 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Donation Image (Optional)</label>
                <ImageUploader 
                  onImageSelect={(file) => setSelectedImage(file)}
                  onImageClear={() => setSelectedImage(null)}
                  isUploading={isUploadingImage}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Pinpoint Location on Map</label>
                <p className="mb-2 text-xs text-gray-500">Click on the map to set the exact pickup location.</p>
                <MapView 
                  center={selectedLocation} 
                  zoom={13} 
                  onClick={handleMapClick}
                >
                  <LocationMarker 
                    lat={selectedLocation.lat} 
                    lng={selectedLocation.lng} 
                    popup={<span>Pickup Location</span>} 
                  />
                </MapView>
                <input type="hidden" {...register('latitude')} />
                <input type="hidden" {...register('longitude')} />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/restaurant/donations')}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting || isUploadingImage}>Create Donation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDonation;
