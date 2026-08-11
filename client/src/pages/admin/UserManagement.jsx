import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Search, ShieldAlert, CheckCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers({ search });
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMessage = currentStatus === 'ACTIVE' 
      ? 'Are you sure you want to suspend this user? They will not be able to log in.'
      : 'Are you sure you want to reactivate this user?';
      
    if (window.confirm(confirmMessage)) {
      try {
        setActionLoading(id);
        await adminService.updateUserStatus(id, newStatus);
        toast.success(`User successfully ${newStatus.toLowerCase()}`);
        fetchUsers();
      } catch (err) {
        toast.error('Failed to update user status');
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              className="pl-9"
              placeholder="Search users by email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {loading ? (
        <Loader className="h-64" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>{user.role}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {user.status === 'ACTIVE' 
                          ? <Badge variant="success">Active</Badge> 
                          : <Badge variant="danger">Suspended</Badge>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        {user.role !== 'ADMIN' && (
                          <Button 
                            variant={user.status === 'ACTIVE' ? 'danger' : 'success'} 
                            size="sm" 
                            isLoading={actionLoading === user.id}
                            onClick={() => toggleStatus(user.id, user.status)}
                          >
                            {user.status === 'ACTIVE' ? <><ShieldAlert className="h-4 w-4 mr-2" /> Suspend</> : <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
