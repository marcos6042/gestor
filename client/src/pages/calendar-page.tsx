import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Task } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { format, getMonth, getYear, isSameDay, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import TaskForm from "@/components/forms/TaskForm";
import { Plus, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const month = getMonth(date);
  const year = getYear(date);
  
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);
  
  // Format dates for API query
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");
  
  // Fetch tasks for calendar
  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: [`/api/tasks?startDate=${startDateStr}&endDate=${endDateStr}`],
  });
  
  // Group tasks by date
  const tasksByDate = tasks?.reduce<Record<string, Task[]>>((acc, task) => {
    try {
      const dateStr = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(task);
    } catch (error) {
      console.error("Erro ao processar data da tarefa:", task.dueDate);
    }
    return acc;
  }, {}) || {};
  
  // Previous month
  const handlePrevMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    setDate(prevMonth);
  };
  
  // Next month
  const handleNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    setDate(nextMonth);
  };
  
  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "client_pending":
        return "bg-purple-100 text-purple-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
  };
  
  // Get tasks for selected date
  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return tasksByDate[dateStr] || [];
    } catch (error) {
      console.error("Erro ao obter tarefas para data selecionada:", error);
      return [];
    }
  };
  
  // Filter tasks by type
  const getFilteredTasks = () => {
    const tasksForDate = getTasksForSelectedDate();
    if (!selectedType) return tasksForDate;
    return tasksForDate.filter(task => task.status === selectedType);
  };
  
  // Custom day render function
  const renderDay = (props: any) => {
    try {
      // Verificar se temos uma propriedade date (biblioteca react-day-picker)
      const day = props && props.date ? props.date : props;
      
      if (!day || typeof day.getDate !== 'function') {
        return <div className="w-full h-full min-h-10 p-1">{props?.children}</div>;
      }
      
      const dateStr = format(day, "yyyy-MM-dd");
      const dayTasks = tasksByDate[dateStr] || [];
      const isToday = isSameDay(day, new Date());
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      
      return (
        <div 
          className={`w-full h-full min-h-14 p-1 relative
            ${isToday ? "bg-primary-50" : ""}
            ${isSelected ? "bg-primary-100 ring-2 ring-primary-500" : ""}
          `}
        >
          <span className={`text-xs ${isToday ? "font-medium text-primary-800" : ""}`}>
            {format(day, "d")}
          </span>
          
          {dayTasks.length > 0 && (
            <div className="mt-1 overflow-y-auto max-h-20 space-y-1">
              {dayTasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className={`px-1 py-0.5 text-xs rounded truncate cursor-pointer hover:bg-gray-50 ${getStatusColor(task.status)}`}
                  title={task.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(day);
                    setIsTaskDetailOpen(true);
                  }}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-xs text-center text-gray-500">
                  +{dayTasks.length - 3} mais
                </div>
              )}
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Erro ao renderizar dia:", error);
      return <div className="w-full h-full min-h-10 p-1"></div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Calendário</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualize e gerencie tarefas e obrigações no calendário.
          </p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Calendário de Obrigações</h2>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handlePrevMonth} 
                        className="hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-500" />
                      </Button>
                      <span className="mx-2 text-sm font-medium">
                        {format(date, "MMMM yyyy", { locale: ptBR })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleNextMonth} 
                        className="hover:bg-gray-100"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="p-6">
                    <Skeleton className="h-96 w-full" />
                  </div>
                ) : isError ? (
                  <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar calendário</h3>
                      <p className="text-sm text-gray-500">
                        Não foi possível carregar os eventos do calendário. Tente novamente mais tarde.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      locale={ptBR}
                      showOutsideDays
                      fixedWeeks
                      ISOWeek
                      className="rounded-none p-0"
                      components={{ Day: renderDay }}
                      classNames={{
                        day_today: "bg-primary-50",
                        day_selected: "bg-primary-100"
                      }}
                    />
                  </div>
                )}
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="bg-white shadow rounded-lg overflow-hidden h-full">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedDate 
                        ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Tarefas do Dia"
                      }
                    </h2>
                    <Sheet open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                      <SheetTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Nova Tarefa
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="sm:max-w-md">
                        <SheetHeader>
                          <SheetTitle>Nova Tarefa</SheetTitle>
                        </SheetHeader>
                        <TaskForm 
                          onSuccess={() => setIsNewTaskOpen(false)}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  {selectedDate && (
                    <div className="mt-2">
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                          <SelectItem value="in_progress">Em andamento</SelectItem>
                          <SelectItem value="completed">Concluídas</SelectItem>
                          <SelectItem value="client_pending">Pendentes do cliente</SelectItem>
                          <SelectItem value="overdue">Atrasadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-0">
                  {!selectedDate ? (
                    <div className="p-6 text-center text-gray-500">
                      Selecione uma data no calendário para ver as tarefas
                    </div>
                  ) : getFilteredTasks().length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Não há tarefas para esta data
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {getFilteredTasks().map((task) => (
                        <li key={task.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                              <div className="mt-1 text-xs text-gray-500">
                                {task.description && (
                                  <p className="line-clamp-2">{task.description}</p>
                                )}
                                <p className="mt-1">
                                  Competência: {task.competenceMonth}/{task.competenceYear}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(task.status)}
                            >
                              {task.status === "pending" ? "Pendente" :
                               task.status === "in_progress" ? "Em andamento" :
                               task.status === "completed" ? "Concluída" :
                               task.status === "client_pending" ? "Pendente cliente" :
                               task.status === "overdue" ? "Atrasada" :
                               task.status}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span>
                              {task.responsibleId ? `Responsável: ID ${task.responsibleId}` : "Sem responsável"}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              {task.companyId ? `Empresa: ID ${task.companyId}` : "Sem empresa"}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                // Navegar para detalhes da tarefa ou abrir modal de edição
                              }}
                            >
                              Ver detalhes
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}