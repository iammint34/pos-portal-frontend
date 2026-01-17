import { useState, useEffect } from 'react';
import { salesApi, GetOrdersParams } from '../../api/sales';
import { useStore } from '../../contexts/StoreContext';
import { Order, OrderStatus, OrderType, SalesSummary } from '../../types';
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
  Modal,
  Input,
  Select,
} from '../../components/ui';
import {
  Receipt,
  Eye,
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export function OrdersPage() {
  const { currentStore } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<GetOrdersParams>({
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Set default date range to today
  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      startDate: startOfDay,
      endDate: endOfDay,
    }));
  }, []);

  const fetchOrders = async () => {
    if (!currentStore?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await salesApi.getOrders({
        storeId: currentStore.id,
        page,
        limit: 20,
        ...filters,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined,
      });
      setOrders(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!currentStore?.id || !filters.startDate || !filters.endDate) return;

    try {
      const data = await salesApi.getSalesSummary({
        storeId: currentStore.id,
        startDate: `${filters.startDate}T00:00:00.000Z`,
        endDate: `${filters.endDate}T23:59:59.999Z`,
      });
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchOrders();
      fetchSummary();
    }
  }, [currentStore?.id, page, filters]);

  const handleViewOrder = async (order: Order) => {
    try {
      const fullOrder = await salesApi.getOrderById(order.id);
      setSelectedOrder(fullOrder);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'default'> = {
      COMPLETED: 'success',
      PENDING: 'warning',
      VOIDED: 'danger',
      REFUNDED: 'danger',
      PARTIALLY_REFUNDED: 'warning',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getOrderTypeBadge = (type: OrderType) => {
    const labels: Record<OrderType, string> = {
      DINE_IN: 'Dine In',
      TAKEOUT: 'Takeout',
      DELIVERY: 'Delivery',
      DRIVE_THRU: 'Drive Thru',
    };
    return <Badge variant="default">{labels[type]}</Badge>;
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'VOIDED', label: 'Voided' },
    { value: 'REFUNDED', label: 'Refunded' },
    { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
  ];

  if (!currentStore) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Please select a store to view orders.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button onClick={() => { fetchOrders(); fetchSummary(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{summary.orders.count}</p>
                </div>
                <Receipt className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gross Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.orders.grandTotal)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Refunds</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.refunds.total)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Sales</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.netSales)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
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
                label="Status"
                options={statusOptions}
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as OrderStatus || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{getOrderTypeBadge(order.orderType)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.orderItems?.length || 0}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.grandTotal)}</TableCell>
                    <TableCell className="text-gray-500">
                      {order.posDevice?.name || order.posDevice?.deviceIdentifier || '-'}
                    </TableCell>
                    <TableCell>{formatDate(order.posCreatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Order #${selectedOrder?.orderNumber || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{getStatusBadge(selectedOrder.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <p className="font-medium">{getOrderTypeBadge(selectedOrder.orderType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedOrder.posCreatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Device</p>
                <p className="font-medium">
                  {selectedOrder.posDevice?.name || selectedOrder.posDevice?.deviceIdentifier}
                </p>
              </div>
              {selectedOrder.customerName && (
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
              )}
              {selectedOrder.customerPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-2">Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item) => (
                      <tr key={item.id} className={`border-t ${item.isVoided ? 'line-through text-gray-400' : ''}`}>
                        <td className="px-4 py-2">
                          {item.itemName}
                          {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                          {item.isVoided && <p className="text-xs text-red-500">VOIDED: {item.voidReason}</p>}
                        </td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountTotal > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span>Discounts</span>
                  <span>-{formatCurrency(selectedOrder.discountTotal)}</span>
                </div>
              )}
              {selectedOrder.taxTotal > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(selectedOrder.taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t mt-2">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.grandTotal)}</span>
              </div>
            </div>

            {/* Payments */}
            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Payments</h4>
                <div className="space-y-2">
                  {selectedOrder.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{payment.paymentMethod.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refunds */}
            {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Refunds</h4>
                <div className="space-y-2">
                  {selectedOrder.refunds.map((refund) => (
                    <div key={refund.id} className="flex justify-between p-2 bg-red-50 rounded text-red-700">
                      <div>
                        <span>{refund.refundMethod.replace('_', ' ')}</span>
                        {refund.reason && <p className="text-xs">{refund.reason}</p>}
                      </div>
                      <span className="font-medium">-{formatCurrency(refund.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-gray-600 bg-gray-50 p-2 rounded">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
