import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { notificationsApi } from '../../api';
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
  NotificationPreference,
  NotificationLog,
  NotificationSchedule,
  NotificationType,
  NotificationStatus,
} from '../../types';

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  DAILY_DIGEST: 'Daily Digest',
  WEEKLY_SUMMARY: 'Weekly Summary',
  LOSS_PREVENTION_ALERT: 'Loss Prevention Alert',
  DEVICE_OFFLINE: 'Device Offline',
  SYNC_FAILURE: 'Sync Failure',
  SYSTEM_ALERT: 'System Alert',
};

const NOTIFICATION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'DAILY_DIGEST', label: 'Daily Digest' },
  { value: 'WEEKLY_SUMMARY', label: 'Weekly Summary' },
  { value: 'LOSS_PREVENTION_ALERT', label: 'Loss Prevention Alert' },
  { value: 'DEVICE_OFFLINE', label: 'Device Offline' },
  { value: 'SYNC_FAILURE', label: 'Sync Failure' },
  { value: 'SYSTEM_ALERT', label: 'System Alert' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SENT', label: 'Sent' },
  { value: 'FAILED', label: 'Failed' },
];

function getStatusBadgeVariant(
  status: NotificationStatus
): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'SENT':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'default';
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'EMAIL':
      return <Mail className="w-4 h-4" />;
    case 'SMS':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

