import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ArrowUpCircle,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { lossPreventionApi } from '../../api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { formatDateTime } from '../../lib/utils';
import type {
  ThresholdWithStats,
  LossPreventionIncident,
  LPDashboardSummary,
  LossPreventionMetricType,
  LossPreventionTimeWindow,
  LossPreventionScope,
  IncidentStatus,
  LPAlertSeverity,
} from '../../types';
import type { CreateThresholdDto, UpdateThresholdDto } from '../../api/loss-prevention';

const METRIC_TYPE_OPTIONS = [
  { value: 'VOID_COUNT', label: 'Void Count' },
  { value: 'VOID_AMOUNT', label: 'Void Amount' },
  { value: 'REFUND_COUNT', label: 'Refund Count' },
  { value: 'REFUND_AMOUNT', label: 'Refund Amount' },
  { value: 'DISCOUNT_PERCENTAGE', label: 'Discount Percentage' },
  { value: 'CONSECUTIVE_VOIDS', label: 'Consecutive Voids' },
];

const TIME_WINDOW_OPTIONS = [
  { value: 'SHIFT', label: 'Per Shift' },
  { value: 'DAY', label: 'Per Day' },
  { value: 'WEEK', label: 'Per Week' },
];

const SCOPE_OPTIONS = [
  { value: 'BRANCH', label: 'Branch' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'POS_DEVICE', label: 'POS Device' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ESCALATED', label: 'Escalated' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'CRITICAL', label: 'Critical' },
];

function getMetricLabel(metricType: LossPreventionMetricType): string {
  return METRIC_TYPE_OPTIONS.find((o) => o.value === metricType)?.label || metricType;
}

function getTimeWindowLabel(timeWindow: LossPreventionTimeWindow): string {
  return TIME_WINDOW_OPTIONS.find((o) => o.value === timeWindow)?.label || timeWindow;
}

function getScopeLabel(scope: LossPreventionScope): string {
  return SCOPE_OPTIONS.find((o) => o.value === scope)?.label || scope;
}

function getSeverityBadgeVariant(
  severity: LPAlertSeverity
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (severity) {
    case 'INFO':
      return 'info';
    case 'WARNING':
      return 'warning';
    case 'CRITICAL':
      return 'danger';
    default:
      return 'default';
  }
}

function getStatusBadgeVariant(
  status: IncidentStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'OPEN':
      return 'danger';
    case 'ACKNOWLEDGED':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    case 'ESCALATED':
      return 'danger';
    default:
      return 'default';
  }
}

