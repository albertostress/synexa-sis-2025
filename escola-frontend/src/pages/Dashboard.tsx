import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { SecretariaDashboard } from '@/components/dashboards/SecretariaDashboard';
import { ProfessorDashboard } from '@/components/dashboards/ProfessorDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SECRETARIA':
      return <SecretariaDashboard />;
    case 'PROFESSOR':
      return <ProfessorDashboard />;
    default:
      return (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      );
  }
}