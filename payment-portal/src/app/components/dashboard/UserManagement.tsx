import { useEffect, useState } from 'react';
import { UserPlus, Mail, Shield, Trash2, Users, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { forwarderApi, getCurrentUser, type CompanyRole } from '../../services/apiClient';

interface CompanyUser {
  id: number;
  email: string;
  fullName: string;
  companyRole: CompanyRole | null;
  isActive: boolean;
}

const ROLE_OPTIONS: CompanyRole[] = ['Admin', 'Manager', 'Member'];

export function UserManagement() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<CompanyRole>('Member');
  const [isRoleInfoOpen, setIsRoleInfoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = getCurrentUser();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await forwarderApi.getCompanyUsers();
      setUsers(list);
    } catch (err) {
      toast.error('Failed to load company users', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUserFullName || !newUserEmail || !newUserPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await forwarderApi.createCompanyUser({
        email: newUserEmail,
        fullName: newUserFullName,
        password: newUserPassword,
        companyRole: newUserRole,
      });
      toast.success('User has been added', {
        description: `${newUserEmail} (${newUserRole}) joined your company.`,
      });
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('Member');
      setIsAddUserOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error('Failed to add user', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: CompanyUser) => {
    if (currentUser && user.id === currentUser.id) {
      toast.error('You cannot remove yourself.');
      return;
    }
    try {
      await forwarderApi.deleteCompanyUser(user.id);
      toast.success('User deactivated', {
        description: `${user.fullName}'s account has been deactivated.`,
      });
      await loadUsers();
    } catch (err) {
      toast.error('Failed to delete user', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleRoleChange = async (user: CompanyUser, nextRole: CompanyRole) => {
    try {
      await forwarderApi.updateCompanyUser(user.id, { companyRole: nextRole });
      toast.success(`${user.fullName} is now ${nextRole}`);
      await loadUsers();
    } catch (err) {
      toast.error('Failed to update role', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const getRoleBadge = (role: CompanyRole | null) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-purple-100 text-purple-800">Administrator</Badge>;
      case 'Manager':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'Member':
        return <Badge className="bg-gray-100 text-gray-800">Member</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">—</Badge>;
    }
  };

  const getRoleDescription = (role: CompanyRole) => {
    switch (role) {
      case 'Admin':
        return 'Full access: manage users, view all receipts, access reports, manage saved cards.';
      case 'Manager':
        return 'Can make payments and view the entire company\'s receipts; cannot manage users or reports.';
      case 'Member':
        return 'Can make payments. Sees own receipts only.';
    }
  };

  const adminCount = users.filter(u => u.companyRole === 'Admin').length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Administrators</p>
              <p className="text-3xl font-bold text-gray-900">{adminCount}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active</p>
              <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* User List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">User List</h3>
            <Dialog open={isRoleInfoOpen} onOpenChange={setIsRoleInfoOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Info className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Role Descriptions</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {ROLE_OPTIONS.map(role => (
                    <div key={role}>
                      <p className="font-semibold text-gray-900">• {role}</p>
                      <p className="text-sm text-gray-600 ml-4">{getRoleDescription(role)}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="userName">Full Name</Label>
                  <Input
                    id="userName"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="userPassword">Temporary Password</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Initial password"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="userRole">Role</Label>
                  <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as CompanyRole)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUser} className="w-full" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 pb-3 border-b font-semibold text-sm text-gray-600">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-center">Actions</span>
          </div>

          {loading && (
            <div className="py-8 text-center text-gray-500">Loading users…</div>
          )}
          {!loading && users.length === 0 && (
            <div className="py-8 text-center text-gray-500">No users yet.</div>
          )}

          {/* User Items */}
          {!loading && users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-gray-50 rounded-lg px-2 transition-colors"
            >
              <span className="font-semibold text-gray-900">{user.fullName}</span>
              <span className="text-gray-600 text-sm">{user.email}</span>
              <div className="flex items-center space-x-2">
                {getRoleBadge(user.companyRole)}
                {currentUser && user.id !== currentUser.id && (
                  <Select
                    value={user.companyRole ?? 'Member'}
                    onValueChange={(value) => handleRoleChange(user, value as CompanyRole)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <span className="text-sm">
                {user.isActive
                  ? <Badge className="bg-green-100 text-green-800">Active</Badge>
                  : <Badge className="bg-gray-200 text-gray-700">Inactive</Badge>}
              </span>
              <div className="flex justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user)}
                  disabled={
                    !user.isActive ||
                    (user.companyRole === 'Admin' && adminCount === 1) ||
                    (currentUser && user.id === currentUser.id) || false
                  }
                  title={
                    user.companyRole === 'Admin' && adminCount === 1
                      ? 'Cannot remove the only Admin'
                      : 'Deactivate user'
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
