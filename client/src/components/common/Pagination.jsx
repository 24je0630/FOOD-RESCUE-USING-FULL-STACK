import React from 'react';
import Button from '../ui/Button';

const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages } = meta;

  return (
    <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
      <div className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          disabled={page <= 1} 
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button 
          variant="outline" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
