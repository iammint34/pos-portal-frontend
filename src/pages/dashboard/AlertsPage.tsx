import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Save,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { alertsApi, AlertQueryParams, UpdateAlertConfigDto } from '../../api/alerts';
import {
  Alert,
  AlertConfig,
  AlertType,
  AlertSeverity,
  AlertCountResponse,
  PaginatedResponse,
} from '../../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui';

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  ZERO_SALES_BRANCH: 'Zero Sales Branch',
  EXCESSIVE_VOID_REFUND: 'Excessive Void/Refund',
  INVENTORY_ANOMALY: 'Inventory Anomaly',
  POS_SYNC_FAILURE: 'POS Sync Failure',
};

const SEVERITY_VARIANT: Record<AlertSeverity, 'danger' | 'warning' | 'info'> = {
  CRITICAL: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

const SEVERITY_ICON: Record<AlertSeverity, typeof AlertCircle> = {
  CRITICAL: AlertCircle,
  WARNING: AlertTriangle,
  INFO: Info,
};

// Threshold field labels for config UI
const THRESHOLD_LABELS: Record<AlertType, Record<string, string>> = {
  ZERO_SALES_BRANCH: {
    noSalesHours: 'No Sales Hours',
    businessStartHour: 'Business Start Hour',
    businessEndHour: 'Business End Hour',
  },
  EXCESSIVE_VOID_REFUND: {
    windowHours: 'Window (hours)',
    warningThreshold: 'Warning Threshold (%)',
    criticalThreshold: 'Critical Threshold (%)',
  },
  INVENTORY_ANOMALY: {
    largeAdjustmentThreshold: 'Large Adjustment Threshold (units)',
  },
  POS_SYNC_FAILURE: {
    syncMissingMinutes: 'Sync Missing (minutes)',
    heartbeatMissingMinutes: 'Heartbeat Missing (minutes)',
    consecutiveFailures: 'Consecutive Failures',
  },
};

export function AlertsPage() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('active');

  // Active alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsMeta, setAlertsMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertCount, setAlertCount] = useState<AlertCountResponse | null>(null);
  const [page, setPage] = useState(1);

  // History state
  const [historyAlerts, setHistoryAlerts] = useState<Alert[]>([]);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Config state
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState<Record<string, AlertConfig>>({});
  const [savingType, setSavingType] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const params: AlertQueryParams = {
        storeId: currentStore.id,
        status: 'active',
        page,
        limit: 20,
      };
      if (filterType) params.type = filterType as AlertType;
      if (filterSeverity) params.severity = filterSeverity as AlertSeverity;

      const response = await alertsApi.getAll(params);
      setAlerts(response.data);
      setAlertsMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlertCount = async () => {
    if (!currentStore) return;
    try {
      const data = await alertsApi.getCount(currentStore.id);
      setAlertCount(data);
    } catch {
      // silent
    }
  };

  const fetchHistory = async () => {
    if (!currentStore) return;
    setIsHistoryLoading(true);
    try {
      const response = await alertsApi.getAll({
        storeId: currentStore.id,
        status: 'all',
        page: historyPage,
        limit: 20,
      });
      setHistoryAlerts(response.data);
      setHistoryMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchConfigs = async () => {
    if (!currentStore) return;
    setIsConfigLoading(true);
    try {
      const data = await alertsApi.getConfigs(currentStore.id);
      setConfigs(data);
      const editMap: Record<string, AlertConfig> = {};
      for (const c of data) {
        editMap[c.alertType] = { ...c };
      }
      setEditingConfigs(editMap);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchAlertCount();
  }, [currentStore?.id, page, filterType, filterSeverity]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [currentStore?.id, activeTab, historyPage]);

  useEffect(() => {
    if (activeTab === 'config') fetchConfigs();
  }, [currentStore?.id, activeTab]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledge(id);
      fetchAlerts();
      fetchAlertCount();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await alertsApi.dismiss(id);
      fetchAlerts();
      fetchAlertCount();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedIds.size === 0) return;
    try {
      await alertsApi.bulkDismiss(Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchAlerts();
      fetchAlertCount();
    } catch (error) {
      console.error('Failed to bulk dismiss:', error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === alerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map((a) => a.id)));
    }
  };

  const handleConfigSave = async (alertType: AlertType) => {
    if (!currentStore) return;
    const config = editingConfigs[alertType];
    if (!config) return;

    setSavingType(alertType);
    try {
      const dto: UpdateAlertConfigDto = {
        enabled: config.enabled,
        thresholds: config.thresholds,
        cooldownMinutes: config.cooldownMinutes,
      };
      await alertsApi.updateConfig(alertType, dto, currentStore.id);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSavingType(null);
    }
  };

  const updateEditingConfig = (
    alertType: AlertType,
    field: string,
    value: unknown,
  ) => {
    setEditingConfigs((prev) => ({
      ...prev,
      [alertType]: { ...prev[alertType], [field]: value },
    }));
  };

  const updateThreshold = (
    alertType: AlertType,
    key: string,
    value: string,
  ) => {
    setEditingConfigs((prev) => ({
      ...prev,
      [alertType]: {
        ...prev[alertType],
        thresholds: {
          ...prev[alertType]?.thresholds,
          [key]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (!currentStore) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Please select a store to view alerts.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        </div>
        {alertCount && (
          <div className="flex items-center gap-2">
            {alertCount.bySeverity.CRITICAL > 0 && (
              <Badge variant="danger">{alertCount.bySeverity.CRITICAL} Critical</Badge>
            )}
            {alertCount.bySeverity.WARNING > 0 && (
              <Badge variant="warning">{alertCount.bySeverity.WARNING} Warning</Badge>
            )}
            {alertCount.bySeverity.INFO > 0 && (
              <Badge variant="info">{alertCount.bySeverity.INFO} Info</Badge>
            )}
            {alertCount.count === 0 && (
              <Badge variant="success">No active alerts</Badge>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Alerts</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    options={[
                      { value: '', label: 'All Types' },
                      ...Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => ({
                        value: key,
                        label,
                      })),
                    ]}
                  />
                  <Select
                    value={filterSeverity}
                    onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
                    options={[
                      { value: '', label: 'All Severities' },
                      { value: 'CRITICAL', label: 'Critical' },
                      { value: 'WARNING', label: 'Warning' },
                      { value: 'INFO', label: 'Info' },
                    ]}
                  />
                  {selectedIds.size > 0 && (
                    <Button variant="secondary" size="sm" onClick={handleBulkDismiss}>
                      <X className="w-4 h-4 mr-1" />
                      Dismiss ({selectedIds.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={alerts.length > 0 && selectedIds.size === alerts.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No active alerts
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => {
                      const SevIcon = SEVERITY_ICON[alert.severity];
                      return (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(alert.id)}
                              onChange={() => toggleSelection(alert.id)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={SEVERITY_VARIANT[alert.severity]}>
                              <SevIcon className="w-3 h-3 mr-1" />
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{alert.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{alert.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {ALERT_TYPE_LABELS[alert.type]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDate(alert.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {!alert.acknowledgedAt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAcknowledge(alert.id)}
                                  title="Acknowledge"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(alert.id)}
                                title="Dismiss"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {alertsMeta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(alertsMeta.page - 1) * alertsMeta.limit + 1}-
                    {Math.min(alertsMeta.page * alertsMeta.limit, alertsMeta.total)} of{' '}
                    {alertsMeta.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {alertsMeta.page} of {alertsMeta.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(alertsMeta.totalPages, p + 1))}
                      disabled={page >= alertsMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : historyAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No alert history
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyAlerts.map((alert) => {
                      const SevIcon = SEVERITY_ICON[alert.severity];
                      let statusLabel = 'Active';
                      let statusVariant: 'danger' | 'warning' | 'success' | 'default' = 'danger';
                      if (alert.dismissedAt) {
                        statusLabel = `Dismissed ${formatDate(alert.dismissedAt)}`;
                        statusVariant = 'default';
                      } else if (alert.acknowledgedAt) {
                        statusLabel = `Acknowledged ${formatDate(alert.acknowledgedAt)}`;
                        statusVariant = 'warning';
                      }

                      return (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge variant={SEVERITY_VARIANT[alert.severity]}>
                              <SevIcon className="w-3 h-3 mr-1" />
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{alert.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{alert.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {ALERT_TYPE_LABELS[alert.type]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDate(alert.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {historyMeta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(historyMeta.page - 1) * historyMeta.limit + 1}-
                    {Math.min(historyMeta.page * historyMeta.limit, historyMeta.total)} of{' '}
                    {historyMeta.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {historyMeta.page} of {historyMeta.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.min(historyMeta.totalPages, p + 1))}
                      disabled={historyPage >= historyMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          {isConfigLoading ? (
            <p className="text-gray-500">Loading configurations...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {configs.map((config) => {
                const editing = editingConfigs[config.alertType];
                if (!editing) return null;

                return (
                  <Card key={config.alertType}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {ALERT_TYPE_LABELS[config.alertType]}
                        </CardTitle>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm text-gray-600">
                            {editing.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <input
                            type="checkbox"
                            checked={editing.enabled}
                            onChange={(e) =>
                              updateEditingConfig(config.alertType, 'enabled', e.target.checked)
                            }
                            className="rounded"
                          />
                        </label>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          THRESHOLD_LABELS[config.alertType] || {},
                        ).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {label}
                            </label>
                            <Input
                              type="number"
                              value={
                                editing.thresholds?.[key] !== undefined
                                  ? String(editing.thresholds[key])
                                  : ''
                              }
                              onChange={(e) =>
                                updateThreshold(config.alertType, key, e.target.value)
                              }
                              step={key.includes('Threshold') && key.includes('arning') || key.includes('ritical') ? '0.01' : '1'}
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cooldown (minutes)
                          </label>
                          <Input
                            type="number"
                            value={editing.cooldownMinutes}
                            onChange={(e) =>
                              updateEditingConfig(
                                config.alertType,
                                'cooldownMinutes',
                                parseInt(e.target.value) || 1,
                              )
                            }
                            min={1}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleConfigSave(config.alertType)}
                          disabled={savingType === config.alertType}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingType === config.alertType ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
