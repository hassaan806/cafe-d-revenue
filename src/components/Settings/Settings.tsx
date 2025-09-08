import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { userService, UserResponse } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { SMSSettings } from './SMSSettings';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCheck,
  UserX,
  Search,
  Shield,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';

// Helper function to convert API user to app user
const convertApiUserToAppUser = (apiUser: UserResponse): User => ({
  id: apiUser.id.toString(),
  username: apiUser.username,
  role: apiUser.role as UserRole,
  name: apiUser.username, // Use username as name since API doesn't provide name
  email: apiUser.email,
  phone: undefined, // API doesn't provide phone
  isActive: apiUser.is_active,
  createdAt: new Date(apiUser.created_at)
});

export function Settings() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'sms'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'salesman' as UserRole,
    password: '',
    confirmPassword: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUsers = await userService.getUsers();
        const appUsers = apiUsers.map(convertApiUserToAppUser);
        setUsers(appUsers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      setError('Password must be at least 6 characters long!');
      return;
    }

    try {
      setError(null);
      
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        const updatedUser = await userService.updateUser(parseInt(editingUser.id), updateData);
        const appUser = convertApiUserToAppUser(updatedUser);
        
        setUsers(users.map(u => u.id === editingUser.id ? appUser : u));
        setEditingUser(null);
      } else {
        // Create new user
        const newUser = await userService.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        
        const appUser = convertApiUserToAppUser(newUser);
        setUsers([...users, appUser]);
      }
      
      setFormData({ 
        username: '', 
        email: '', 
        role: 'salesman', 
        password: '', 
        confirmPassword: '' 
      });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
      console.error('Error in handleSubmit:', err);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await userService.deleteUser(parseInt(userId));
        setUsers(users.filter(u => u.id !== userId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      setError(null);
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const updatedUser = await userService.updateUser(parseInt(userId), {
        is_active: !user.isActive
      });
      
      const appUser = convertApiUserToAppUser(updatedUser);
      setUsers(users.map(u => u.id === userId ? appUser : u));
    } catch (err: any) {
      setError(err.message || 'Failed to update user status. Please try again.');
      console.error('Error updating user status:', err);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'salesman': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield size={16} />;
      case 'manager': return <Users size={16} />;
      case 'salesman': return <UserCheck size={16} />;
      default: return <UserCheck size={16} />;
    }
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-400 mr-2" size={20} />
            <p className="text-red-800">Access denied. Only administrators can manage users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Manage system users and configurations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'sms'
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS Settings</span>
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-400 mr-2" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'users' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="salesman">Salesman</option>
              </select>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingUser(null);
                setFormData({ 
                  username: '', 
                  email: '', 
                  role: 'salesman', 
                  password: '', 
                  confirmPassword: '' 
                });
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Add User</span>
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="salesman">Salesman</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingUser ? 'Confirm New Password' : 'Confirm Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
                  </form>
                </div>
                <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-amber-600" size={32} />
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email && (
                              <div className="flex items-center space-x-1">
                                <Mail size={14} className="text-gray-400" />
                                <span>{user.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                            <span className="ml-1">{user.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-amber-600 hover:text-amber-900"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <SMSSettings />
      )}
    </div>
  );
}