
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
  MessageSquare,
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
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Utilizadores',
    url: '/users',
    icon: Users,
    roles: ['ADMIN'],
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
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Disciplinas',
    url: '/subjects',
    icon: BookOpen,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Turmas',
    url: '/classes',
    icon: GraduationCap,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
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
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
  },
  {
    title: 'Boletins',
    url: '/reports',
    icon: FileCheck,
    roles: ['ADMIN', 'SECRETARIA', 'PROFESSOR'],
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
    title: 'Comunicação',
    url: '/communication',
    icon: MessageSquare,
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
    roles: ['ADMIN', 'SECRETARIA'],
  },
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
    roles: ['ADMIN'],
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
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">Synexa-SIS</h2>
                <p className="text-xs text-sidebar-foreground/60">{user?.role}</p>
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
