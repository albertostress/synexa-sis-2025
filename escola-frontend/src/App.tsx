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
import Students from "./pages/students";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Enrollments from "./pages/Enrollments";
import Grades from "./pages/Grades";
import Reports from "./pages/Reports";
import Documents from "./pages/Documents";
import Attendance from "./pages/Attendance";
import Financial from "./pages/Financial";
import Library from "./pages/Library";
import Transport from "./pages/Transport";
import Events from "./pages/Events";
import Analytics from "./pages/Analytics";
import SettingsIntegrated from "./pages/SettingsIntegrated";
import CalendarTest from "./pages/CalendarTest";
import CalendarTestSimple from "./pages/CalendarTestSimple";
import GradeDemo from "./pages/GradeDemo";
import GradeTest from "./pages/GradeTest";
import StudentFinancialHistory from "./pages/StudentFinancialHistory";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="synexa-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Protected Routes */}
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
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Students />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
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
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Subjects />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Classes />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enrollments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Enrollments />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grades"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Grades />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Reports />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Documents />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Attendance />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financial"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Financial />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance/student/:studentId/history"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <StudentFinancialHistory />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Library />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transport"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SECRETARIA']}>
                    <DashboardLayout>
                      <Transport />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Events />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <Analytics />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <SettingsIntegrated />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Calendar Test Page - For Development/Demo */}
              <Route
                path="/calendar-test"
                element={
                  <ProtectedRoute>
                    <CalendarTest />
                  </ProtectedRoute>
                }
              />
              
              {/* Calendar Test Simple - Without DashboardLayout */}
              <Route
                path="/calendar-test-simple"
                element={<CalendarTestSimple />}
              />
              <Route
                path="/grade-demo"
                element={<GradeDemo />}
              />
              <Route
                path="/grade-test"
                element={<GradeTest />}
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
