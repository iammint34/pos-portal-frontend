import { useState, useEffect } from 'react';
import { storesApi, CreateStoreDto, UpdateStoreDto } from '../../api/stores';
import { useStore } from '../../contexts/StoreContext';
import { Store, StoreType, StoreStatus } from '../../types';
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
import { Plus, Pencil, Trash2, Store as StoreIcon } from 'lucide-react';
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
      setFormData({ name: '', type: 'OTHER', address: '', phone: '', email: '' });
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
          setFormData({ name: '', type: 'OTHER', address: '', phone: '', email: '' });
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
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingStore ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
