import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User as UserType } from '@shared/schema';

interface UserSelectionProps {
  currentUser: UserType;
  onSelectUser: (user: UserType) => void;
  onLogout: () => void;
}

export default function UserSelection({ currentUser, onSelectUser, onLogout }: UserSelectionProps) {
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  // Filter out current user from the list
  const availableUsers = users.filter(user => user.id !== currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Welcome, {currentUser.username}!</h1>
              <p className="text-gray-600 text-sm">Select someone to chat with</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Start a Conversation
            </CardTitle>
            <CardDescription>
              Choose a user to start chatting with them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No other users available to chat with</p>
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="text-white" size={16} />
                        </div>
                        <div>
                          <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                            {user.username}
                          </h3>
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Online
                          </p>
                        </div>
                      </div>
                      <MessageCircle className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}