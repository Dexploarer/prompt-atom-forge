'use client';

import { CLIAuth } from '@/components/CLIAuth';
import { useSearchParams } from 'react-router-dom';
import { Suspense } from 'react';

function CLIAuthPageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams[0].get('mode') as 'login' | 'register' | 'both' || 'both';
  const cliMode = searchParams[0].get('cli') === 'true';

  const handleSuccess = (user: any) => {
    // Notify CLI of successful authentication
    if (window.opener) {
      window.opener.postMessage({
        type: 'AUTH_SUCCESS',
        user,
        timestamp: Date.now()
      }, '*');
      
      // Close window after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'AUTH_CANCELLED',
        timestamp: Date.now()
      }, '*');
    }
    window.close();
  };

  return (
    <CLIAuth 
      mode={mode}
      onSuccess={handleSuccess}
      onClose={handleClose}
      cliMode={cliMode}
    />
  );
}

export default function CLIAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Loading authentication portal...</div>
      </div>
    }>
      <CLIAuthPageContent />
    </Suspense>
  );
}