import { useState, useEffect } from 'react';
import { shiftsApi, GetShiftsParams, ShiftsSummary } from '../../api/shifts';
import { branchesApi } from '../../api/branches';
import { useStore } from '../../contexts/StoreContext';
import { Shift, ShiftStatus, Branch, CashMovement, CashMovementType } from '../../types';
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
  Clock,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  User,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function ShiftsPage() {
  const { currentStore } = useStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<ShiftsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<GetShiftsParams>({
    status: undefined,
    branchId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Fetch branches for the current store
  const fetchBranches = async () => {
    if (!currentStore?.id) return;
    try {
      const response = await branchesApi.getAll({ storeId: currentStore.id, limit: 100 });
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  // Set default date range to today and fetch branches
  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      startDate: startOfDay,
      endDate: endOfDay,
    }));
    fetchBranches();
  }, [currentStore?.id]);

  const fetchShifts = async () => {
    if (!currentStore?.id) {
      setShifts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await shiftsApi.getShifts({
        storeId: currentStore.id,
        page,
        limit: 20,
        ...filters,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined,
      });
      setShifts(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!currentStore?.id || !filters.startDate || !filters.endDate) return;

    try {
      const data = await shiftsApi.getShiftsSummary({
        storeId: currentStore.id,
        branchId: filters.branchId,
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
      fetchShifts();
      fetchSummary();
    }
  }, [currentStore?.id, page, filters]);

  const handleViewShift = async (shift: Shift) => {
    try {
      const [fullShift, movements] = await Promise.all([
        shiftsApi.getShiftById(shift.id),
        shiftsApi.getShiftCashMovements(shift.id),
      ]);
      setSelectedShift(fullShift);
      setCashMovements(movements);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch shift details:', error);
    }
  };

  const getStatusBadge = (status: ShiftStatus) => {
    const variants: Record<ShiftStatus, 'success' | 'warning'> = {
      CLOSED: 'success',
      OPEN: 'warning',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getVarianceBadge = (variance: number | null | undefined) => {
    if (variance === null || variance === undefined) return null;
    const absVariance = Math.abs(variance);
    if (absVariance < 0.01) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Balanced
        </Badge>
      );
    }
    if (variance > 0) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-700">
          <TrendingUp className="w-3 h-3" />
          +{formatCurrency(variance)}
        </Badge>
      );
    }
    return (
      <Badge variant="danger" className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        {formatCurrency(variance)}
      </Badge>
    );
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMovementTypeLabel = (type: CashMovementType): string => {
    const labels: Record<CashMovementType, string> = {
      OPENING_FLOAT: 'Opening Float',
      CASH_SALE: 'Cash Sale',
      CHANGE_GIVEN: 'Change Given',
      TIP_CASH: 'Cash Tip',
      PAID_OUT: 'Paid Out',
      DROP: 'Cash Drop',
      CASH_IN: 'Cash In',
      REFUND: 'Refund',
      CLOSING_COUNT: 'Closing Count',
    };
    return labels[type] || type;
  };

  const getMovementColor = (type: CashMovementType): string => {
    const colors: Record<CashMovementType, string> = {
      OPENING_FLOAT: 'text-blue-600',
      CASH_SALE: 'text-green-600',
      CHANGE_GIVEN: 'text-red-600',
      TIP_CASH: 'text-green-600',
      PAID_OUT: 'text-red-600',
      DROP: 'text-orange-600',
      CASH_IN: 'text-green-600',
      REFUND: 'text-red-600',
      CLOSING_COUNT: 'text-blue-600',
    };
    return colors[type] || 'text-gray-600';
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(branch => ({ value: branch.id, label: branch.name })),
  ];

  if (!currentStore) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Please select a store to view shifts.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
        <Button onClick={() => { fetchShifts(); fetchSummary(); }}>
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
                  <p className="text-sm text-gray-500">Total Shifts</p>
                  <p className="text-2xl font-bold">{summary.totalShifts}</p>
                </div>
                <Clock className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Currently Open</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.openShifts}</p>
                </div>
                <User className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Shifts with Variance</p>
                  <p className="text-2xl font-bold text-red-600">{summary.shiftsWithVariance}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Variance</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {summary.totalVariance >= 0 ? '+' : ''}{formatCurrency(summary.totalVariance)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
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
            <div className="flex-1 min-w-[150px]">
              <Select
                label="Status"
                options={statusOptions}
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as ShiftStatus || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Shifts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">
                      {shift.operator
                        ? `${shift.operator.firstName} ${shift.operator.lastName}`
                        : shift.posOperatorId || 'Unknown'}
                    </TableCell>
                    <TableCell>{getStatusBadge(shift.status)}</TableCell>
                    <TableCell className="text-gray-500">
                      {shift.posDevice?.name || shift.posDevice?.deviceIdentifier || '-'}
                    </TableCell>
                    <TableCell>{formatDateTime(shift.openedAt)}</TableCell>
                    <TableCell>{formatDuration(shift.openedAt, shift.closedAt)}</TableCell>
                    <TableCell>{formatCurrency(shift.openingCash)}</TableCell>
                    <TableCell>
                      {shift.expectedCash !== null && shift.expectedCash !== undefined
                        ? formatCurrency(shift.expectedCash)
                        : '-'}
                    </TableCell>
                    <TableCell>{getVarianceBadge(shift.variance)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewShift(shift)}>
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

      {/* Shift Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedShift(null);
          setCashMovements([]);
        }}
        title="Shift Details"
        size="lg"
      >
        {selectedShift && (
          <div className="space-y-6">
            {/* Shift Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Operator</p>
                <p className="font-medium">
                  {selectedShift.operator
                    ? `${selectedShift.operator.firstName} ${selectedShift.operator.lastName}`
                    : selectedShift.posOperatorId || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{getStatusBadge(selectedShift.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Device</p>
                <p className="font-medium">
                  {selectedShift.posDevice?.name || selectedShift.posDevice?.deviceIdentifier}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="font-medium">
                  {selectedShift.posDevice?.branch?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">{formatDateTime(selectedShift.openedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ended</p>
                <p className="font-medium">
                  {selectedShift.closedAt ? formatDateTime(selectedShift.closedAt) : 'Still open'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{formatDuration(selectedShift.openedAt, selectedShift.closedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Orders</p>
                <p className="font-medium">{selectedShift._count?.orders || 0}</p>
              </div>
            </div>

            {/* Cash Summary */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Cash Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Opening Cash</span>
                  <span className="font-medium">{formatCurrency(selectedShift.openingCash)}</span>
                </div>
                {selectedShift.summary && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash Sales</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(selectedShift.summary.totalCashSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Change Given</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(selectedShift.summary.totalChangeGiven)}
                      </span>
                    </div>
                    {selectedShift.summary.totalCashRefunds > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Refunds</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedShift.summary.totalCashRefunds)}
                        </span>
                      </div>
                    )}
                    {selectedShift.summary.totalPaidOuts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Paid Outs</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedShift.summary.totalPaidOuts)}
                        </span>
                      </div>
                    )}
                    {selectedShift.summary.totalDrops > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cash Drops</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedShift.summary.totalDrops)}
                        </span>
                      </div>
                    )}
                    {selectedShift.summary.totalCashIn > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cash In</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(selectedShift.summary.totalCashIn)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-700 font-medium">Expected in Drawer</span>
                  <span className="font-bold text-primary-600">
                    {selectedShift.expectedCash !== null && selectedShift.expectedCash !== undefined
                      ? formatCurrency(selectedShift.expectedCash)
                      : '-'}
                  </span>
                </div>
                {selectedShift.closingCash !== null && selectedShift.closingCash !== undefined && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Counted Cash</span>
                      <span className="font-medium">{formatCurrency(selectedShift.closingCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Variance</span>
                      {getVarianceBadge(selectedShift.variance)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cash Movements */}
            {cashMovements.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Cash Movements</h4>
                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Reason</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashMovements.map((movement) => (
                        <tr key={movement.id} className="border-t">
                          <td className="px-4 py-2">
                            <span className={getMovementColor(movement.movementType)}>
                              {getMovementTypeLabel(movement.movementType)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {movement.reason || '-'}
                          </td>
                          <td className={cn(
                            "px-4 py-2 text-right font-medium",
                            getMovementColor(movement.movementType)
                          )}>
                            {['CASH_SALE', 'TIP_CASH', 'CASH_IN', 'OPENING_FLOAT'].includes(movement.movementType)
                              ? '+' : '-'}
                            {formatCurrency(Math.abs(movement.amount))}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {formatDateTime(movement.performedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedShift.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedShift.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
