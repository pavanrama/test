'use client';

import { getStatusColor } from '@/lib/data';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
      getStatusColor(status),
      className
    )}>
      {status}
    </span>
  );
}