export function NotificationsPage() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('preferences');
  const [isLoading, setIsLoading] = useState(false);

  // Preferences state
  const [myPreferences, setMyPreferences] = useState<NotificationPreference | null>(null);
  const [allPreferences, setAllPreferences] = useState<NotificationPreference[]>([]);

  // Schedules state
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<NotificationSchedule | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    schedule: '',
    timezone: 'Asia/Manila',
    enabled: true,
  });

  // Logs state
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logFilters, setLogFilters] = useState({
    type: '',
    status: '',
  });

  // Test notification state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    type: 'DAILY_DIGEST' as NotificationType,
    subject: '',
    message: '',
  });

  // Fetch my preferences
  const fetchMyPreferences = async () => {
    if (!currentStore) return;
    try {
      const data = await notificationsApi.getMyPreferences(currentStore.id);
      setMyPreferences(data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  // Fetch all preferences (admin)
  const fetchAllPreferences = async () => {
    if (!currentStore) return;
    try {
      const data = await notificationsApi.getAllPreferences(currentStore.id);
      setAllPreferences(data);
    } catch (error) {
      console.error('Failed to fetch all preferences:', error);
    }
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const data = await notificationsApi.getSchedules(currentStore.id);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const data = await notificationsApi.getLogs(currentStore.id, {
        type: logFilters.type as NotificationType | undefined,
        status: logFilters.status as NotificationStatus | undefined,
        limit: 50,
      });
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStore) {
      fetchMyPreferences();
      fetchSchedules();
      fetchLogs();
      fetchAllPreferences();
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore && activeTab === 'history') {
      fetchLogs();
    }
  }, [logFilters, activeTab]);

  // Preference handlers
  const handleTogglePreference = async (field: keyof NotificationPreference) => {
    if (!currentStore || !myPreferences) return;
    try {
      const updated = await notificationsApi.updateMyPreferences(currentStore.id, {
        [field]: !myPreferences[field],
      });
      setMyPreferences(updated);
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const handleUpdateEmail = async (email: string) => {
    if (!currentStore) return;
    try {
      const updated = await notificationsApi.updateMyPreferences(currentStore.id, { email });
      setMyPreferences(updated);
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  const handleUpdatePhone = async (phone: string) => {
    if (!currentStore) return;
    try {
      const updated = await notificationsApi.updateMyPreferences(currentStore.id, { phone });
      setMyPreferences(updated);
    } catch (error) {
      console.error('Failed to update phone:', error);
    }
  };

  // Schedule handlers
  const handleEditSchedule = (schedule: NotificationSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      schedule: schedule.schedule,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!currentStore || !editingSchedule) return;
    try {
      await notificationsApi.updateSchedule(
        currentStore.id,
        editingSchedule.type as NotificationType,
        scheduleForm
      );
      setIsScheduleModalOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const handleToggleSchedule = async (schedule: NotificationSchedule) => {
    if (!currentStore) return;
    try {
      await notificationsApi.updateSchedule(
        currentStore.id,
        schedule.type as NotificationType,
        { enabled: !schedule.enabled }
      );
      fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleInitializeSchedules = async () => {
    if (!currentStore) return;
    try {
      await notificationsApi.initializeSchedules(currentStore.id);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to initialize schedules:', error);
    }
  };

  const handleTriggerDigest = async (type: NotificationType) => {
    if (!currentStore) return;
    try {
      const result = await notificationsApi.triggerDigest(currentStore.id, type);
      alert(`Digest triggered: ${result.sent} notification(s) sent`);
      fetchLogs();
    } catch (error) {
      console.error('Failed to trigger digest:', error);
    }
  };

  // Test notification handler
  const handleSendTest = async () => {
    if (!currentStore) return;
    try {
      const result = await notificationsApi.sendTest(currentStore.id, testForm);
      if (result.success) {
        alert('Test notification sent successfully!');
        setIsTestModalOpen(false);
        fetchLogs();
      } else {
        alert(`Failed to send: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  if (!currentStore) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Please select a store to manage notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Manage your notification preferences and schedules</p>
        </div>
        <Button onClick={() => setIsTestModalOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          Send Test
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preferences">My Preferences</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          {myPreferences && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference('emailEnabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        myPreferences.emailEnabled ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          myPreferences.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference('smsEnabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        myPreferences.smsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          myPreferences.smsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <Input
                      label="Email Address (override)"
                      type="email"
                      value={myPreferences.email || ''}
                      onChange={(e) => handleUpdateEmail(e.target.value)}
                      placeholder="Leave empty to use account email"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={myPreferences.phone || ''}
                      onChange={(e) => handleUpdatePhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Daily Digest</p>
                        <p className="text-sm text-gray-500">Daily sales summary at 8 PM</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference('dailyDigest')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        myPreferences.dailyDigest ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          myPreferences.dailyDigest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Weekly Summary</p>
                        <p className="text-sm text-gray-500">Weekly report on Mondays</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference('weeklySummary')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        myPreferences.weeklySummary ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          myPreferences.weeklySummary ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Alerts</p>
                        <p className="text-sm text-gray-500">
                          Loss prevention, device offline, sync failures
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePreference('alertsEnabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        myPreferences.alertsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          myPreferences.alertsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Schedules</CardTitle>
                <Button variant="secondary" onClick={handleInitializeSchedules}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Initialize Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule (Cron)</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No schedules configured. Click "Initialize Defaults" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {NOTIFICATION_TYPE_LABELS[schedule.type as NotificationType] ||
                            schedule.type}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {schedule.schedule}
                          </code>
                        </TableCell>
                        <TableCell>{schedule.timezone}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleSchedule(schedule)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              schedule.enabled ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                schedule.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleTriggerDigest(schedule.type as NotificationType)
                              }
                            >
                              Trigger Now
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

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification History</CardTitle>
                <div className="flex gap-4">
                  <Select
                    label=""
                    value={logFilters.type}
                    onChange={(e) => setLogFilters((prev) => ({ ...prev, type: e.target.value }))}
                    options={NOTIFICATION_TYPE_OPTIONS}
                  />
                  <Select
                    label=""
                    value={logFilters.status}
                    onChange={(e) => setLogFilters((prev) => ({ ...prev, status: e.target.value }))}
                    options={STATUS_OPTIONS}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No notification logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {NOTIFICATION_TYPE_LABELS[log.type] || log.type}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(log.channel)}
                            <span>{log.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{log.recipient}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">
                          {log.subject || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(log.status)}>
                            {log.status === 'SENT' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {log.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All User Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Email Enabled</TableHead>
                    <TableHead>SMS Enabled</TableHead>
                    <TableHead>Daily Digest</TableHead>
                    <TableHead>Weekly Summary</TableHead>
                    <TableHead>Alerts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPreferences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No user preferences found
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPreferences.map((pref) => (
                      <TableRow key={pref.id}>
                        <TableCell className="font-medium">
                          {pref.user
                            ? `${pref.user.firstName} ${pref.user.lastName}`
                            : 'Unknown User'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {pref.email || pref.user?.email || '-'}
                        </TableCell>
                        <TableCell>
                          {pref.emailEnabled ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          {pref.smsEnabled ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          {pref.dailyDigest ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          {pref.weeklySummary ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          {pref.alertsEnabled ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
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

      {/* Schedule Edit Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Edit Schedule"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveSchedule();
          }}
          className="space-y-4"
        >
          <Input
            label="Cron Expression"
            value={scheduleForm.schedule}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, schedule: e.target.value }))}
            placeholder="0 20 * * *"
          />
          <p className="text-xs text-gray-500">
            Examples: "0 20 * * *" (8 PM daily), "0 9 * * 1" (9 AM Monday)
          </p>
          <Input
            label="Timezone"
            value={scheduleForm.timezone}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, timezone: e.target.value }))}
            placeholder="Asia/Manila"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="schedule-enabled"
              checked={scheduleForm.enabled}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="schedule-enabled" className="text-sm text-gray-700">
              Enabled
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Test Notification Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Send Test Notification"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTest();
          }}
          className="space-y-4"
        >
          <Select
            label="Notification Type"
            value={testForm.type}
            onChange={(e) =>
              setTestForm((prev) => ({ ...prev, type: e.target.value as NotificationType }))
            }
            options={NOTIFICATION_TYPE_OPTIONS.filter((o) => o.value !== '')}
          />
          <Input
            label="Subject (optional)"
            value={testForm.subject}
            onChange={(e) => setTestForm((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Test notification"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={testForm.message}
              onChange={(e) => setTestForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="This is a test notification..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
