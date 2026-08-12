import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import donationService from '../../services/donationService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { MapPin, Clock, Info, CheckCircle } from 'lucide-react';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDonation = async () => {
    try {
      const data = await donationService.getDonationById(id);
      setDonation(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load donation details');
      navigate('/restaurant/donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this donation?')) {
      try {
        setActionLoading(true);
        await donationService.updateDonationStatus(id, 'CANCELLED');
        toast.success('Donation cancelled');
        fetchDonation();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      await donationService.acceptPickupRequest(requestId);
      toast.success('Pickup request accepted');
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader className="h-64" />;
  if (!donation) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{donation.title}</h1>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          {donation.status === 'AVAILABLE' && (
            <Button variant="danger" isLoading={actionLoading} onClick={handleCancel}>Cancel Donation</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Category</span>
                  <span className="font-medium">{donation.category}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Quantity</span>
                  <span className="font-medium">{donation.quantity} {donation.unit}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Status</span>
                  <span className="font-medium mt-1 block"><Badge>{donation.status}</Badge></span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <span className="block text-gray-500 text-sm">Description</span>
                <p className="mt-1 text-gray-700">{donation.description || 'No description provided.'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pickup Requests Section */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {donation.pickupRequests && donation.pickupRequests.length > 0 ? (
                <div className="space-y-4">
                  {donation.pickupRequests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Requested by NGO</h4>
                        <p className="text-sm text-gray-500">Requested at: {format(new Date(req.createdAt), 'MMM d, h:mm a')}</p>
                        <Badge className="mt-2" variant={req.status === 'PENDING' ? 'warning' : req.status === 'ACCEPTED' ? 'success' : 'default'}>{req.status}</Badge>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        {req.status === 'PENDING' && donation.status === 'AVAILABLE' && (
                          <Button size="sm" isLoading={actionLoading} onClick={() => handleAcceptRequest(req.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No pickup requests yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start text-gray-600">
                <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <span className="block font-medium text-gray-900">Pickup Address</span>
                  <span>{donation.pickupAddress}</span>
                </div>
              </div>
              <div className="flex items-start text-gray-600">
                <Clock className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <span className="block font-medium text-gray-900">Expiry Time</span>
                  <span>{format(new Date(donation.expiryTime), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
              <div className="flex items-start text-gray-600">
                <Info className="mr-3 h-5 w-5 text-red-400" />
                <div>
                  <span className="block font-medium text-gray-900">Pickup Deadline</span>
                  <span>{format(new Date(donation.pickupDeadline), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
