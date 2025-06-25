import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Sentry before rendering the app
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(), // NEW: use this instead of new BrowserTracing()
    // Sentry.replayIntegration(), // Optional: for session replay
  ],
  tracesSampleRate: 1.0, // Adjust in production
  // replaysSessionSampleRate: 0.1, // Optional: for session replay
  // replaysOnErrorSampleRate: 1.0, // Optional: for session replay
});

createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
    <App />
  </Sentry.ErrorBoundary>
);
