import { useState, useEffect } from 'react';
import { inventoryApi, AdjustmentType } from '../../api/inventory';
import { branchesApi } from '../../api/branches';
import { itemsApi } from '../../api/items';
import { BranchInventory, InventoryMovement, Branch, Item } from '../../types';
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
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

type ModalType = 'receive' | 'adjust' | 'history' | 'add' | null;

export function InventoryPage() {
  const { currentStore } = useStore();
  const [inventory, setInventory] = useState<BranchInventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedInventory, setSelectedInventory] = useState<BranchInventory | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Form state
  const [receiveQuantity, setReceiveQuantity] = useState<number>(1);
  const [receiveReference, setReceiveReference] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<AdjustmentType>('ADJUSTED_UP');
  const [adjustReason, setAdjustReason] = useState('');

  // Add inventory state
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const fetchBranches = async () => {
    if (!currentStore) return;
    try {
      const response = await branchesApi.getAll({ storeId: currentStore.id, limit: 100 });
      setBranches(response.data);
      if (response.data.length > 0 && !selectedBranchId) {
        setSelectedBranchId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchInventory = async () => {
    if (!currentStore) return;
    setIsLoading(true);
    try {
      const response = await inventoryApi.getAll({
        storeId: currentStore.id,
        branchId: selectedBranchId || undefined,
        lowStockOnly,
        search: searchTerm || undefined,
        limit: 100,
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [currentStore]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchInventory();
    }
  }, [currentStore, selectedBranchId, lowStockOnly, searchTerm]);

  const fetchMovements = async (inventoryId: string) => {
    setIsLoadingMovements(true);
    try {
      const response = await inventoryApi.getMovements(inventoryId, { limit: 50 });
      setMovements(response.data);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const fetchAvailableItems = async () => {
    if (!currentStore || !selectedBranchId) return;
    setIsLoadingItems(true);
    try {
      const itemsResponse = await itemsApi.getAll({ storeId: currentStore.id, limit: 500, isActive: true });
      // Filter out items that already have inventory tracking
      const trackedItemIds = new Set(inventory.map((inv) => inv.itemId));
      const untracked = itemsResponse.data.filter((item) => !trackedItemIds.has(item.id));
      setAvailableItems(untracked);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleReceiveStock = async () => {
    if (!selectedInventory || receiveQuantity < 1 || !currentStore) return;
    try {
      await inventoryApi.receiveStock({
        storeId: currentStore.id,
        inventoryId: selectedInventory.id,
        quantity: receiveQuantity,
        referenceNumber: receiveReference || undefined,
      });
      setModalType(null);
      setReceiveQuantity(1);
      setReceiveReference('');
      fetchInventory();
    } catch (error) {
      console.error('Failed to receive stock:', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedInventory || adjustQuantity < 1 || !currentStore) return;
    try {
      await inventoryApi.adjust({
        storeId: currentStore.id,
        inventoryId: selectedInventory.id,
        adjustmentType: adjustType,
        quantity: adjustQuantity,
        reason: adjustReason || undefined,
      });
      setModalType(null);
      setAdjustQuantity(1);
      setAdjustReason('');
      fetchInventory();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const handleAddInventory = async () => {
    if (!selectedItemId || !selectedBranchId || !currentStore) return;
    try {
      await inventoryApi.create({
        storeId: currentStore.id,
        itemId: selectedItemId,
        branchId: selectedBranchId,
        initialQuantity,
        lowStockThreshold,
        isTracked: true,
      });
      closeModal();
      fetchInventory();
    } catch (error) {
      console.error('Failed to add inventory:', error);
    }
  };

  const openModal = (type: ModalType, inv?: BranchInventory) => {
    if (inv) {
      setSelectedInventory(inv);
    }
    setModalType(type);
    if (type === 'history' && inv) {
      fetchMovements(inv.id);
    }
    if (type === 'add') {
      fetchAvailableItems();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedInventory(null);
    setMovements([]);
    setReceiveQuantity(1);
    setReceiveReference('');
    setAdjustQuantity(1);
    setAdjustReason('');
    setSelectedItemId('');
    setInitialQuantity(0);
    setLowStockThreshold(10);
    setAvailableItems([]);
  };

  const getStockStatus = (inv: BranchInventory) => {
    if (inv.currentQuantity === 0) {
      return { label: 'Out of Stock', variant: 'danger' as const };
    }
    if (inv.lowStockThreshold && inv.currentQuantity <= inv.lowStockThreshold) {
      return { label: 'Low Stock', variant: 'warning' as const };
    }
    return { label: 'In Stock', variant: 'success' as const };
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      RECEIVED: { label: 'Received', color: 'text-green-600' },
      SOLD: { label: 'Sold', color: 'text-blue-600' },
      ADJUSTED_UP: { label: 'Adjusted +', color: 'text-green-600' },
      ADJUSTED_DOWN: { label: 'Adjusted -', color: 'text-orange-600' },
      WASTED: { label: 'Wasted', color: 'text-red-600' },
      VOIDED_SALE: { label: 'Void Restored', color: 'text-purple-600' },
      REFUNDED: { label: 'Refund Restored', color: 'text-purple-600' },
      TRANSFER_IN: { label: 'Transfer In', color: 'text-green-600' },
      TRANSFER_OUT: { label: 'Transfer Out', color: 'text-orange-600' },
    };
    return labels[type] || { label: type, color: 'text-gray-600' };
  };

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  const adjustTypeOptions = [
    { value: 'ADJUSTED_UP', label: 'Add Stock (+)' },
    { value: 'ADJUSTED_DOWN', label: 'Remove Stock (-)' },
    { value: 'WASTED', label: 'Wastage/Spoilage' },
  ];

  const lowStockCount = inventory.filter(
    (inv) => inv.lowStockThreshold && inv.currentQuantity <= inv.lowStockThreshold
  ).length;

  const outOfStockCount = inventory.filter((inv) => inv.currentQuantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button onClick={() => openModal('add')} disabled={!selectedBranchId}>
          <Plus className="w-4 h-4 mr-2" />
          Add Inventory
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Select
                label="Branch"
                options={branchOptions}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Input
                label="Search"
                placeholder="Search by item name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lowStockOnly"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="lowStockOnly" className="text-sm text-gray-700">
                Low stock only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Low Threshold</TableHead>
                <TableHead>Status</TableHead>
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
              ) : inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No inventory records found
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((inv) => {
                  const status = getStockStatus(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.item?.name || '-'}</TableCell>
                      <TableCell>{inv.item?.sku || '-'}</TableCell>
                      <TableCell>{inv.item?.category?.name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{inv.currentQuantity}</TableCell>
                      <TableCell className="text-right font-mono">
                        {inv.lowStockThreshold ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal('receive', inv)}
                            title="Receive Stock"
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal('adjust', inv)}
                            title="Adjust Stock"
                          >
                            <Minus className="w-4 h-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal('history', inv)}
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Stock Modal */}
      <Modal
        isOpen={modalType === 'receive'}
        onClose={closeModal}
        title="Receive Stock"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-medium">{selectedInventory?.item?.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Current Stock: <span className="font-mono">{selectedInventory?.currentQuantity}</span>
            </p>
          </div>
          <Input
            label="Quantity to Receive"
            type="number"
            min="1"
            value={receiveQuantity}
            onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || 1)}
            required
          />
          <Input
            label="Reference Number (optional)"
            placeholder="e.g., PO-12345"
            value={receiveReference}
            onChange={(e) => setReceiveReference(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleReceiveStock}>
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Receive Stock
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={modalType === 'adjust'}
        onClose={closeModal}
        title="Adjust Stock"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-medium">{selectedInventory?.item?.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Current Stock: <span className="font-mono">{selectedInventory?.currentQuantity}</span>
            </p>
          </div>
          <Select
            label="Adjustment Type"
            options={adjustTypeOptions}
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value as AdjustmentType)}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={adjustQuantity}
            onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 1)}
            required
          />
          <Input
            label="Reason (optional)"
            placeholder="e.g., Damaged items, inventory count correction"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Apply Adjustment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Movement History Modal */}
      <Modal
        isOpen={modalType === 'history'}
        onClose={closeModal}
        title="Movement History"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-medium">{selectedInventory?.item?.name}</p>
          </div>
          {isLoadingMovements ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No movement history</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => {
                    const typeInfo = getMovementTypeLabel(mov.movementType);
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">
                          {new Date(mov.performedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mov.movementType.includes('DOWN') ||
                          mov.movementType === 'SOLD' ||
                          mov.movementType === 'WASTED' ||
                          mov.movementType === 'TRANSFER_OUT'
                            ? `-${mov.quantity}`
                            : `+${mov.quantity}`}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-500">
                          {mov.previousQuantity}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {mov.newQuantity}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {mov.reason || mov.referenceType || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Inventory Modal */}
      <Modal
        isOpen={modalType === 'add'}
        onClose={closeModal}
        title="Add Inventory Tracking"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Add inventory tracking for items that are not yet tracked at this branch.
            </p>
          </div>
          {isLoadingItems ? (
            <div className="text-center py-8 text-gray-500">Loading items...</div>
          ) : availableItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              All items are already being tracked at this branch.
            </div>
          ) : (
            <>
              <Select
                label="Select Item"
                options={[
                  { value: '', label: 'Select an item...' },
                  ...availableItems.map((item) => ({
                    value: item.id,
                    label: `${item.name}${item.sku ? ` (${item.sku})` : ''}`,
                  })),
                ]}
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              />
              <Input
                label="Initial Quantity"
                type="number"
                min="0"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(parseInt(e.target.value) || 0)}
              />
              <Input
                label="Low Stock Threshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleAddInventory} disabled={!selectedItemId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Inventory
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
