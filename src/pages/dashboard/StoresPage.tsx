import { useState, useEffect } from 'react';
import { storesApi, CreateStoreDto, UpdateStoreDto } from '../../api/stores';
import { useStore } from '../../contexts/StoreContext';
import { Store, StoreType, StoreStatus, CloneStoreRequest, CloneStoreConfig } from '../../types';
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
import { Plus, Pencil, Trash2, Store as StoreIcon, Copy } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function StoresPage() {
  const { refetchStores: refreshStoreContext } = useStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<CreateStoreDto>({
    name: '',
    type: 'OTHER',
    address: '',
    phone: '',
    email: '',
    registeredName: '',
    registeredAddress: '',
    vatTin: '',
    isVatRegistered: true,
  });

  // Clone modal state
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloningStore, setCloningStore] = useState<Store | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneFormData, setCloneFormData] = useState<{
    name: string;
    type: StoreType;
    address: string;
    phone: string;
    email: string;
    registeredName: string;
    registeredAddress: string;
    vatTin: string;
    isVatRegistered: boolean;
    config: CloneStoreConfig;
  }>({
    name: '',
    type: 'OTHER',
    address: '',
    phone: '',
    email: '',
    registeredName: '',
    registeredAddress: '',
    vatTin: '',
    isVatRegistered: true,
    config: {
      items: true,
      categories: true,
      roles: true,
      lossPreventionThresholds: true,
      storeFeatures: false,
    },
  });

  const fetchStores = async () => {
    try {
      const response = await storesApi.getAll({ limit: 100 });
      setStores(response.data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await storesApi.update(editingStore.id, formData as UpdateStoreDto);
      } else {
        await storesApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingStore(null);
      setFormData({ name: '', type: 'OTHER', address: '', phone: '', email: '', registeredName: '', registeredAddress: '', vatTin: '', isVatRegistered: true });
      fetchStores();
      // Refresh the store context to update sidebar navigation
      refreshStoreContext();
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      type: store.type,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      registeredName: store.registeredName || '',
      registeredAddress: store.registeredAddress || '',
      vatTin: store.vatTin || '',
      isVatRegistered: store.isVatRegistered ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      await storesApi.delete(id);
      fetchStores();
      // Refresh the store context to update sidebar navigation
      refreshStoreContext();
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  const openCloneModal = (store: Store) => {
    setCloningStore(store);
    setCloneFormData({
      name: `Copy of ${store.name}`,
      type: store.type,
      address: '',
      phone: '',
      email: '',
      registeredName: '',
      registeredAddress: '',
      vatTin: '',
      isVatRegistered: true,
      config: {
        items: true,
        categories: true,
        roles: true,
        lossPreventionThresholds: true,
        storeFeatures: false,
      },
    });
    setIsCloneModalOpen(true);
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloningStore) return;

    setIsCloning(true);
    try {
      const request: CloneStoreRequest = {
        sourceStoreId: cloningStore.id,
        name: cloneFormData.name,
        type: cloneFormData.type,
        address: cloneFormData.address || undefined,
        phone: cloneFormData.phone || undefined,
        email: cloneFormData.email || undefined,
        registeredName: cloneFormData.registeredName || undefined,
        registeredAddress: cloneFormData.registeredAddress || undefined,
        vatTin: cloneFormData.vatTin || undefined,
        isVatRegistered: cloneFormData.isVatRegistered,
        config: cloneFormData.config,
      };

      await storesApi.clone(request);
      setIsCloneModalOpen(false);
      setCloningStore(null);
      fetchStores();
      refreshStoreContext();
    } catch (error) {
      console.error('Failed to clone store:', error);
    } finally {
      setIsCloning(false);
    }
  };

  const getStatusBadge = (status: StoreStatus) => {
    const variants: Record<StoreStatus, 'success' | 'warning' | 'danger'> = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      SUSPENDED: 'danger',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const storeTypes: { value: StoreType; label: string }[] = [
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'RETAIL', label: 'Retail' },
    { value: 'CAFE', label: 'Cafe' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5" />
            All Stores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Created</TableHead>
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
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No stores found
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.type}</TableCell>
                    <TableCell>{getStatusBadge(store.status)}</TableCell>
                    <TableCell>{store._count?.branches || 0}</TableCell>
                    <TableCell>{formatDate(store.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openCloneModal(store)} title="Clone Store">
                          <Copy className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(store)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(store.id)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStore(null);
          setFormData({ name: '', type: 'OTHER', address: '', phone: '', email: '', registeredName: '', registeredAddress: '', vatTin: '', isVatRegistered: true });
        }}
        title={editingStore ? 'Edit Store' : 'Add Store'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Store Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Store Type"
            options={storeTypes}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as StoreType })}
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
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          {/* BIR Compliance Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">BIR Compliance Settings</h3>
            <div className="space-y-4">
              <Input
                label="BIR Registered Name"
                value={formData.registeredName}
                onChange={(e) => setFormData({ ...formData, registeredName: e.target.value })}
                placeholder="Official business name registered with BIR"
              />
              <Input
                label="BIR Registered Address"
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                placeholder="Address registered with BIR"
              />
              <Input
                label="VAT TIN"
                value={formData.vatTin}
                onChange={(e) => setFormData({ ...formData, vatTin: e.target.value })}
                placeholder="e.g., 123-456-789-000"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVatRegistered"
                  checked={formData.isVatRegistered}
                  onChange={(e) => setFormData({ ...formData, isVatRegistered: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isVatRegistered" className="text-sm text-gray-700">
                  VAT Registered Business
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingStore ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Clone Store Modal */}
      <Modal
        isOpen={isCloneModalOpen}
        onClose={() => {
          setIsCloneModalOpen(false);
          setCloningStore(null);
        }}
        title={`Clone Store: ${cloningStore?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleClone} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
            Create a new store based on <strong>{cloningStore?.name}</strong>. Select which data to copy to the new store.
          </div>

          <Input
            label="New Store Name"
            value={cloneFormData.name}
            onChange={(e) => setCloneFormData({ ...cloneFormData, name: e.target.value })}
            required
          />

          <Select
            label="Store Type"
            options={storeTypes}
            value={cloneFormData.type}
            onChange={(e) => setCloneFormData({ ...cloneFormData, type: e.target.value as StoreType })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address"
              value={cloneFormData.address}
              onChange={(e) => setCloneFormData({ ...cloneFormData, address: e.target.value })}
              placeholder="Leave blank if different"
            />
            <Input
              label="Phone"
              value={cloneFormData.phone}
              onChange={(e) => setCloneFormData({ ...cloneFormData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={cloneFormData.email}
            onChange={(e) => setCloneFormData({ ...cloneFormData, email: e.target.value })}
          />

          {/* Clone Options */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Data to Clone</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.config.categories}
                  onChange={(e) => setCloneFormData({
                    ...cloneFormData,
                    config: { ...cloneFormData.config, categories: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Categories</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.config.items}
                  onChange={(e) => setCloneFormData({
                    ...cloneFormData,
                    config: { ...cloneFormData.config, items: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Items (Menu/Products)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.config.roles}
                  onChange={(e) => setCloneFormData({
                    ...cloneFormData,
                    config: { ...cloneFormData.config, roles: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Roles & Permissions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.config.lossPreventionThresholds}
                  onChange={(e) => setCloneFormData({
                    ...cloneFormData,
                    config: { ...cloneFormData.config, lossPreventionThresholds: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Loss Prevention Thresholds</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.config.storeFeatures}
                  onChange={(e) => setCloneFormData({
                    ...cloneFormData,
                    config: { ...cloneFormData.config, storeFeatures: e.target.checked }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Feature Flags</span>
              </label>
            </div>
          </div>

          {/* BIR Compliance Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">BIR Compliance (Optional)</h3>
            <div className="space-y-4">
              <Input
                label="BIR Registered Name"
                value={cloneFormData.registeredName}
                onChange={(e) => setCloneFormData({ ...cloneFormData, registeredName: e.target.value })}
                placeholder="Official business name registered with BIR"
              />
              <Input
                label="BIR Registered Address"
                value={cloneFormData.registeredAddress}
                onChange={(e) => setCloneFormData({ ...cloneFormData, registeredAddress: e.target.value })}
                placeholder="Address registered with BIR"
              />
              <Input
                label="VAT TIN"
                value={cloneFormData.vatTin}
                onChange={(e) => setCloneFormData({ ...cloneFormData, vatTin: e.target.value })}
                placeholder="e.g., 123-456-789-000"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cloneFormData.isVatRegistered}
                  onChange={(e) => setCloneFormData({ ...cloneFormData, isVatRegistered: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">VAT Registered Business</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCloneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCloning}>
              <Copy className="w-4 h-4 mr-2" />
              Clone Store
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
