import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import TaskForm from "@/components/forms/TaskForm";
import { Eye, PenSquare, CheckSquare, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TasksTableProps {
  limit?: number;
  companyId?: number;
  departmentId?: number;
  responsibleId?: number;
  status?: string;
}

export default function TasksTable({
  limit,
  companyId,
  departmentId,
  responsibleId,
  status,
}: TasksTableProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [viewTaskOpen, setViewTaskOpen] = useState(false);

  let queryUrl = "/api/tasks";
  const queryParams = [];
  
  if (companyId) queryParams.push(`companyId=${companyId}`);
  if (departmentId) queryParams.push(`departmentId=${departmentId}`);
  if (responsibleId) queryParams.push(`responsibleId=${responsibleId}`);
  if (status) queryParams.push(`status=${status}`);
  
  if (queryParams.length > 0) {
    queryUrl += `?${queryParams.join("&")}`;
  }

  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: [queryUrl],
  });

  // Get task status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pendente", className: "bg-yellow-100 text-yellow-800" };
      case "in_progress":
        return { label: "Em andamento", className: "bg-blue-100 text-blue-800" };
      case "completed":
        return { label: "Finalizado", className: "bg-green-100 text-green-800" };
      case "client_pending":
        return { label: "Pendente do cliente", className: "bg-purple-100 text-purple-800" };
      case "overdue":
        return { label: "Atrasado", className: "bg-red-100 text-red-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(part => part[0]).join("").substring(0, 2).toUpperCase();
  };

  // Handle view task
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewTaskOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskFormOpen(true);
  };

  // Handle complete task
  const handleCompleteTask = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
        credentials: "include",
      });
      
      // Invalidate and refetch
      window.location.reload();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden shadow border-b border-gray-200 sm:rounded-lg">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          {[...Array(limit || 3)].map((_, index) => (
            <div key={index} className="bg-white divide-y divide-gray-200">
              <div className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Erro ao carregar tarefas. Por favor, tente novamente.</span>
        </div>
      </div>
    );
  }

  // Limit results if limit is provided
  const displayTasks = limit ? tasks.slice(0, limit) : tasks;

  return (
    <>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Tarefa</TableHead>
                    <TableHead className="font-medium">Empresa</TableHead>
                    <TableHead className="font-medium">Vencimento</TableHead>
                    <TableHead className="font-medium">Responsável</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTasks.map((task) => {
                    const statusDisplay = getStatusDisplay(task.status);
                    return (
                      <TableRow key={task.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            {task.departmentId ? `Dept: ${task.departmentId}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {task.companyId ? `ID: ${task.companyId}` : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm font-medium ${task.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                            {format(new Date(task.dueDate), "dd/MM/yyyy")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {`${task.competenceMonth}/${task.competenceYear}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {task.responsibleId ? `${task.responsibleId}` : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-2 text-sm text-gray-900">
                              {task.responsibleId ? `ID: ${task.responsibleId}` : "Não atribuído"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusDisplay.className}>
                            {statusDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewTask(task)}
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditTask(task)}
                            >
                              <PenSquare className="h-4 w-4 text-primary-500" />
                            </Button>
                            {task.status !== 'completed' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                <CheckSquare className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Task edit form */}
      <Sheet open={taskFormOpen} onOpenChange={setTaskFormOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Editar Tarefa</SheetTitle>
          </SheetHeader>
          {selectedTask && (
            <TaskForm 
              taskId={selectedTask.id} 
              onSuccess={() => {
                setTaskFormOpen(false);
                window.location.reload();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Task view sheet */}
      <Sheet open={viewTaskOpen} onOpenChange={setViewTaskOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Detalhes da Tarefa</SheetTitle>
          </SheetHeader>
          {selectedTask && (
            <div className="py-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Título</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedTask.title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedTask.description || "Sem descrição"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Vencimento</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedTask.dueDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Competência</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {`${selectedTask.competenceMonth}/${selectedTask.competenceYear}`}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${getStatusDisplay(selectedTask.status).className}`}
                    >
                      {getStatusDisplay(selectedTask.status).label}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Recorrência</h3>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTask.recurrence}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Empresa</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTask.companyId ? `ID: ${selectedTask.companyId}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departamento</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTask.departmentId ? `ID: ${selectedTask.departmentId}` : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Criado em</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedTask.created), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Última atualização</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedTask.updated), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Button 
                  onClick={() => {
                    setViewTaskOpen(false);
                    handleEditTask(selectedTask);
                  }}
                >
                  Editar Tarefa
                </Button>
                {selectedTask.status !== 'completed' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleCompleteTask(selectedTask.id);
                      setViewTaskOpen(false);
                    }}
                  >
                    Marcar como Concluída
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
