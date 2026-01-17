import { useState, useEffect } from 'react';
import { posApi, CreatePosDeviceDto, UpdatePosDto, PosDeviceWithCode } from '../../api/pos';
import { branchesApi } from '../../api/branches';
import { PosDevice, Branch, PosStatus } from '../../types';
import { useStore } from '../../contexts/StoreContext';
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
import { Plus, Pencil, Trash2, Monitor, RefreshCw, Copy, Check, Key, Clock } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function PosDevicesPage() {
  const { currentStore } = useStore();
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<PosDevice | null>(null);
  const [createdDevice, setCreatedDevice] = useState<PosDeviceWithCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreatePosDeviceDto>({
    branchId: '',
    name: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
  });

  const fetchData = async () => {
    if (!currentStore) return;
    try {
      const [devicesRes, branchesRes] = await Promise.all([
        posApi.getAll({ storeId: currentStore.id, limit: 100 }),
        branchesApi.getAll({ storeId: currentStore.id, limit: 100 }),
      ]);
      setDevices(devicesRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentStore]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const device = await posApi.createDevice(createFormData);
      setCreatedDevice(device);
      setIsCreateModalOpen(false);
      setIsCodeModalOpen(true);
      setCreateFormData({ branchId: '', name: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    try {
      await posApi.update(editingDevice.id, editFormData as UpdatePosDto);
      setIsEditModalOpen(false);
      setEditingDevice(null);
      setEditFormData({ name: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to update device:', error);
    }
  };

  const openEditModal = (device: PosDevice) => {
    setEditingDevice(device);
    setEditFormData({ name: device.name || '' });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await posApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const handleRegenerateCode = async (device: PosDevice) => {
    if (!confirm('Regenerate registration code? The old code will be invalidated.')) return;
    try {
      const updatedDevice = await posApi.regenerateCode(device.id);
      setCreatedDevice(updatedDevice);
      setIsCodeModalOpen(true);
      fetchData();
    } catch (error) {
      console.error('Failed to regenerate code:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusBadge = (device: PosDevice) => {
    if (!device.isRegistered) {
      return <Badge variant="warning">Pending Registration</Badge>;
    }
    const variants: Record<PosStatus, 'success' | 'warning' | 'danger'> = {
      ONLINE: 'success',
      OFFLINE: 'warning',
      INACTIVE: 'danger',
    };
    return <Badge variant={variants[device.status]}>{device.status}</Badge>;
  };

  const isCodeExpired = (expiresAt?: string) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">POS Devices</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            All POS Devices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Last Heartbeat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No devices found. Click "Add Device" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">
                      {device.name || device.deviceIdentifier || 'Unnamed Device'}
                    </TableCell>
                    <TableCell>{device.branch?.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell>
                      {device.isRegistered ? (
                        <span className="text-sm text-gray-500">
                          {device.registeredAt ? formatDateTime(device.registeredAt) : 'Registered'}
                        </span>
                      ) : device.registrationCode ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                            {device.registrationCode}
                          </code>
                          <button
                            onClick={() => copyToClipboard(device.registrationCode!)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {device.registrationCodeExpiresAt && isCodeExpired(device.registrationCodeExpiresAt) && (
                            <Badge variant="danger" className="text-xs">Expired</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No code</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.lastHeartbeatAt ? formatDateTime(device.lastHeartbeatAt) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!device.isRegistered && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateCode(device)}
                            title="Regenerate Code"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(device)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(device.id)}>
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

      {/* Create Device Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateFormData({ branchId: '', name: '' });
        }}
        title="Add New POS Device"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Branch"
            options={branchOptions}
            value={createFormData.branchId}
            onChange={(e) => setCreateFormData({ ...createFormData, branchId: e.target.value })}
            placeholder="Select a branch"
            required
          />
          <Input
            label="Device Name"
            value={createFormData.name}
            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
            placeholder="e.g., Counter 1, Drive-Thru"
          />
          <p className="text-sm text-gray-500">
            A registration code will be generated that you can use to connect the POS device.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Device</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDevice(null);
          setEditFormData({ name: '' });
        }}
        title="Edit Device"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Device Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            placeholder="Optional friendly name"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Registration Code Modal */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => {
          setIsCodeModalOpen(false);
          setCreatedDevice(null);
          setCopied(false);
        }}
        title="Registration Code"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Key className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-gray-600 mb-4">
              Use this code to register the POS device:
            </p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-mono font-bold tracking-widest bg-gray-100 px-6 py-3 rounded-lg">
                {createdDevice?.registrationCode}
              </code>
              <button
                onClick={() => copyToClipboard(createdDevice?.registrationCode || '')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Copy className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Code expires in 24 hours</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">How to use this code:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open the POS application on the device</li>
              <li>Enter this registration code when prompted</li>
              <li>The device will automatically connect to this store</li>
            </ol>
          </div>
          <Button onClick={() => setIsCodeModalOpen(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
