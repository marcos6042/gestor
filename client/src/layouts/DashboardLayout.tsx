import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  FileText,
  Users,
  Briefcase,
  BarChart3,
  FolderOpen,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  CalendarDays,
  ShoppingBag,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { name: "Calendário", path: "/calendario", icon: <Calendar className="h-5 w-5 mr-3" /> },
    { name: "Calendário Competência", path: "/calendario-competencia", icon: <CalendarDays className="h-5 w-5 mr-3" /> },
    { name: "Tarefas", path: "/tarefas", icon: <ClipboardList className="h-5 w-5 mr-3" /> },
    { name: "Empresas", path: "/empresas", icon: <Building2 className="h-5 w-5 mr-3" /> },
    { name: "Fornecedores", path: "/fornecedores", icon: <ShoppingBag className="h-5 w-5 mr-3" /> },
    { name: "Contratos", path: "/contratos", icon: <FileText className="h-5 w-5 mr-3" /> },
    { name: "Usuários", path: "/usuarios", icon: <Users className="h-5 w-5 mr-3" /> },
    { name: "Departamentos", path: "/departamentos", icon: <Briefcase className="h-5 w-5 mr-3" /> },
    { name: "Relatórios", path: "/relatorios", icon: <BarChart3 className="h-5 w-5 mr-3" /> },
    { name: "Arquivos", path: "/arquivos", icon: <FolderOpen className="h-5 w-5 mr-3" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(part => part[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className={`hidden md:flex md:flex-shrink-0`}>
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-primary-600">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-white">GESTÃO DE TAREFAS</h1>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto">
            <ScrollArea className="flex-1">
              <div className="flex items-center px-4 py-3 my-6 mx-2 bg-gray-50 rounded-lg">
                <Avatar>
                  {user?.photo ? (
                    <AvatarImage src={user.photo} alt={user.name} />
                  ) : (
                    <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role === "admin" ? "Administrador" : 
                    user?.role === "manager" ? "Gestor" : 
                    user?.role === "employee" ? "Colaborador" : "Cliente"}</p>
                </div>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md group ${
                        location === item.path 
                          ? "text-white bg-primary-500" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </ScrollArea>
          </div>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-primary-600">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-white">GESTÃO DE TAREFAS</h1>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto">
            <ScrollArea className="flex-1">
              <div className="flex items-center px-4 py-3 my-6 mx-2 bg-gray-50 rounded-lg">
                <Avatar>
                  {user?.photo ? (
                    <AvatarImage src={user.photo} alt={user.name} />
                  ) : (
                    <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role === "admin" ? "Administrador" : 
                    user?.role === "manager" ? "Gestor" : 
                    user?.role === "employee" ? "Colaborador" : "Cliente"}</p>
                </div>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a 
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md group ${
                        location === item.path 
                          ? "text-white bg-primary-500" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </ScrollArea>
          </div>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between flex-shrink-0 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center px-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6 text-gray-500" />
            </Button>
            <div className="flex items-center ml-2">
              <h1 className="text-lg font-semibold text-gray-800">GESTÃO DE TAREFAS</h1>
            </div>
          </div>

          <div className="flex items-center pr-4">
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    <Bell className="h-5 w-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-2 px-4 text-sm text-center text-gray-500">
                    Sem notificações no momento
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="ml-4 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center text-sm rounded-full focus:outline-none">
                    <Avatar className="h-8 w-8">
                      {user?.photo ? (
                        <AvatarImage src={user.photo} alt={user.name} />
                      ) : (
                        <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">{user?.name}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}