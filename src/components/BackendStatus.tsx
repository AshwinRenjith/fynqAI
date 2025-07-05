
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export const BackendStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/v1/status', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
      setLastChecked(new Date());
    };

    // Check immediately
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm ${
          isOnline 
            ? 'bg-green-500/90 hover:bg-green-600/90' 
            : 'bg-red-500/90 hover:bg-red-600/90'
        }`}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </Badge>
    </div>
  );
};
