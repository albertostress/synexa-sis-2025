import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Teachers from "./pages/admin/Teachers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="synexa-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <Users />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Placeholder routes for future implementation */}
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Teachers />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/subjects" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Disciplinas</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/classes" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Turmas</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/enrollments" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Matrículas</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/grades" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Notas</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Boletins</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Documentos</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Presenças</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/communication" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Comunicação</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/financial" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Financeiro</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Biblioteca</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/transport" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Transporte</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Eventos</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Relatórios</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><div className="text-center py-8"><h2 className="text-2xl font-bold">Configurações</h2><p className="text-muted-foreground">Em desenvolvimento</p></div></DashboardLayout></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
