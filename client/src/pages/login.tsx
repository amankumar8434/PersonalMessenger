import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User as UserType } from '@shared/schema';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const handleLogin = () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      setError('User not found');
      return;
    }

    if (password !== user.password) {
      setError('Invalid password');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            Login to Chat
          </CardTitle>
          <CardDescription>
            Select your user account to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User:</label>
            <div className="grid gap-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedUserId === user.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="text-white" size={14} />
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password:</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <Button 
            onClick={handleLogin}
            className="w-full"
            disabled={!selectedUserId || !password}
          >
            Login
          </Button>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Demo passwords: All users use their display password
          </div>
        </CardContent>
      </Card>
    </div>
  );
}