import { useState, useEffect } from 'react';
import { usersApi, CreateUserDto, UpdateUserDto, UserWithStores } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { storesApi } from '../../api/stores';
import { Store, Role } from '../../types';
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
import { Plus, Pencil, Trash2, Users, UserPlus } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function UsersPage() {
  const [users, setUsers] = useState<UserWithStores[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStores | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserWithStores | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    storeId: '',
    roleId: '',
  });
  const [assignData, setAssignData] = useState({ storeId: '', roleId: '' });

  const fetchData = async () => {
    try {
      const [usersRes, storesRes] = await Promise.all([
        usersApi.getAll({ limit: 100 }),
        storesApi.getAll({ limit: 100 }),
      ]);
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolesForStore = async (storeId: string) => {
    if (!storeId) {
      setRoles([]);
      return;
    }
    try {
      const rolesRes = await rolesApi.getAll(storeId);
      setRoles(rolesRes);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.storeId) {
      fetchRolesForStore(formData.storeId);
    }
  }, [formData.storeId]);

  useEffect(() => {
    if (assignData.storeId) {
      fetchRolesForStore(assignData.storeId);
    }
  }, [assignData.storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
        } as UpdateUserDto);
      } else {
        await usersApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', firstName: '', lastName: '', storeId: '', roleId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser) return;
    try {
      await usersApi.assignToStore(assigningUser.id, assignData.storeId, assignData.roleId);
      setIsAssignModalOpen(false);
      setAssigningUser(null);
      setAssignData({ storeId: '', roleId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to assign user to store:', error);
    }
  };

  const handleEdit = (user: UserWithStores) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      storeId: '',
      roleId: '',
    });
    setIsModalOpen(true);
  };

  const handleAssign = (user: UserWithStores) => {
    setAssigningUser(user);
    setAssignData({ storeId: '', roleId: '' });
    setIsAssignModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleRemoveFromStore = async (userId: string, storeId: string) => {
    if (!confirm('Are you sure you want to remove this user from the store?')) return;
    try {
      await usersApi.removeFromStore(userId, storeId);
      fetchData();
    } catch (error) {
      console.error('Failed to remove user from store:', error);
    }
  };

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stores & Roles</TableHead>
                <TableHead>Status</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.storeUsers && user.storeUsers.length > 0 ? (
                          user.storeUsers.map((su) => (
                            <Badge
                              key={su.id}
                              variant="default"
                              className="cursor-pointer"
                              onClick={() => handleRemoveFromStore(user.id, su.storeId)}
                              title="Click to remove from store"
                            >
                              {su.store?.name}: {su.role?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No stores assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleAssign(user)} title="Assign to Store">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
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

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          setFormData({ email: '', password: '', firstName: '', lastName: '', storeId: '', roleId: '' });
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
            disabled={!!editingUser}
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
          {!editingUser && (
            <>
              <Select
                label="Assign to Store (Optional)"
                options={storeOptions}
                value={formData.storeId || ''}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value, roleId: '' })}
                placeholder="Select a store"
              />
              {formData.storeId && (
                <Select
                  label="Role"
                  options={roleOptions}
                  value={formData.roleId || ''}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  placeholder="Select a role"
                  required
                />
              )}
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingUser ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign to Store Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningUser(null);
          setAssignData({ storeId: '', roleId: '' });
        }}
        title={`Assign ${assigningUser?.firstName} to Store`}
        size="sm"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            label="Store"
            options={storeOptions}
            value={assignData.storeId}
            onChange={(e) => setAssignData({ ...assignData, storeId: e.target.value, roleId: '' })}
            placeholder="Select a store"
            required
          />
          {assignData.storeId && (
            <Select
              label="Role"
              options={roleOptions}
              value={assignData.roleId}
              onChange={(e) => setAssignData({ ...assignData, roleId: e.target.value })}
              placeholder="Select a role"
              required
            />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
