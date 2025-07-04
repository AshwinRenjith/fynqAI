
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isVisible, setIsVisible] = useState(false);

  const checkBackendStatus = async () => {
    setStatus('checking');
    try {
      const response = await fetch('http://localhost:8000/', {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        setStatus('online');
        setIsVisible(false); // Hide when online
      } else {
        setStatus('offline');
        setIsVisible(true);
      }
    } catch (error) {
      setStatus('offline');
      setIsVisible(true);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-amber-50 border-amber-200 z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-amber-800">Backend Offline</h4>
          <p className="text-sm text-amber-700 mt-1">
            Your FastAPI backend is not running. Start it with:
          </p>
          <code className="text-xs bg-amber-100 px-2 py-1 rounded mt-2 block">
            cd backend && python -m uvicorn main:app --reload
          </code>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-amber-600">
              Currently using offline mode
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={checkBackendStatus}
              disabled={status === 'checking'}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {status === 'checking' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
