import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import UserSelection from "@/pages/user-selection";
import Chat from "@/pages/chat";
import type { User } from "@shared/schema";

type AppState = 
  | { screen: 'login' }
  | { screen: 'user-selection'; currentUser: User }
  | { screen: 'chat'; currentUser: User; chatPartner: User };

function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'login' });

  const handleLogin = (user: User) => {
    setAppState({ screen: 'user-selection', currentUser: user });
  };

  const handleSelectUser = (chatPartner: User) => {
    if (appState.screen === 'user-selection') {
      setAppState({ 
        screen: 'chat', 
        currentUser: appState.currentUser, 
        chatPartner 
      });
    }
  };

  const handleBack = () => {
    if (appState.screen === 'chat') {
      setAppState({ 
        screen: 'user-selection', 
        currentUser: appState.currentUser 
      });
    }
  };

  const handleLogout = () => {
    setAppState({ screen: 'login' });
  };

  const renderScreen = () => {
    switch (appState.screen) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      
      case 'user-selection':
        return (
          <UserSelection 
            currentUser={appState.currentUser}
            onSelectUser={handleSelectUser}
            onLogout={handleLogout}
          />
        );
      
      case 'chat':
        return (
          <Chat
            currentUser={appState.currentUser}
            chatPartner={appState.chatPartner}
            onBack={handleBack}
          />
        );
      
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {renderScreen()}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
