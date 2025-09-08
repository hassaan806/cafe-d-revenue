import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState(''); // Empty for manual entry
  const [password, setPassword] = useState(''); // Empty for manual entry
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'Invalid username or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img 
              src="/logo.svg" 
              alt="Cafe D Revenue Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg hover:bg-slate-600 focus:ring-4 focus:ring-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>


      </div>
    </div>
  );
}