import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import volunteerService from '../../services/volunteerService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { MapPin, Phone, User, CheckCircle, Truck, Package, Camera, Upload } from 'lucide-react';
import MapView from '../../components/maps/MapView';
import LocationMarker, { ICONS } from '../../components/maps/LocationMarker';
import { isValidCoordinate } from '../../components/maps/mapUtils';
import ImageUploader from '../../components/common/ImageUploader';

const VolunteerPickupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [showProofUpload, setShowProofUpload] = useState(false);

  const fetchAssignment = async () => {
    try {
      // Find the specific assignment from the list API (since we don't have a single-get route for volunteers)
      const data = await volunteerService.getMyAssignments();
      const found = data.assignments.find(a => a.id === id);
      if (found) {
        setAssignment(found);
      } else {
        toast.error('Assignment not found');
        navigate('/volunteer/assignments');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      setActionLoading(true);
      await volunteerService.updateAssignmentStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchAssignment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!proofFile) return toast.error('Please select a proof image');
    try {
      setActionLoading(true);
      await volunteerService.uploadProof(id, proofFile);
      toast.success('Proof uploaded successfully');
      setShowProofUpload(false);
      fetchAssignment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader className="h-64" />;
  if (!assignment) return null;

  const request = assignment.pickupRequest;
  const donation = request.donation;
  const restaurant = donation.restaurant;
  const ngo = request.ngo;

  // Derive workflow steps
  const workflow = [
    { label: 'Assigned', status: 'ASSIGNED', icon: User },
    { label: 'Accepted', status: 'ACCEPTED', icon: CheckCircle },
    { label: 'Started Pickup', status: 'PICKUP_STARTED', icon: Truck },
    { label: 'Collected', status: 'FOOD_COLLECTED', icon: Package },
    { label: 'Delivered', status: 'DELIVERED', icon: MapPin },
  ];
  
  const currentStatusIndex = workflow.findIndex(w => w.status === assignment.status);
  // If COMPLETED, it acts like DELIVERED for volunteer view.
  const activeIndex = assignment.status === 'COMPLETED' ? workflow.length - 1 : currentStatusIndex;

  const mapBounds = [];
  const pickupLat = donation.latitude || restaurant?.latitude;
  const pickupLng = donation.longitude || restaurant?.longitude;
  if (isValidCoordinate(pickupLat, pickupLng)) {
    mapBounds.push([pickupLat, pickupLng]);
  }
  
  if (isValidCoordinate(ngo?.latitude, ngo?.longitude)) {
    mapBounds.push([ngo.latitude, ngo.longitude]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pickup Details</h1>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          
          {/* Action Buttons based on status state machine */}
          {assignment.status === 'ASSIGNED' && (
            <Button isLoading={actionLoading} onClick={() => handleStatusUpdate('ACCEPTED')}>Accept Assignment</Button>
          )}
          {assignment.status === 'ACCEPTED' && (
            <Button isLoading={actionLoading} onClick={() => handleStatusUpdate('PICKUP_STARTED')}>Start Pickup</Button>
          )}
          {assignment.status === 'PICKUP_STARTED' && (
            <Button isLoading={actionLoading} onClick={() => handleStatusUpdate('FOOD_COLLECTED')}>Mark as Collected</Button>
          )}
          {assignment.status === 'FOOD_COLLECTED' && (
            <Button isLoading={actionLoading} onClick={() => handleStatusUpdate('DELIVERED')}>Mark as Delivered</Button>
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 rounded-full transition-all duration-500" 
              style={{ width: `${(activeIndex / (workflow.length - 1)) * 100}%` }}
            />
            
            {workflow.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= activeIndex;
              return (
                <div key={step.status} className="relative z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-medium mt-2 absolute -bottom-6 whitespace-nowrap ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {(assignment.status === 'FOOD_COLLECTED' || assignment.status === 'DELIVERED') && !assignment.proofImageUrl && (
         <Card className="border-emerald-200 bg-emerald-50">
           <CardContent className="p-4 flex justify-between items-center">
             <div className="flex items-center text-emerald-800">
               <Camera className="h-5 w-5 mr-2" />
               <span className="font-medium">Upload Delivery Proof to confirm delivery (Required by some NGOs)</span>
             </div>
             <Button size="sm" onClick={() => setShowProofUpload(!showProofUpload)}>
               <Upload className="h-4 w-4 mr-2" /> Upload Proof
             </Button>
           </CardContent>
           {showProofUpload && (
             <div className="px-4 pb-4 border-t border-emerald-200 mt-2 pt-4">
                <form onSubmit={handleProofUpload} className="flex flex-col space-y-4">
                  <ImageUploader 
                    onImageSelect={setProofFile}
                    onImageClear={() => setProofFile(null)}
                    isUploading={actionLoading}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={actionLoading} disabled={!proofFile}>Submit Proof</Button>
                  </div>
                </form>
             </div>
           )}
         </Card>
      )}

      {assignment.proofImageUrl && (
         <Card>
           <CardHeader>
             <CardTitle>Delivery Proof</CardTitle>
           </CardHeader>
           <CardContent>
             <img src={assignment.proofImageUrl} alt="Delivery proof" className="max-h-64 rounded-lg border border-gray-200" />
           </CardContent>
         </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pickup Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MapPin className="text-blue-500 mr-2 h-5 w-5" /> Pickup From (Restaurant)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900">{restaurant?.organizationName}</h3>
            <p className="text-gray-600">{restaurant?.address}</p>
            {restaurant?.phone && (
              <p className="text-gray-600 flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-400" /> {restaurant.phone}</p>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500">Food to collect:</span>
              <p className="font-semibold text-gray-900 mt-1">{donation?.title}</p>
              <p className="text-sm text-gray-600">{donation?.quantity} {donation?.unit}</p>
            </div>
            <div className="pt-2">
              <span className="text-sm font-medium text-gray-500">Deadline:</span>
              <p className="font-semibold text-red-600">{format(new Date(donation.pickupDeadline), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dropoff Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MapPin className="text-emerald-500 mr-2 h-5 w-5" /> Deliver To (NGO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900">{ngo?.organizationName}</h3>
            <p className="text-gray-600">{ngo?.address}</p>
            {ngo?.phone && (
              <p className="text-gray-600 flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-400" /> {ngo.phone}</p>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <div className="mt-1"><Badge>{assignment.status}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mapBounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapView 
              bounds={mapBounds} 
              className="h-[400px] w-full rounded-md shadow-sm z-0"
            >
              {isValidCoordinate(pickupLat, pickupLng) && (
                <LocationMarker 
                  lat={pickupLat} 
                  lng={pickupLng} 
                  icon={ICONS.blue} 
                  popup={
                    <div className="p-1">
                      <h3 className="font-semibold text-blue-700">Pickup</h3>
                      <p className="text-sm">{restaurant?.organizationName}</p>
                    </div>
                  } 
                />
              )}
              {isValidCoordinate(ngo?.latitude, ngo?.longitude) && (
                <LocationMarker 
                  lat={ngo.latitude} 
                  lng={ngo.longitude} 
                  icon={ICONS.green} 
                  popup={
                    <div className="p-1">
                      <h3 className="font-semibold text-emerald-700">Delivery</h3>
                      <p className="text-sm">{ngo?.organizationName}</p>
                    </div>
                  } 
                />
              )}
            </MapView>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default VolunteerPickupDetails;
