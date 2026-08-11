import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import adminService from '../../services/adminService';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Activity } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    try {
      const data = await adminService.getActivityLogs({ page: pageNum, limit: 30 });
      if (pageNum === 1) {
        setLogs(data.logs);
      } else {
        setLogs(prev => [...prev, ...data.logs]);
      }
      setHasMore(data.logs.length === 30);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Logs</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center text-sm font-medium text-gray-600">
          <Activity className="h-4 w-4 mr-2" /> Complete System Audit Trail
        </div>
        
        {loading && page === 1 ? (
          <Loader className="h-64" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-64">Action</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                        {log.user?.email || 'System'}
                        <span className="block text-xs text-gray-500 font-normal">{log.user?.role}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm font-mono text-gray-700 bg-gray-50">
                        {log.action}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-md" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button variant="secondary" onClick={() => setPage(p => p + 1)}>Load More</Button>
        </div>
      )}
      {loading && page > 1 && <Loader className="h-12" />}
    </div>
  );
};

export default ActivityLogs;
