import { useState } from 'react';
import { UserPlus, Mail, Shield, Edit, Trash2, Users, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'payment' | 'view';
  lastActive: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Kim',
      email: 'john.kim@globalfreight.com',
      role: 'admin',
      lastActive: '2026-01-09'
    },
    {
      id: '2',
      name: 'Sarah Lee',
      email: 'sarah.lee@globalfreight.com',
      role: 'payment',
      lastActive: '2026-01-08'
    },
    {
      id: '3',
      name: 'Michael Park',
      email: 'michael.park@globalfreight.com',
      role: 'view',
      lastActive: '2026-01-07'
    }
  ]);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'payment' | 'view'>('view');
  const [isRoleInfoOpen, setIsRoleInfoOpen] = useState(false);

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) {
      toast.error('Please fill in all fields');
      return;
    }

    const newUser: User = {
      id: String(users.length + 1),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      lastActive: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newUser]);
    toast.success('User has been added', {
      description: `Invitation email has been sent to ${newUserEmail}.`
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('view');
    setIsAddUserOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast.success('User has been deleted', {
      description: `${name}'s account has been removed.`
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Administrator</Badge>;
      case 'payment':
        return <Badge className="bg-blue-100 text-blue-800">Payment Access</Badge>;
      case 'view':
        return <Badge className="bg-gray-100 text-gray-800">View Only</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to all features and user management';
      case 'payment':
        return 'Can make payments and view records';
      case 'view':
        return 'Can only view records';
      default:
        return '';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date('2026-03-09'); // Mock current date
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Company Name</Label>
            <Input defaultValue="Global Freight Solutions" className="mt-2" />
          </div>
          <div>
            <Label>Tax ID / EIN</Label>
            <Input defaultValue="123-45-67890" className="mt-2" />
          </div>
          <div>
            <Label>Address</Label>
            <Input defaultValue="123 Business St, Los Angeles, CA 90001" className="mt-2" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input defaultValue="+1-800-123-4567" className="mt-2" />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline">Update Information</Button>
        </div>
      </Card>

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
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Access</p>
              <p className="text-3xl font-bold text-gray-900">
                {users.filter(u => u.role === 'payment' || u.role === 'admin').length}
              </p>
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
                  <div>
                    <p className="font-semibold text-gray-900">• Administrator</p>
                    <p className="text-sm text-gray-600 ml-4">{getRoleDescription('admin')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">• Payment Access</p>
                    <p className="text-sm text-gray-600 ml-4">{getRoleDescription('payment')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">• View Only</p>
                    <p className="text-sm text-gray-600 ml-4">{getRoleDescription('view')}</p>
                  </div>
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
                  <Label htmlFor="userName">Name</Label>
                  <Input
                    id="userName"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
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
                  <Label htmlFor="userRole">Role</Label>
                  <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator - Full Access</SelectItem>
                      <SelectItem value="payment">Payment Access - Payment & View</SelectItem>
                      <SelectItem value="view">View Only - Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Send Invitation Email
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
            <span>Last Active</span>
            <span className="text-center">Actions</span>
          </div>

          {/* User Items */}
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-gray-50 rounded-lg px-2 transition-colors"
            >
              <span className="font-semibold text-gray-900">{user.name}</span>
              <span className="text-gray-600 text-sm">{user.email}</span>
              <div>{getRoleBadge(user.role)}</div>
              <span className="text-sm text-gray-600 cursor-help" title={user.lastActive}>
                {getRelativeTime(user.lastActive)}
              </span>
              <div className="flex justify-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
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
