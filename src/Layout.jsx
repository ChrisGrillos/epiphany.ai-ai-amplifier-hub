import React from 'react';
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <style>{`
        :root {
          --background: 9 9 11;
          --foreground: 250 250 250;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgb(63 63 70);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(82 82 91);
        }
        
        /* Smooth animations */
        * {
          scroll-behavior: smooth;
        }
        
        /* Better focus states */
        *:focus-visible {
          outline: 2px solid rgb(139 92 246 / 0.5);
          outline-offset: 2px;
        }
      `}</style>
      
      {children}
      
      <Toaster 
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(24 24 27)',
            border: '1px solid rgb(39 39 42)',
            color: 'white',
          },
        }}
      />
    </div>
  );
}