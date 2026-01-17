import { useState, useEffect } from 'react';
import { auditApi, AuditLogFilters } from '../../api/audit';
import { useStore } from '../../contexts/StoreContext';
import { AuditLog, AuditAction } from '../../types';
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
  Select,
  Input,
} from '../../components/ui';
import { FileText, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'SYNC', label: 'Sync' },
];

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'User', label: 'User' },
  { value: 'Store', label: 'Store' },
  { value: 'Branch', label: 'Branch' },
  { value: 'Item', label: 'Item' },
  { value: 'Category', label: 'Category' },
  { value: 'Role', label: 'Role' },
  { value: 'PosDevice', label: 'POS Device' },
];

export function AuditPage() {
  const { currentStore } = useStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: undefined,
    entityType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await auditApi.getLogs({
        ...filters,
        storeId: currentStore?.id,
        page,
        limit: pagination.limit,
      });
      setLogs(response.data);
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [currentStore, filters]);

  const getActionBadge = (action: AuditAction) => {
    const variants: Record<AuditAction, 'success' | 'warning' | 'danger' | 'default'> = {
      CREATE: 'success',
      UPDATE: 'warning',
      DELETE: 'danger',
      LOGIN: 'default',
      LOGOUT: 'default',
      SYNC: 'default',
    };
    return <Badge variant={variants[action]}>{action}</Badge>;
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      action: undefined,
      entityType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="secondary" onClick={() => fetchLogs(pagination.page)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Action"
                options={ACTION_OPTIONS}
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value as AuditAction)}
              />
              <Select
                label="Entity Type"
                options={ENTITY_TYPE_OPTIONS}
                value={filters.entityType || ''}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              />
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Activity Logs
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <div className="font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-xs text-gray-500 font-mono truncate max-w-32">
                          {log.entityId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.newValue && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                            View changes
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
