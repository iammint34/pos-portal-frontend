import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { storesApi } from '../../api/stores';
import { branchesApi } from '../../api/branches';
import { itemsApi } from '../../api/items';
import { posApi } from '../../api/pos';
import { useStore } from '../../contexts/StoreContext';
import { Store as StoreIcon, Building2, Package, Monitor, TrendingUp, Activity } from 'lucide-react';

interface DashboardStats {
  stores: number;
  branches: number;
  items: number;
  posDevices: {
    total: number;
    online: number;
    offline: number;
    inactive: number;
  };
  syncStats: {
    last24Hours: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
    };
    lastHour?: number;
  };
}

export function DashboardPage() {
  const { currentStore } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storesRes = await storesApi.getAll({ limit: 1 });

        // If we have a current store, fetch store-specific stats
        if (currentStore) {
          const [branches, items, posStats, syncStats] = await Promise.all([
            branchesApi.getAll({ storeId: currentStore.id, limit: 1 }),
            itemsApi.getAll({ storeId: currentStore.id, limit: 1 }),
            posApi.getStats(currentStore.id),
            posApi.getSyncStats(currentStore.id),
          ]);

          setStats({
            stores: storesRes.meta.total,
            branches: branches.meta.total,
            items: items.meta.total,
            posDevices: posStats,
            syncStats: syncStats,
          });
        } else {
          setStats({
            stores: storesRes.meta.total,
            branches: 0,
            items: 0,
            posDevices: { total: 0, online: 0, offline: 0, inactive: 0 },
            syncStats: { last24Hours: { total: 0, successful: 0, failed: 0, successRate: '0' } },
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentStore]);

  const statCards = [
    {
      title: 'Total Stores',
      value: stats?.stores || 0,
      icon: StoreIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Total Branches',
      value: stats?.branches || 0,
      icon: Building2,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Total Items',
      value: stats?.items || 0,
      icon: Package,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'POS Devices',
      value: stats?.posDevices.total || 0,
      icon: Monitor,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              POS Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Online</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-semibold">{stats?.posDevices.online || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Offline</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="font-semibold">{stats?.posDevices.offline || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactive</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="font-semibold">{stats?.posDevices.inactive || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Sync Statistics (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Syncs</span>
                <span className="font-semibold">{stats?.syncStats.last24Hours.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successful</span>
                <span className="font-semibold text-green-600">
                  {stats?.syncStats.last24Hours.successful || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Failed</span>
                <span className="font-semibold text-red-600">
                  {stats?.syncStats.last24Hours.failed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-semibold">{stats?.syncStats.last24Hours.successRate || 100}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
