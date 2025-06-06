import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from '@/hooks/use-auth';
import { CommandTerminalProvider } from '@/hooks/use-command-terminal';
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Docs from "./pages/Docs";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import TerminalWrapper from "./components/TerminalWrapper";
import ProjectEditor from "./pages/ProjectEditor";
import CLIAuthPage from "./app/cli-auth/page";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="prompt-or-die-theme">
      <AuthProvider>
        <CommandTerminalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <TerminalWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/cli-auth" element={<CLIAuthPage />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/new" element={
                    <ProtectedRoute>
                      <ProjectEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/:projectId" element={
                    <ProtectedRoute>
                      <ProjectEditor />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TerminalWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </CommandTerminalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;