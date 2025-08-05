
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  Calendar,
  FileCheck,
  DollarSign,
  Library,
  Bus,
  CalendarDays,
  Settings,
  UserCheck,
  BarChart3,
  UsersRound
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'DIRETOR'],
  },
  {
    title: 'Alunos',
    url: '/students',
    icon: UsersRound,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Professores',
    url: '/teachers',
    icon: UserCheck,
    roles: ['ADMIN', 'DIRETOR'],
  },
  {
    title: 'Disciplinas',
    url: '/subjects',
    icon: BookOpen,
    roles: ['ADMIN', 'DIRETOR'],
  },
  {
    title: 'Turmas',
    url: '/classes',
    icon: GraduationCap,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Matrículas',
    url: '/enrollments',
    icon: ClipboardList,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Notas',
    url: '/grades',
    icon: FileText,
    roles: ['ADMIN', 'DIRETOR', 'PROFESSOR'],
  },
  {
    title: 'Boletins',
    url: '/reports',
    icon: FileCheck,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Documentos',
    url: '/documents',
    icon: FileText,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Presenças',
    url: '/attendance',
    icon: Calendar,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Financeiro',
    url: '/financial',
    icon: DollarSign,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Biblioteca',
    url: '/library',
    icon: Library,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Transporte',
    url: '/transport',
    icon: Bus,
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Eventos',
    url: '/events',
    icon: CalendarDays,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Relatórios',
    url: '/analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'DIRETOR'],
  },
  {
    title: 'Utilizadores',
    url: '/users',
    icon: Users,
    roles: ['ADMIN', 'DIRETOR'],
  },
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
    roles: ['ADMIN', 'DIRETOR'],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, hasAnyRole } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const filteredItems = navigationItems.filter(item => 
    user && hasAnyRole(item.roles)
  );

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img 
              src="/synexa-icon.png" 
              alt="Synexa" 
              className="w-8 h-8 object-contain"
            />
            {!collapsed && (
              <div className="flex-1">
                <img 
                  src="/Synexa-logo.png" 
                  alt="Synexa-SIS" 
                  className="h-8 object-contain"
                />
                <p className="text-xs text-sidebar-foreground/60 mt-1">{user?.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="mb-3">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
