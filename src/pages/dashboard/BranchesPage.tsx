import { useState, useEffect } from 'react';
import { branchesApi, CreateBranchDto, UpdateBranchDto } from '../../api/branches';
import { posApi } from '../../api/pos';
import { Branch, BranchStatus, PosDevice, PosStatus } from '../../types';
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
import { Plus, Pencil, Trash2, Building2, ChevronDown, ChevronRight, Monitor } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

interface BranchWithDevices extends Branch {
  posDevices?: PosDevice[];
  posDevicesLoading?: boolean;
  posDeviceStats?: {
    online: number;
    offline: number;
    inactive: number;
  };
}

export function BranchesPage() {
  const { currentStore } = useStore();
  const [branches, setBranches] = useState<BranchWithDevices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Omit<CreateBranchDto, 'storeId'>>({
    name: '',
    address: '',
    phone: '',
    ptuNo: '',
    ptuDateIssued: '',
    ptuValidUntil: '',
    accreditationNo: '',
  });

  const fetchBranches = async () => {
    if (!currentStore) return;
    try {
      const response = await branchesApi.getAll({ storeId: currentStore.id, limit: 100 });
      const branchesData = response.data;
      setBranches(branchesData);

      // Fetch device stats for all branches that have devices
      fetchAllBranchDeviceStats(branchesData);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBranchDeviceStats = async (branchesData: BranchWithDevices[]) => {
    if (!currentStore) return;

    // Get branches that have devices
    const branchesWithDevices = branchesData.filter(b => (b._count?.posDevices || 0) > 0);

    // Fetch devices for each branch in parallel
    const statsPromises = branchesWithDevices.map(async (branch) => {
      try {
        const response = await posApi.getAll({
          storeId: currentStore.id,
          branchId: branch.id,
          limit: 100
        });
        const devices = response.data;
        return {
          branchId: branch.id,
          stats: {
            online: devices.filter(d => d.status === 'ONLINE').length,
            offline: devices.filter(d => d.status === 'OFFLINE').length,
            inactive: devices.filter(d => d.status === 'INACTIVE').length,
          }
        };
      } catch (error) {
        console.error(`Failed to fetch devices for branch ${branch.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(statsPromises);

    // Update branches with stats
    setBranches(prev => prev.map(branch => {
      const result = results.find(r => r?.branchId === branch.id);
      if (result) {
        return { ...branch, posDeviceStats: result.stats };
      }
      return branch;
    }));
  };

  useEffect(() => {
    fetchBranches();
  }, [currentStore]);

  const fetchPosDevicesForBranch = async (branchId: string) => {
    if (!currentStore) return;

    // Update loading state
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, posDevicesLoading: true } : b
    ));

    try {
      const response = await posApi.getAll({
        storeId: currentStore.id,
        branchId,
        limit: 100
      });

      // Calculate stats
      const devices = response.data;
      const stats = {
        online: devices.filter(d => d.status === 'ONLINE').length,
        offline: devices.filter(d => d.status === 'OFFLINE').length,
        inactive: devices.filter(d => d.status === 'INACTIVE').length,
      };

      setBranches(prev => prev.map(b =>
        b.id === branchId
          ? { ...b, posDevices: devices, posDevicesLoading: false, posDeviceStats: stats }
          : b
      ));
    } catch (error) {
      console.error('Failed to fetch POS devices:', error);
      setBranches(prev => prev.map(b =>
        b.id === branchId ? { ...b, posDevicesLoading: false } : b
      ));
    }
  };

  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
      // Fetch devices if not already loaded
      const branch = branches.find(b => b.id === branchId);
      if (!branch?.posDevices) {
        fetchPosDevicesForBranch(branchId);
      }
    }
    setExpandedBranches(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;
    try {
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, formData as UpdateBranchDto);
      } else {
        await branchesApi.create({ ...formData, storeId: currentStore.id });
      }
      setIsModalOpen(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', ptuNo: '', ptuDateIssued: '', ptuValidUntil: '', accreditationNo: '' });
      fetchBranches();
    } catch (error) {
      console.error('Failed to save branch:', error);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      ptuNo: branch.ptuNo || '',
      ptuDateIssued: branch.ptuDateIssued ? branch.ptuDateIssued.split('T')[0] : '',
      ptuValidUntil: branch.ptuValidUntil ? branch.ptuValidUntil.split('T')[0] : '',
      accreditationNo: branch.accreditationNo || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await branchesApi.delete(id);
      fetchBranches();
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const getStatusBadge = (status: BranchStatus) => {
    const variants: Record<BranchStatus, 'success' | 'warning' | 'danger'> = {
      ONLINE: 'success',
      OFFLINE: 'warning',
      MAINTENANCE: 'danger',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPosStatusBadge = (status: PosStatus) => {
    const variants: Record<PosStatus, 'success' | 'warning' | 'danger'> = {
      ONLINE: 'success',
      OFFLINE: 'warning',
      INACTIVE: 'danger',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const renderPosDeviceStats = (branch: BranchWithDevices) => {
    const total = branch._count?.posDevices || 0;
    if (total === 0) {
      return <span className="text-gray-400">No devices</span>;
    }

    const stats = branch.posDeviceStats;
    if (stats) {
      const parts: string[] = [];
      if (stats.online > 0) parts.push(`${stats.online} online`);
      if (stats.offline > 0) parts.push(`${stats.offline} offline`);
      if (stats.inactive > 0) parts.push(`${stats.inactive} inactive`);

      return (
        <div className="flex items-center gap-1">
          <span className="font-medium">{total}</span>
          {parts.length > 0 && (
            <span className="text-xs text-gray-500">
              ({parts.join(', ')})
            </span>
          )}
        </div>
      );
    }

    return <span className="font-medium">{total}</span>;
  };

  const statusOptions = [
    { value: 'ONLINE', label: 'Online' },
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Branches
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>POS Devices</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <>
                    <TableRow key={branch.id} className="hover:bg-gray-50">
                      <TableCell>
                        {(branch._count?.posDevices || 0) > 0 && (
                          <button
                            onClick={() => toggleBranchExpansion(branch.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedBranches.has(branch.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.store?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(branch.status)}</TableCell>
                      <TableCell>{renderPosDeviceStats(branch)}</TableCell>
                      <TableCell>
                        {branch.lastSyncAt ? formatDateTime(branch.lastSyncAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(branch)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(branch.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedBranches.has(branch.id) && (
                      <TableRow key={`${branch.id}-devices`}>
                        <TableCell colSpan={7} className="bg-gray-50 p-0">
                          <div className="p-4 pl-12">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Monitor className="w-4 h-4" />
                              POS Devices
                            </h4>
                            {branch.posDevicesLoading ? (
                              <p className="text-gray-500 text-sm">Loading devices...</p>
                            ) : branch.posDevices && branch.posDevices.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Device Name</TableHead>
                                    <TableHead>Identifier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>App Version</TableHead>
                                    <TableHead>Last Heartbeat</TableHead>
                                    <TableHead>Registered</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {branch.posDevices.map((device) => (
                                    <TableRow key={device.id}>
                                      <TableCell className="font-medium">
                                        {device.name || '-'}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {device.deviceIdentifier || '-'}
                                      </TableCell>
                                      <TableCell>{getPosStatusBadge(device.status)}</TableCell>
                                      <TableCell>{device.appVersion || '-'}</TableCell>
                                      <TableCell>
                                        {device.lastHeartbeatAt
                                          ? formatDateTime(device.lastHeartbeatAt)
                                          : 'Never'}
                                      </TableCell>
                                      <TableCell>
                                        {device.isRegistered ? (
                                          <Badge variant="success">Yes</Badge>
                                        ) : (
                                          <Badge variant="warning">No</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-gray-500 text-sm">No devices found</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBranch(null);
          setFormData({ name: '', address: '', phone: '', ptuNo: '', ptuDateIssued: '', ptuValidUntil: '', accreditationNo: '' });
        }}
        title={editingBranch ? 'Edit Branch' : 'Add Branch'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Branch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {editingBranch && (
            <Select
              label="Status"
              options={statusOptions}
              value={(formData as UpdateBranchDto).status || editingBranch.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value as BranchStatus }))
              }
            />
          )}

          {/* BIR PTU Compliance Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">BIR PTU (Permit To Use) Settings</h3>
            <div className="space-y-4">
              <Input
                label="PTU Number"
                value={formData.ptuNo}
                onChange={(e) => setFormData({ ...formData, ptuNo: e.target.value })}
                placeholder="e.g., PTU-2024-000001"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="PTU Date Issued"
                  type="date"
                  value={formData.ptuDateIssued}
                  onChange={(e) => setFormData({ ...formData, ptuDateIssued: e.target.value })}
                />
                <Input
                  label="PTU Valid Until"
                  type="date"
                  value={formData.ptuValidUntil}
                  onChange={(e) => setFormData({ ...formData, ptuValidUntil: e.target.value })}
                />
              </div>
              <Input
                label="Accreditation Number"
                value={formData.accreditationNo}
                onChange={(e) => setFormData({ ...formData, accreditationNo: e.target.value })}
                placeholder="BIR Accreditation Number"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingBranch ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
