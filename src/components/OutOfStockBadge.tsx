import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, X } from 'lucide-react';

interface OutOfStockBadgeProps {
  status: string;
  until?: string;
  className?: string;
}

export function OutOfStockBadge({ status, until, className = "" }: OutOfStockBadgeProps) {
  if (status === 'in_stock') return null;

  const getStatusInfo = () => {
    switch (status) {
      case 'out_today':
        return {
          label: 'Out Today',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100'
        };
      case 'out_indefinite':
        return {
          label: 'Out of Stock',
          icon: X,
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100'
        };
      case 'out_until':
        const untilDate = until ? new Date(until).toLocaleDateString() : '';
        return {
          label: `Out Until ${untilDate}`,
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100'
        };
      default:
        return {
          label: 'Unavailable',
          icon: X,
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100'
        };
    }
  };

  const { label, icon: Icon, className: statusClassName } = getStatusInfo();

  return (
    <Badge variant="outline" className={`${statusClassName} ${className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}