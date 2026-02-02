import { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports';
import { branchesApi } from '../../api/branches';
import { useStore } from '../../contexts/StoreContext';
import {
  ReportQueryParams,
  DashboardStats,
  ReportSalesSummary,
  SalesByBranch,
  SalesByDevice,
  SalesByCategory,
  SalesByItem,
  TopSellingItem,
  SalesByPaymentMethod,
  SalesByHour,
  SalesTrend,
  TransactionReport,
  VoidedTransaction,
  DiscountReport,
  RefundReport,
  ShiftReport,
  ZReadingReport,
  StaffSales,
  StaffPerformance,
  Branch,
} from '../../types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui';
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  CreditCard,
  FileText,
  Building2,
  Monitor,
  Users,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function ReportsPage() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('summary');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ReportQueryParams>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    branchId: undefined,
    page: 1,
    limit: 50,
  });

  // Data states for each report type
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesSummary, setSalesSummary] = useState<ReportSalesSummary | null>(null);
  const [salesByBranch, setSalesByBranch] = useState<SalesByBranch[]>([]);
  const [salesByDevice, setSalesByDevice] = useState<SalesByDevice[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [salesByItem, setSalesByItem] = useState<SalesByItem[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [salesByPaymentMethod, setSalesByPaymentMethod] = useState<SalesByPaymentMethod[]>([]);
  const [salesByHour, setSalesByHour] = useState<SalesByHour[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [transactions, setTransactions] = useState<TransactionReport[]>([]);
  const [voidedTransactions, setVoidedTransactions] = useState<VoidedTransaction[]>([]);
  const [discountReport, setDiscountReport] = useState<DiscountReport[]>([]);
  const [refundReport, setRefundReport] = useState<RefundReport[]>([]);
  const [shiftReport, setShiftReport] = useState<ShiftReport[]>([]);
  const [zReadings, setZReadings] = useState<ZReadingReport[]>([]);
  const [staffSales, setStaffSales] = useState<StaffSales[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);

  // Pagination states
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);

  useEffect(() => {
    fetchBranches();
    fetchDashboardStats();
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore?.id) {
      fetchReportData();
    }
  }, [currentStore?.id, activeTab, filters, transactionsPage, itemsPage]);

  const fetchBranches = async () => {
    if (!currentStore?.id) return;
    try {
      const response = await branchesApi.getAll({ storeId: currentStore.id, limit: 100 });
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDashboardStats = async () => {
    if (!currentStore?.id) return;
    try {
      const data = await reportsApi.getDashboardStats(currentStore.id);
      setDashboardStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const getQueryParams = (): ReportQueryParams => ({
    storeId: currentStore?.id,
    branchId: filters.branchId,
    startDate: filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined,
    endDate: filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined,
  });

  const fetchReportData = async () => {
    if (!currentStore?.id) return;
    setIsLoading(true);

    try {
      const params = getQueryParams();

      switch (activeTab) {
        case 'dashboard':
          fetchDashboardStats();
          break;
        case 'summary':
          const summary = await reportsApi.getSalesSummary(params);
          setSalesSummary(summary);
          break;
        case 'by-branch':
          const byBranch = await reportsApi.getSalesByBranch(params);
          setSalesByBranch(byBranch);
          break;
        case 'by-device':
          const byDevice = await reportsApi.getSalesByDevice(params);
          setSalesByDevice(byDevice);
          break;
        case 'by-category':
          const byCategory = await reportsApi.getSalesByCategory(params);
          setSalesByCategory(byCategory);
          break;
        case 'by-item':
          const byItem = await reportsApi.getSalesByItem({ ...params, page: itemsPage, limit: 50 });
          setSalesByItem(byItem.data);
          setItemsTotalPages(byItem.meta.totalPages);
          break;
        case 'top-items':
          const topItems = await reportsApi.getTopSellingItems(params, 20);
          setTopSellingItems(topItems);
          break;
        case 'by-payment':
          const byPayment = await reportsApi.getSalesByPaymentMethod(params);
          setSalesByPaymentMethod(byPayment);
          break;
        case 'by-hour':
          const byHour = await reportsApi.getSalesByHour(params);
          setSalesByHour(byHour);
          break;
        case 'trend':
          const trend = await reportsApi.getSalesTrend(params);
          setSalesTrend(trend);
          break;
        case 'transactions':
          const txns = await reportsApi.getTransactions({ ...params, page: transactionsPage, limit: 50 });
          setTransactions(txns.data);
          setTransactionsTotalPages(txns.meta.totalPages);
          break;
        case 'voids':
          const voids = await reportsApi.getVoidedTransactions(params);
          setVoidedTransactions(voids.data);
          break;
        case 'discounts':
          const discounts = await reportsApi.getDiscountReport(params);
          setDiscountReport(discounts);
          break;
        case 'refunds':
          const refunds = await reportsApi.getRefundReport(params);
          setRefundReport(refunds.data);
          break;
        case 'shifts':
          const shifts = await reportsApi.getShiftHistory(params);
          setShiftReport(shifts.data);
          break;
        case 'z-readings':
          const zr = await reportsApi.getZReadingHistory(params);
          setZReadings(zr.data);
          break;
        case 'staff':
          const [staffSalesData, staffPerfData] = await Promise.all([
            reportsApi.getSalesByStaff(params),
            reportsApi.getStaffPerformance(params),
          ]);
          setStaffSales(staffSalesData);
          setStaffPerformance(staffPerfData);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (exportType: string) => {
    try {
      const params = getQueryParams();
      let blob: Blob;

      switch (exportType) {
        case 'summary':
          blob = await reportsApi.exportSalesSummary(params);
          break;
        case 'by-branch':
          blob = await reportsApi.exportSalesByBranch(params);
          break;
        case 'by-category':
          blob = await reportsApi.exportSalesByCategory(params);
          break;
        case 'by-item':
          blob = await reportsApi.exportSalesByItem(params);
          break;
        case 'transactions':
          blob = await reportsApi.exportTransactions(params);
          break;
        case 'z-readings':
          blob = await reportsApi.exportZReadings(params);
          break;
        case 'staff':
          blob = await reportsApi.exportSalesByStaff(params);
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Z-Readings export as .txt (BIR format), others as .csv
      const extension = exportType === 'z-readings' ? 'txt' : 'csv';
      a.download = `${exportType}-report-${filters.startDate}-${filters.endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  if (!currentStore) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Please select a store to view reports.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button onClick={fetchReportData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats.todaySales)}</p>
                  <p className="text-xs text-gray-400">{dashboardStats.todayOrders} orders</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Week Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats.weekSales)}</p>
                  <p className="text-xs text-gray-400">{dashboardStats.weekOrders} orders</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Month Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats.monthSales)}</p>
                  <p className="text-xs text-gray-400">{dashboardStats.monthOrders} orders</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats.todayAvgOrder)}</p>
                  <div className={cn(
                    "flex items-center text-xs",
                    dashboardStats.salesGrowth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {dashboardStats.salesGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {dashboardStats.salesGrowth.toFixed(1)}% vs yesterday
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Input
                label="End Date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select
                label="Branch"
                options={branchOptions}
                value={filters.branchId || ''}
                onChange={(e) => setFilters({ ...filters, branchId: e.target.value || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="by-branch">By Branch</TabsTrigger>
          <TabsTrigger value="by-device">By Device</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="by-item">By Item</TabsTrigger>
          <TabsTrigger value="top-items">Top Items</TabsTrigger>
          <TabsTrigger value="by-payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="by-hour">By Hour</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="voids">Voids</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="z-readings">Z-Readings</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Sales Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Sales Summary
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('summary')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : salesSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-xl font-bold">{salesSummary.totalOrders}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Gross Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.grossSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Discounts</p>
                    <p className="text-xl font-bold text-red-600">-{formatCurrency(salesSummary.totalDiscounts)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Refunds</p>
                    <p className="text-xl font-bold text-red-600">-{formatCurrency(salesSummary.totalRefunds)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Net Sales</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(salesSummary.netSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">VATable Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.vatableSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">VAT Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.vatAmount)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.averageOrderValue)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Cash Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.cashSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Card Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.cardSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">VAT Exempt Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.vatExemptSales)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Zero Rated Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(salesSummary.zeroRatedSales)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Branch Tab */}
        <TabsContent value="by-branch">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Sales by Branch
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('by-branch')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Refunds</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByBranch.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByBranch.map((row) => (
                      <TableRow key={row.branchId}>
                        <TableCell className="font-medium">{row.branchName}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(row.discounts)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(row.refunds)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                        <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Device Tab */}
        <TabsContent value="by-device">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Sales by Device
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByDevice.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByDevice.map((row) => (
                      <TableRow key={row.posDeviceId}>
                        <TableCell className="font-medium">{row.deviceName}</TableCell>
                        <TableCell>{row.branchName}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(row.discounts)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                        <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Category Tab */}
        <TabsContent value="by-category">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sales by Category
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('by-category')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByCategory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByCategory.map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell className="font-medium">{row.categoryName}</TableCell>
                        <TableCell className="text-right">{row.itemCount}</TableCell>
                        <TableCell className="text-right">{row.quantitySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(row.discounts)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                        <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Item Tab */}
        <TabsContent value="by-item">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sales by Item
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('by-item')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByItem.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByItem.map((row) => (
                      <TableRow key={row.itemId}>
                        <TableCell className="font-medium">{row.itemName}</TableCell>
                        <TableCell className="text-gray-500">{row.itemSku || '-'}</TableCell>
                        <TableCell>{row.categoryName || '-'}</TableCell>
                        <TableCell className="text-right">{row.quantitySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-right text-red-600">-{formatCurrency(row.discounts)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.averagePrice)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {itemsTotalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <Button variant="secondary" disabled={itemsPage === 1} onClick={() => setItemsPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center px-4 text-gray-600">Page {itemsPage} of {itemsTotalPages}</span>
                  <Button variant="secondary" disabled={itemsPage === itemsTotalPages} onClick={() => setItemsPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Selling Items Tab */}
        <TabsContent value="top-items">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : topSellingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    topSellingItems.map((row) => (
                      <TableRow key={row.itemId}>
                        <TableCell>
                          <Badge variant={row.rank <= 3 ? 'success' : 'default'}>{row.rank}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{row.itemName}</TableCell>
                        <TableCell>{row.categoryName || '-'}</TableCell>
                        <TableCell className="text-right">{row.quantitySold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Payment Method Tab */}
        <TabsContent value="by-payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Sales by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Tips</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByPaymentMethod.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByPaymentMethod.map((row) => (
                      <TableRow key={row.paymentMethod}>
                        <TableCell className="font-medium">{row.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right">{row.transactionCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.tipAmount)}</TableCell>
                        <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Hour Tab */}
        <TabsContent value="by-hour">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sales by Hour
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesByHour.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesByHour.map((row) => (
                      <TableRow key={row.hour}>
                        <TableCell className="font-medium">{row.hourLabel}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right">{row.itemsSold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.totalSales)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Trend Tab */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Net Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : salesTrend.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    salesTrend.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transactions
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('transactions')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">No data available</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.orderNumber}</TableCell>
                        <TableCell className="text-gray-500">{row.invoiceNumber || '-'}</TableCell>
                        <TableCell>{row.orderType}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'VOIDED' ? 'danger' : 'warning'}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.branchName}</TableCell>
                        <TableCell className="text-right">{row.itemCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.grandTotal)}</TableCell>
                        <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {transactionsTotalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <Button variant="secondary" disabled={transactionsPage === 1} onClick={() => setTransactionsPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center px-4 text-gray-600">Page {transactionsPage} of {transactionsTotalPages}</span>
                  <Button variant="secondary" disabled={transactionsPage === transactionsTotalPages} onClick={() => setTransactionsPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voids Tab */}
        <TabsContent value="voids">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Voided Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Original Total</TableHead>
                    <TableHead>Voided At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : voidedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No voided transactions</TableCell>
                    </TableRow>
                  ) : (
                    voidedTransactions.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.orderNumber}</TableCell>
                        <TableCell className="text-gray-500">{row.invoiceNumber || '-'}</TableCell>
                        <TableCell>{row.branchName}</TableCell>
                        <TableCell>{row.deviceName}</TableCell>
                        <TableCell>{row.voidReason || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(row.originalTotal)}</TableCell>
                        <TableCell>{formatDateTime(row.voidedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discounts Tab */}
        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Discount Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discount Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-right">Times Applied</TableHead>
                    <TableHead className="text-right">Orders Affected</TableHead>
                    <TableHead className="text-right">Total Discounted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : discountReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">No discounts applied</TableCell>
                    </TableRow>
                  ) : (
                    discountReport.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.discountName}</TableCell>
                        <TableCell>{row.discountType}</TableCell>
                        <TableCell>{row.discountScope}</TableCell>
                        <TableCell className="text-right">{row.timesApplied}</TableCell>
                        <TableCell className="text-right">{row.ordersAffected}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(row.totalDiscountAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Refund Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Refund Method</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Processed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : refundReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No refunds</TableCell>
                    </TableRow>
                  ) : (
                    refundReport.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.orderNumber}</TableCell>
                        <TableCell>{row.branchName}</TableCell>
                        <TableCell>{row.paymentMethod}</TableCell>
                        <TableCell>{row.refundMethod}</TableCell>
                        <TableCell>{row.reason || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(row.amount)}</TableCell>
                        <TableCell>{formatDateTime(row.processedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Shift Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : shiftReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">No shifts</TableCell>
                    </TableRow>
                  ) : (
                    shiftReport.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.operatorName}</TableCell>
                        <TableCell>{row.branchName}</TableCell>
                        <TableCell>{row.deviceName}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'CLOSED' ? 'success' : 'warning'}>{row.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(row.openedAt)}</TableCell>
                        <TableCell>{row.duration || '-'}</TableCell>
                        <TableCell className="text-right">{row.orderCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.totalSales)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          (row.variance || 0) > 0 ? 'text-blue-600' : (row.variance || 0) < 0 ? 'text-red-600' : ''
                        )}>
                          {row.variance !== null && row.variance !== undefined ? (
                            (row.variance >= 0 ? '+' : '') + formatCurrency(row.variance)
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <div className="space-y-6">
            {/* Sales by Staff */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sales by Staff
                </CardTitle>
                <Button variant="secondary" size="sm" onClick={() => handleExport('staff')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Discounts</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                      </TableRow>
                    ) : staffSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">No data available</TableCell>
                      </TableRow>
                    ) : (
                      staffSales.map((row) => (
                        <TableRow key={row.operatorId}>
                          <TableCell className="font-medium">{row.operatorName}</TableCell>
                          <TableCell className="text-right">{row.orderCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                          <TableCell className="text-right text-red-600">-{formatCurrency(row.discounts)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(row.netSales)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.averageOrderValue)}</TableCell>
                          <TableCell className="text-right">{row.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Staff Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead className="text-right">Voids</TableHead>
                        <TableHead className="text-right">Refunds</TableHead>
                        <TableHead className="text-right">Discounts</TableHead>
                        <TableHead className="text-right">Shifts</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Cash Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">Loading...</TableCell>
                        </TableRow>
                      ) : staffPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">No data available</TableCell>
                        </TableRow>
                      ) : (
                        staffPerformance.map((row) => (
                          <TableRow key={row.operatorId}>
                            <TableCell className="font-medium">{row.operatorName}</TableCell>
                            <TableCell className="text-right">{row.orderCount}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.totalSales)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.averageOrderValue)}</TableCell>
                            <TableCell className="text-right">
                              {row.voidCount > 0 ? (
                                <span className="text-red-600">{row.voidCount} ({formatCurrency(row.voidAmount)})</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.refundCount > 0 ? (
                                <span className="text-red-600">{row.refundCount} ({formatCurrency(row.refundAmount)})</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.discountCount > 0 ? (
                                <span className="text-orange-600">{row.discountCount} ({formatCurrency(row.discountAmount)})</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">{row.shiftCount}</TableCell>
                            <TableCell className="text-right">{row.totalShiftHours.toFixed(1)}h</TableCell>
                            <TableCell className={cn(
                              "text-right font-medium",
                              row.cashVariance > 0 ? 'text-blue-600' : row.cashVariance < 0 ? 'text-red-600' : ''
                            )}>
                              {row.cashVariance !== 0 ? (
                                (row.cashVariance >= 0 ? '+' : '') + formatCurrency(row.cashVariance)
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Z-Readings Tab */}
        <TabsContent value="z-readings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Z-Reading Reports
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => handleExport('z-readings')}>
                <Download className="w-4 h-4 mr-2" />
                Export BIR Report
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Z#</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Branch / Device</TableHead>
                      <TableHead>OR Range</TableHead>
                      <TableHead className="text-right">Trans</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Discounts</TableHead>
                      <TableHead className="text-right">Refunds</TableHead>
                      <TableHead className="text-right">Voids</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Old GT</TableHead>
                      <TableHead className="text-right">New GT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">Loading...</TableCell>
                      </TableRow>
                    ) : zReadings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">No Z-readings</TableCell>
                      </TableRow>
                    ) : (
                      zReadings.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono font-medium">
                            {String(row.zCounterNo).padStart(6, '0')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(row.readingDate)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{row.branchName}</div>
                            <div className="text-xs text-gray-500">{row.deviceName}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600">
                            {row.beginningInvoice}<br/>
                            {row.endingInvoice}
                          </TableCell>
                          <TableCell className="text-right">{row.transactionCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.grossSales)}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {row.totalDiscounts > 0 ? `-${formatCurrency(row.totalDiscounts)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {row.totalRefunds > 0 ? `-${formatCurrency(row.totalRefunds)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {row.totalVoids > 0 ? `-${formatCurrency(row.totalVoids)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(row.netSales)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(row.vatAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-gray-500">
                            {formatCurrency(row.openingGrandTotal)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium">
                            {formatCurrency(row.closingGrandTotal)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
