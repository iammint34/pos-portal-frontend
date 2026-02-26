import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../components/ui';
import { reportsApi } from '../../api/reports';
import { branchesApi } from '../../api/branches';
import { posApi } from '../../api/pos';
import { useStore } from '../../contexts/StoreContext';
import {
  DashboardStats,
  TopSellingItem,
  SalesByHour,
  SalesByPaymentMethod,
  SalesByBranch,
  TransactionReport,
} from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Monitor,
  Clock,
  Package,
  Building2,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PosDeviceStats {
  total: number;
  online: number;
  offline: number;
  inactive: number;
}

const CHART_COLORS = ['#f97316', '#ea580c', '#c2410c', '#eab308', '#16a34a', '#9a3412'];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: '#16a34a',
  CREDIT_CARD: '#f97316',
  DEBIT_CARD: '#c2410c',
  MOBILE_PAYMENT: '#eab308',
};

export function DashboardPage() {
  const { currentStore } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [salesByHour, setSalesByHour] = useState<SalesByHour[]>([]);
  const [salesByPayment, setSalesByPayment] = useState<SalesByPaymentMethod[]>([]);
  const [salesByBranch, setSalesByBranch] = useState<SalesByBranch[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionReport[]>([]);
  const [posStats, setPosStats] = useState<PosDeviceStats | null>(null);
  const [branchCount, setBranchCount] = useState(0);

  const fetchDashboardData = async (showRefreshing = false) => {
    if (!currentStore?.id) return;

    if (showRefreshing) setIsRefreshing(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const params = {
        storeId: currentStore.id,
        startDate: `${today}T00:00:00.000Z`,
        endDate: `${today}T23:59:59.999Z`,
      };

      const results = await Promise.allSettled([
        reportsApi.getDashboardStats(currentStore.id),
        reportsApi.getTopSellingItems(params, 5),
        reportsApi.getSalesByHour(params),
        reportsApi.getSalesByPaymentMethod(params),
        reportsApi.getSalesByBranch(params),
        reportsApi.getTransactions({ ...params, limit: 5 }),
        posApi.getStats(currentStore.id),
        branchesApi.getAll({ storeId: currentStore.id, limit: 1 }),
      ]);

      if (results[0].status === 'fulfilled') setDashboardStats(results[0].value);
      if (results[1].status === 'fulfilled') setTopItems(results[1].value);
      if (results[2].status === 'fulfilled') setSalesByHour(results[2].value);
      if (results[3].status === 'fulfilled') setSalesByPayment(results[3].value);
      if (results[4].status === 'fulfilled') setSalesByBranch(results[4].value);
      if (results[5].status === 'fulfilled') setRecentTransactions(results[5].value.data);
      if (results[6].status === 'fulfilled') setPosStats(results[6].value);
      if (results[7].status === 'fulfilled') setBranchCount(results[7].value.meta.total);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchDashboardData(), 60000);
    return () => clearInterval(interval);
  }, [currentStore?.id]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (!currentStore) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Please select a store to view the dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-48 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const hourlyChartData = salesByHour
    .filter(h => h.totalSales > 0)
    .map(h => ({
      hour: h.hourLabel,
      sales: h.totalSales,
      orders: h.orderCount,
    }));

  const topItemsChartData = [...topItems]
    .reverse()
    .map(item => ({
      name: item.itemName.length > 15 ? item.itemName.slice(0, 15) + '...' : item.itemName,
      fullName: item.itemName,
      revenue: item.revenue,
      quantity: item.quantitySold,
    }));

  const paymentChartData = salesByPayment.map(p => ({
    name: p.paymentMethod.replace(/_/g, ' '),
    value: p.totalAmount,
    count: p.transactionCount,
    percentage: p.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{currentStore.name} Overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Today's Sales</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {formatCurrency(dashboardStats?.todaySales || 0)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-sm",
                  (dashboardStats?.salesGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(dashboardStats?.salesGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(dashboardStats?.salesGrowth || 0).toFixed(1)}% vs yesterday</span>
                </div>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Today's Orders</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  {dashboardStats?.todayOrders || 0}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-sm",
                  (dashboardStats?.ordersGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(dashboardStats?.ordersGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(dashboardStats?.ordersGrowth || 0).toFixed(1)}% vs yesterday</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg. Order Value</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {formatCurrency(dashboardStats?.todayAvgOrder || 0)}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Yesterday: {formatCurrency((dashboardStats?.yesterdaySales || 0) / (dashboardStats?.yesterdayOrders || 1))}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POS Devices */}
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">POS Devices</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">
                  {posStats?.online || 0} <span className="text-lg font-normal text-amber-600">/ {posStats?.total || 0}</span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {posStats?.online || 0} online, {posStats?.offline || 0} offline
                </p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <Monitor className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Yesterday</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboardStats?.yesterdaySales || 0)}</p>
                <p className="text-sm text-gray-500">{dashboardStats?.yesterdayOrders || 0} orders</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboardStats?.weekSales || 0)}</p>
                <p className="text-sm text-gray-500">{dashboardStats?.weekOrders || 0} orders</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">This Month</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboardStats?.monthSales || 0)}</p>
                <p className="text-sm text-gray-500">{dashboardStats?.monthOrders || 0} orders</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-primary-600" />
              Sales by Hour (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyChartData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No sales data yet today</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary-600" />
              Top Selling Items (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItemsChartData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No sales data yet today</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topItemsChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props: { payload: { fullName: string; quantity: number } }) => [
                      `${formatCurrency(value)} (${props.payload.quantity} sold)`,
                      props.payload.fullName,
                    ]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={24}>
                    {topItemsChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Payment Methods (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentChartData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment data yet today</div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PAYMENT_COLORS[salesByPayment[index]?.paymentMethod] || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {salesByPayment.map((payment, index) => (
                    <div key={payment.paymentMethod} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PAYMENT_COLORS[payment.paymentMethod] || CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {payment.paymentMethod.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{payment.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-primary-600" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions yet today</div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">#{tx.orderNumber}</p>
                        <Badge variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'VOIDED' ? 'danger' : 'warning'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {tx.itemCount} items • {tx.orderType.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(tx.grandTotal)}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Branch (if multiple branches) */}
      {branchCount > 1 && salesByBranch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-primary-600" />
              Sales by Branch (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salesByBranch.map((branch) => (
                <div key={branch.branchId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{branch.branchName}</p>
                    <Badge variant="default">{branch.percentage.toFixed(1)}%</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(branch.netSales)}</p>
                  <p className="text-sm text-gray-500">{branch.orderCount} orders</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* POS Device Status */}
      {posStats && posStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="w-5 h-5 text-primary-600" />
              POS Device Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-2"></div>
                <p className="text-2xl font-bold text-green-700">{posStats.online}</p>
                <p className="text-sm text-green-600">Online</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mx-auto mb-2"></div>
                <p className="text-2xl font-bold text-gray-700">{posStats.offline}</p>
                <p className="text-sm text-gray-600">Offline</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2"></div>
                <p className="text-2xl font-bold text-red-700">{posStats.inactive}</p>
                <p className="text-sm text-red-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