export function LossPreventionPage() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard state
  const [dashboard, setDashboard] = useState<LPDashboardSummary | null>(null);

  // Thresholds state
  const [thresholds, setThresholds] = useState<ThresholdWithStats[]>([]);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdWithStats | null>(null);
  const [thresholdForm, setThresholdForm] = useState<CreateThresholdDto>({
    metricType: 'VOID_COUNT',
    threshold: 0,
    timeWindow: 'DAY',
    scope: 'BRANCH',
    enabled: true,
  });

  // Incidents state
  const [incidents, setIncidents] = useState<LossPreventionIncident[]>([]);
  const [incidentFilters, setIncidentFilters] = useState<{
    status: string;
    severity: string;
    metricType: string;
  }>({
    status: '',
    severity: '',
    metricType: '',
  });
  const [selectedIncident, setSelectedIncident] = useState<LossPreventionIncident | null>(null);
  const [isIncidentDetailOpen, setIsIncidentDetailOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (!currentStore) return;
    try {
      const data = await lossPreventionApi.getDashboard(currentStore.id);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  // Fetch thresholds
  const fetchThresholds = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const data = await lossPreventionApi.getThresholds(currentStore.id);
      setThresholds(data);
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch incidents
  const fetchIncidents = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const response = await lossPreventionApi.getIncidents({
        storeId: currentStore.id,
        status: incidentFilters.status as IncidentStatus | undefined,
        severity: incidentFilters.severity as LPAlertSeverity | undefined,
        metricType: incidentFilters.metricType as LossPreventionMetricType | undefined,
        limit: 50,
      });
      setIncidents(response.data || response as unknown as LossPreventionIncident[]);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStore) {
      fetchDashboard();
      fetchThresholds();
      fetchIncidents();
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore && activeTab === 'incidents') {
      fetchIncidents();
    }
  }, [incidentFilters, activeTab]);

  // Threshold handlers
  const handleCreateThreshold = () => {
    setEditingThreshold(null);
    setThresholdForm({
      metricType: 'VOID_COUNT',
      threshold: 0,
      timeWindow: 'DAY',
      scope: 'BRANCH',
      enabled: true,
    });
    setIsThresholdModalOpen(true);
  };

  const handleEditThreshold = (threshold: ThresholdWithStats) => {
    setEditingThreshold(threshold);
    setThresholdForm({
      metricType: threshold.metricType,
      threshold: threshold.threshold,
      timeWindow: threshold.timeWindow,
      scope: threshold.scope,
      enabled: threshold.enabled,
    });
    setIsThresholdModalOpen(true);
  };

  const handleSaveThreshold = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      if (editingThreshold) {
        await lossPreventionApi.updateThreshold(currentStore.id, editingThreshold.id, {
          threshold: thresholdForm.threshold,
          timeWindow: thresholdForm.timeWindow,
          enabled: thresholdForm.enabled,
        } as UpdateThresholdDto);
      } else {
        await lossPreventionApi.createThreshold(currentStore.id, thresholdForm);
      }
      setIsThresholdModalOpen(false);
      fetchThresholds();
    } catch (error) {
      console.error('Failed to save threshold:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThreshold = async (thresholdId: string) => {
    if (!currentStore || !confirm('Are you sure you want to delete this threshold?')) return;
    try {
      await lossPreventionApi.deleteThreshold(currentStore.id, thresholdId);
      fetchThresholds();
    } catch (error) {
      console.error('Failed to delete threshold:', error);
    }
  };

  const handleToggleThreshold = async (threshold: ThresholdWithStats) => {
    if (!currentStore) return;
    try {
      await lossPreventionApi.updateThreshold(currentStore.id, threshold.id, {
        enabled: !threshold.enabled,
      });
      fetchThresholds();
    } catch (error) {
      console.error('Failed to toggle threshold:', error);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!currentStore) return;
    try {
      await lossPreventionApi.initializeThresholds(currentStore.id);
      fetchThresholds();
    } catch (error) {
      console.error('Failed to initialize defaults:', error);
    }
  };

  // Incident handlers
  const handleViewIncident = (incident: LossPreventionIncident) => {
    setSelectedIncident(incident);
    setIsIncidentDetailOpen(true);
  };

  const handleAcknowledgeIncident = async (incidentId: string) => {
    if (!currentStore) return;
    try {
      await lossPreventionApi.acknowledgeIncident(currentStore.id, incidentId);
      fetchIncidents();
      fetchDashboard();
      if (selectedIncident?.id === incidentId) {
        const updated = await lossPreventionApi.getIncident(currentStore.id, incidentId);
        setSelectedIncident(updated);
      }
    } catch (error) {
      console.error('Failed to acknowledge incident:', error);
    }
  };

  const handleOpenResolve = (incident: LossPreventionIncident) => {
    setSelectedIncident(incident);
    setResolution('');
    setIsResolveModalOpen(true);
  };

  const handleResolveIncident = async () => {
    if (!currentStore || !selectedIncident) return;
    try {
      await lossPreventionApi.resolveIncident(currentStore.id, selectedIncident.id, {
        resolution,
      });
      setIsResolveModalOpen(false);
      setIsIncidentDetailOpen(false);
      fetchIncidents();
      fetchDashboard();
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  const handleEscalateIncident = async (incidentId: string) => {
    if (!currentStore) return;
    try {
      await lossPreventionApi.escalateIncident(currentStore.id, incidentId);
      fetchIncidents();
      fetchDashboard();
      if (selectedIncident?.id === incidentId) {
        const updated = await lossPreventionApi.getIncident(currentStore.id, incidentId);
        setSelectedIncident(updated);
      }
    } catch (error) {
      console.error('Failed to escalate incident:', error);
    }
  };

  const handleTriggerEvaluation = async () => {
    if (!currentStore) return;
    try {
      const result = await lossPreventionApi.triggerEvaluation(currentStore.id);
      alert(`Evaluation complete: ${result.incidentsCreated} incidents created`);
      fetchIncidents();
      fetchDashboard();
    } catch (error) {
      console.error('Failed to trigger evaluation:', error);
    }
  };

  if (!currentStore) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Please select a store to view loss prevention data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loss Prevention</h1>
          <p className="text-gray-500">Monitor and manage suspicious activity thresholds</p>
        </div>
        <Button onClick={handleTriggerEvaluation}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Evaluation
        </Button>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Thresholds</p>
                  <p className="text-2xl font-bold">
                    {dashboard.enabledThresholds}/{dashboard.totalThresholds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Open Incidents</p>
                  <p className="text-2xl font-bold text-red-600">{dashboard.openIncidents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Acknowledged</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboard.acknowledgedIncidents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.resolvedIncidents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Breakdown */}
            {dashboard && (
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Critical</span>
                      <Badge variant="danger">{dashboard.incidentsBySeverity.CRITICAL}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Warning</span>
                      <Badge variant="warning">{dashboard.incidentsBySeverity.WARNING}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Info</span>
                      <Badge variant="info">{dashboard.incidentsBySeverity.INFO}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {dashboard?.recentIncidents?.slice(0, 5).map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            <span className="text-sm">{getMetricLabel(incident.metricType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getStatusBadgeVariant(incident.status)}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                          No recent incidents
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thresholds</CardTitle>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleInitializeDefaults}>
                    Initialize Defaults
                  </Button>
                  <Button onClick={handleCreateThreshold}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Threshold
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric Type</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Time Window</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Incidents</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : thresholds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No thresholds configured. Click "Initialize Defaults" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    thresholds.map((threshold) => (
                      <TableRow key={threshold.id}>
                        <TableCell className="font-medium">
                          {getMetricLabel(threshold.metricType)}
                        </TableCell>
                        <TableCell>
                          {threshold.metricType === 'DISCOUNT_PERCENTAGE'
                            ? `${threshold.threshold}%`
                            : threshold.metricType.includes('AMOUNT')
                              ? `$${threshold.threshold}`
                              : threshold.threshold}
                        </TableCell>
                        <TableCell>{getTimeWindowLabel(threshold.timeWindow)}</TableCell>
                        <TableCell>{getScopeLabel(threshold.scope)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleThreshold(threshold)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              threshold.enabled ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                threshold.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={threshold.incidentCount > 0 ? 'warning' : 'default'}>
                            {threshold.incidentCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditThreshold(threshold)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteThreshold(threshold.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Incidents</CardTitle>
                <div className="flex gap-4">
                  <Select
                    label=""
                    value={incidentFilters.status}
                    onChange={(e) =>
                      setIncidentFilters((prev) => ({ ...prev, status: e.target.value }))
                    }
                    options={STATUS_OPTIONS}
                  />
                  <Select
                    label=""
                    value={incidentFilters.severity}
                    onChange={(e) =>
                      setIncidentFilters((prev) => ({ ...prev, severity: e.target.value }))
                    }
                    options={SEVERITY_OPTIONS}
                  />
                  <Select
                    label=""
                    value={incidentFilters.metricType}
                    onChange={(e) =>
                      setIncidentFilters((prev) => ({ ...prev, metricType: e.target.value }))
                    }
                    options={[{ value: '', label: 'All Metrics' }, ...METRIC_TYPE_OPTIONS]}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Metric Type</TableHead>
                    <TableHead>Value / Threshold</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : incidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No incidents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getMetricLabel(incident.metricType)}
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{incident.actualValue}</span>
                          <span className="text-gray-400"> / </span>
                          <span>{incident.thresholdValue}</span>
                        </TableCell>
                        <TableCell>{incident.branch?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(incident.status)}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(incident.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewIncident(incident)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {incident.status === 'OPEN' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAcknowledgeIncident(incident.id)}
                                  title="Acknowledge"
                                >
                                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEscalateIncident(incident.id)}
                                  title="Escalate"
                                >
                                  <ArrowUpCircle className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {(incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenResolve(incident)}
                                title="Resolve"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Threshold Modal */}
      <Modal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        title={editingThreshold ? 'Edit Threshold' : 'Create Threshold'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveThreshold();
          }}
          className="space-y-4"
        >
          <Select
            label="Metric Type"
            value={thresholdForm.metricType}
            onChange={(e) =>
              setThresholdForm((prev) => ({
                ...prev,
                metricType: e.target.value as LossPreventionMetricType,
              }))
            }
            options={METRIC_TYPE_OPTIONS}
            disabled={!!editingThreshold}
          />
          <Input
            label="Threshold Value"
            type="number"
            value={thresholdForm.threshold}
            onChange={(e) =>
              setThresholdForm((prev) => ({
                ...prev,
                threshold: Number(e.target.value),
              }))
            }
          />
          <Select
            label="Time Window"
            value={thresholdForm.timeWindow}
            onChange={(e) =>
              setThresholdForm((prev) => ({
                ...prev,
                timeWindow: e.target.value as LossPreventionTimeWindow,
              }))
            }
            options={TIME_WINDOW_OPTIONS}
          />
          <Select
            label="Scope"
            value={thresholdForm.scope}
            onChange={(e) =>
              setThresholdForm((prev) => ({
                ...prev,
                scope: e.target.value as LossPreventionScope,
              }))
            }
            options={SCOPE_OPTIONS}
            disabled={!!editingThreshold}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={thresholdForm.enabled}
              onChange={(e) =>
                setThresholdForm((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              Enabled
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsThresholdModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editingThreshold ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Incident Detail Modal */}
      <Modal
        isOpen={isIncidentDetailOpen}
        onClose={() => setIsIncidentDetailOpen(false)}
        title="Incident Details"
        size="lg"
      >
        {selectedIncident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Metric Type</p>
                <p className="font-medium">{getMetricLabel(selectedIncident.metricType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Severity</p>
                <Badge variant={getSeverityBadgeVariant(selectedIncident.severity)}>
                  {selectedIncident.severity}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual Value</p>
                <p className="font-medium text-red-600">{selectedIncident.actualValue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Threshold Value</p>
                <p className="font-medium">{selectedIncident.thresholdValue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Window</p>
                <p className="font-medium">{getTimeWindowLabel(selectedIncident.timeWindow)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={getStatusBadgeVariant(selectedIncident.status)}>
                  {selectedIncident.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="font-medium">{selectedIncident.branch?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDateTime(selectedIncident.createdAt)}</p>
              </div>
            </div>

            {selectedIncident.transactions?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Related Transactions</p>
                <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                  {selectedIncident.transactions.map((txId, idx) => (
                    <p key={idx} className="text-sm font-mono">
                      {txId}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {selectedIncident.resolution && (
              <div>
                <p className="text-sm text-gray-500">Resolution</p>
                <p className="font-medium">{selectedIncident.resolution}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedIncident.status === 'OPEN' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleAcknowledgeIncident(selectedIncident.id)}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleEscalateIncident(selectedIncident.id)}
                  >
                    Escalate
                  </Button>
                </>
              )}
              {(selectedIncident.status === 'OPEN' ||
                selectedIncident.status === 'ACKNOWLEDGED') && (
                <Button onClick={() => handleOpenResolve(selectedIncident)}>Resolve</Button>
              )}
              <Button variant="secondary" onClick={() => setIsIncidentDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Incident"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResolveIncident();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Describe how this incident was resolved..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Resolve Incident</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
