import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { alertsApi } from '../../api/alerts';
import { useStore } from '../../contexts/StoreContext';
import { AlertCountResponse } from '../../types';

export function NotificationBell() {
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const [alertCount, setAlertCount] = useState<AlertCountResponse | null>(null);

  useEffect(() => {
    if (!currentStore) return;

    const fetchCount = async () => {
      try {
        const data = await alertsApi.getCount(currentStore.id);
        setAlertCount(data);
      } catch {
        // Silently fail - non-critical UI element
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [currentStore?.id]);

  const count = alertCount?.count || 0;
  const hasCritical = (alertCount?.bySeverity?.CRITICAL || 0) > 0;
  const hasWarning = (alertCount?.bySeverity?.WARNING || 0) > 0;

  let badgeColor = 'bg-blue-500';
  if (hasCritical) badgeColor = 'bg-red-500';
  else if (hasWarning) badgeColor = 'bg-yellow-500';

  return (
    <button
      onClick={() => navigate('/alerts')}
      className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Alerts"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 ${badgeColor} text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
