import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';

import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import GeneratedPDFs from './pages/GeneratedPDFs';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import TemplateGenerator from './pages/TemplateGenerator';
import Templates from './pages/Templates';
import UserGuide from './pages/UserGuide';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/">
              <Index />
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/templates">
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            </Route>
            <Route path="/generated-pdfs">
              <ProtectedRoute>
                <GeneratedPDFs />
              </ProtectedRoute>
            </Route>
            <Route path="/user-guide">
              <ProtectedRoute>
                <UserGuide />
              </ProtectedRoute>
            </Route>
            <Route path="/analytics">
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            </Route>
            <Route path="/activity">
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            </Route>
            <Route path="/templates/:templateId/generate">
              <ProtectedRoute>
                <TemplateGenerator />
              </ProtectedRoute>
            </Route>
            <Route path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
