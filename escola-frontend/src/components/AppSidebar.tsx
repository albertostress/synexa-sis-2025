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
  LogOut,
  UserCheck,
  BarChart3
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
import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const filteredItems = navigationItems.filter(item => 
    user && hasAnyRole(item.roles)
  );

  const getNavClass = (isActive: boolean) => 
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
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
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive)}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info & Logout */}
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
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}