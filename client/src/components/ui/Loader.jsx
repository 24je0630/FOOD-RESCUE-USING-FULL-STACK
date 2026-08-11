import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Loader = ({ className, size = 24 }) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 size={size} className="animate-spin text-emerald-600" />
    </div>
  );
};

export default Loader;
