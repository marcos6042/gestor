import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/layouts/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import TasksTable from "@/components/dashboard/TasksTable";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import PendingTasksWidget from "@/components/dashboard/PendingTasksWidget";
import ContractsTable from "@/components/dashboard/ContractsTable";
import { 
  ClipboardList, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import TaskForm from "@/components/forms/TaskForm";
import ContractForm from "@/components/forms/ContractForm";
import { useState } from "react";

export default function DashboardPage() {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newContractOpen, setNewContractOpen] = useState(false);

  // Fetch overview stats
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["/api/tasks/due-today"],
  });

  const { data: overdueTasks } = useQuery({
    queryKey: ["/api/tasks/overdue"],
  });

  // Calculate stats
  const pendingTasks = tasks?.filter(task => 
    task.status !== 'completed'
  )?.length || 0;
  
  const todayObligations = todayTasks?.length || 0;
  
  const upcomingDeadlines = tasks?.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return (
      task.status !== 'completed' && 
      dueDate > today && 
      dueDate <= sevenDaysFromNow
    );
  })?.length || 0;
  
  const overdueTasksCount = overdueTasks?.length || 0;

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="px-4 sm:px-6 md:px-8">
          {/* Overview Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Tarefas Pendentes"
              value={pendingTasks}
              icon={<ClipboardList className="h-5 w-5" />}
              iconBgColor="bg-primary-100"
              iconColor="text-primary-600"
              linkText="Ver todas"
              linkHref="/tarefas"
            />
            
            <StatCard
              title="Obrigações para Hoje"
              value={todayObligations}
              icon={<FileText className="h-5 w-5" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
              linkText="Ver detalhes"
              linkHref="/tarefas?status=due-today"
            />
            
            <StatCard
              title="Próximos Vencimentos"
              value={upcomingDeadlines}
              icon={<Clock className="h-5 w-5" />}
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
              linkText="Ver calendário"
              linkHref="/calendario"
            />
            
            <StatCard
              title="Tarefas Atrasadas"
              value={overdueTasksCount}
              icon={<AlertTriangle className="h-5 w-5" />}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
              linkText="Ver detalhes"
              linkHref="/tarefas?status=overdue"
            />
          </div>
          
          {/* Recent Tasks Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Tarefas Recentes</h2>
              <Sheet open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <SheetTrigger asChild>
                  <Button className="text-sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Tarefa
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Nova Tarefa</SheetTitle>
                  </SheetHeader>
                  <TaskForm onSuccess={() => setNewTaskOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="mt-4">
              <TasksTable limit={3} />
            </div>
            
            <div className="mt-4 text-right">
              <Link href="/tarefas" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                Ver todas as tarefas →
              </Link>
            </div>
          </div>
          
          {/* Calendar & Pending Tasks */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CalendarWidget />
            </div>
            
            <div>
              <PendingTasksWidget />
            </div>
          </div>
          
          {/* Recent Contracts Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Contratos Recentes</h2>
              <Sheet open={newContractOpen} onOpenChange={setNewContractOpen}>
                <SheetTrigger asChild>
                  <Button className="text-sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Contrato
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Novo Contrato</SheetTitle>
                  </SheetHeader>
                  <ContractForm onSuccess={() => setNewContractOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
            
            <ContractsTable limit={2} />
            
            <div className="mt-4 text-right">
              <Link href="/contratos" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                Ver todos os contratos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
