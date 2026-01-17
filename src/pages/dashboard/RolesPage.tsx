import { useState, useEffect } from 'react';
import { rolesApi, CreateRoleDto, UpdateRoleDto, PermissionGroup } from '../../api/roles';
import { useStore } from '../../contexts/StoreContext';
import { Role, Permission } from '../../types';
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
} from '../../components/ui';
import { Plus, Pencil, Trash2, Shield, Check } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function RolesPage() {
  const { currentStore } = useStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    description: '',
    permissions: [],
  });

  const fetchData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        rolesApi.getAll(currentStore?.id),
        rolesApi.getPermissionsByModule(),
      ]);
      setRoles(rolesRes);
      setPermissionGroups(permissionsRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData as UpdateRoleDto);
      } else {
        await rolesApi.create({
          ...formData,
          storeId: currentStore?.id,
        });
      }
      setIsModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
      fetchData();
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p) => p.code) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await rolesApi.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const togglePermission = (permissionCode: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permissionCode);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((code) => code !== permissionCode)
          : [...prev.permissions, permissionCode],
      };
    });
  };

  const toggleModulePermissions = (modulePermissions: Permission[]) => {
    const permCodes = modulePermissions.map((p) => p.code);
    const allSelected = permCodes.every((code) => formData.permissions.includes(code));

    setFormData((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((code) => !permCodes.includes(code)),
        };
      } else {
        const newCodes = permCodes.filter((code) => !prev.permissions.includes(code));
        return {
          ...prev,
          permissions: [...prev.permissions, ...newCodes],
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            All Roles {currentStore && `- ${currentStore.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
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
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="warning">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 max-w-xs truncate">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{role.permissions?.length || 0} permissions</Badge>
                    </TableCell>
                    <TableCell>{role._count?.storeUsers || 0}</TableCell>
                    <TableCell>{formatDateTime(role.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                          disabled={role.isSystem}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          disabled={role.isSystem}
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

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
          setFormData({ name: '', description: '', permissions: [] });
        }}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Store Manager"
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this role"
          />

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Permissions</label>
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {permissionGroups.map((group) => (
                <div key={group.module} className="border-b last:border-b-0">
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleModulePermissions(group.permissions)}
                  >
                    <span className="font-medium text-gray-900 capitalize">{group.module}</span>
                    <span className="text-sm text-gray-500">
                      {group.permissions.filter((p) => formData.permissions.includes(p.code)).length} / {group.permissions.length}
                    </span>
                  </div>
                  <div className="px-4 py-2 space-y-2">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-3 py-1 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            formData.permissions.includes(permission.code)
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            togglePermission(permission.code);
                          }}
                        >
                          {formData.permissions.includes(permission.code) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          )}
                        </div>
                        <code className="text-xs text-gray-400">{permission.code}</code>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingRole ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
