'use client';

import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function DashboardHeader() {
  const { business, signOut } = useAuth();

  const currentDate = new Date();
  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {greeting()}, {business?.contact_name || business?.name || 'Usuário'}!
        </h2>
        <p className="text-muted-foreground">
          {business?.name ? `${business.name} • ` : ''}
          {formatDate(currentDate)}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon">
          <User className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={signOut}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}