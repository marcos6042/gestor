import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CompaniesPage from "@/pages/companies-page";
import UsersPage from "@/pages/users-page";
import DepartmentsPage from "@/pages/departments-page";
import TasksPage from "@/pages/tasks-page";
import ContractsPage from "@/pages/contracts-page";
import CalendarPage from "@/pages/calendar-page";
import CompetenceCalendarPage from "@/pages/competence-calendar-page";
import ReportsPage from "@/pages/reports-page";
import FilesPage from "@/pages/files-page";
import SuppliersPage from "@/pages/suppliers-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/empresas" component={CompaniesPage} />
      <ProtectedRoute path="/usuarios" component={UsersPage} />
      <ProtectedRoute path="/departamentos" component={DepartmentsPage} />
      <ProtectedRoute path="/tarefas" component={TasksPage} />
      <ProtectedRoute path="/contratos" component={ContractsPage} />
      <ProtectedRoute path="/calendario" component={CalendarPage} />
      <ProtectedRoute path="/calendario-competencia" component={CompetenceCalendarPage} />
      <ProtectedRoute path="/relatorios" component={ReportsPage} />
      <ProtectedRoute path="/arquivos" component={FilesPage} />
      <ProtectedRoute path="/fornecedores" component={SuppliersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
