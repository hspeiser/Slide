import React from 'react';
import ReactDOM from 'react-dom/client';

// Basic placeholder component
function MiniCalculator() {
  const handleOpenMain = () => {
    // Check if the API is exposed by preload
    if (window.miniApi && typeof window.miniApi.send === 'function') {
      window.miniApi.send('open-main-app');
    } else {
      console.error("Mini API not found. Ensure preload script is working.");
    }
  };

  return (
    <div>
      <p>Mini Calculator UI</p>
      {/* TODO: Add input, output, logic */}
      <button onClick={handleOpenMain} style={{ marginTop: '10px' }}>
        Open Full App
      </button>
    </div>
  );
}

// Add type declaration for the mini API
declare global {
  interface Window {
    miniApi?: {
      send: (channel: string, ...args: any[]) => void;
    }
  }
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MiniCalculator />
  </React.StrictMode>,
);