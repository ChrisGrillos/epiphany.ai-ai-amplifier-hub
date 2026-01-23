import React from 'react';
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <style>{`
        :root {
          --background: 20 14 35;
          --foreground: 250 250 250;
          --primary: 139 92 246;
          --accent-gold: 234 179 8;
          --accent-green: 34 197 94;
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
          background: rgb(109 40 217);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(139 92 246);
        }
        
        /* Smooth animations */
        * {
          scroll-behavior: smooth;
        }
        
        /* Better focus states */
        *:focus-visible {
          outline: 2px solid rgb(139 92 246 / 0.8);
          outline-offset: 2px;
        }
        
        /* Slider improvements */
        [role="slider"] {
          background: white !important;
          border: 2px solid rgb(139 92 246) !important;
          box-shadow: 0 0 8px rgb(139 92 246 / 0.5) !important;
        }
        
        [data-orientation="horizontal"] {
          background: rgb(30 20 50) !important;
        }
        
        [data-orientation="horizontal"] > span {
          background: rgb(139 92 246) !important;
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