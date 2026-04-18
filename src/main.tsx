import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/AuthProvider';
import './index.css';

// Global error handler for DOM issues
window.addEventListener('error', (event) => {
  console.error('Global DOM Error:', event.error, event.message);
  console.trace('Stack trace:');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
<StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
