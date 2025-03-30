import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Task, User, Company, Department } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { format, getMonth, getYear, isSameDay, startOfMonth, endOfMonth, parseISO, addMonths, subMonths, isWithinInterval, isSameMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import TaskForm from "@/components/forms/TaskForm";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Calendar as CalendarIcon,
  Briefcase,
  CheckSquare,
  ClipboardList,
  Users,
  Calendar as CalendarDate
} from "lucide-react";
import TasksTable from "@/components/dashboard/TasksTable";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CompetenceCalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState("calendar");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    companyId?: number;
    departmentId?: number;
    responsibleId?: number;
    status?: string;
  }>({});

  const month = getMonth(date);
  const year = getYear(date);
  
  // Define dates for queries
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");
  
  // Fetch tasks for calendar
  const { data: tasks, isLoading: isTasksLoading, isError: isTasksError } = useQuery<Task[]>({
    queryKey: [`/api/tasks?startDate=${startDateStr}&endDate=${endDateStr}`],
  });
  
  // Fetch companies for filter
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });
  
  // Fetch departments for filter
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Fetch users for filter
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Group tasks by date for calendar view
  const tasksByDate = tasks?.reduce<Record<string, Task[]>>((acc, task) => {
    const dateStr = format(new Date(task.dueDate), "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(task);
    return acc;
  }, {}) || {};

  // Group tasks by competence period for competence view
  const tasksByCompetence = tasks?.reduce<Record<string, Task[]>>((acc, task) => {
    const competenceKey = `${task.competenceMonth}-${task.competenceYear}`;
    if (!acc[competenceKey]) {
      acc[competenceKey] = [];
    }
    acc[competenceKey].push(task);
    return acc;
  }, {}) || {};

  // Sort competence periods chronologically
  const sortedCompetencePeriods = Object.keys(tasksByCompetence).sort((a, b) => {
    const [monthA, yearA] = a.split('-').map(Number);
    const [monthB, yearB] = b.split('-').map(Number);
    
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });
  
  // Previous month
  const handlePrevMonth = () => {
    const prevMonth = subMonths(date, 1);
    setDate(prevMonth);
  };
  
  // Next month
  const handleNextMonth = () => {
    const nextMonth = addMonths(date, 1);
    setDate(nextMonth);
  };
  
  // Get status color
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
  
  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "in_progress":
        return "Em andamento";
      case "completed":
        return "Concluído";
      case "client_pending":
        return "Pendente do cliente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
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

  // Apply filters to tasks list
  const getFilteredTasks = (tasksList: Task[]) => {
    let filtered = [...tasksList];
    
    if (selectedFilters.companyId) {
      filtered = filtered.filter(task => task.companyId === selectedFilters.companyId);
    }
    
    if (selectedFilters.departmentId) {
      filtered = filtered.filter(task => task.departmentId === selectedFilters.departmentId);
    }
    
    if (selectedFilters.responsibleId) {
      filtered = filtered.filter(task => task.responsibleId === selectedFilters.responsibleId);
    }
    
    if (selectedFilters.status) {
      filtered = filtered.filter(task => task.status === selectedFilters.status);
    }
    
    return filtered;
  };
  
  // Handle filter changes
  const handleFilterChange = (type: 'company' | 'department' | 'responsible' | 'status', value: string) => {
    if (type === 'company') {
      setSelectedFilters(prev => ({
        ...prev,
        companyId: value ? Number(value) : undefined
      }));
    } else if (type === 'department') {
      setSelectedFilters(prev => ({
        ...prev,
        departmentId: value ? Number(value) : undefined
      }));
    } else if (type === 'responsible') {
      setSelectedFilters(prev => ({
        ...prev,
        responsibleId: value ? Number(value) : undefined
      }));
    } else if (type === 'status') {
      setSelectedFilters(prev => ({
        ...prev,
        status: value || undefined
      }));
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({});
  };
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(v => v !== undefined);
  
  // Get month name in Portuguese
  const getMonthName = (monthNumber: number) => {
    const date = new Date(2000, monthNumber - 1, 1);
    return format(date, 'MMMM', { locale: ptBR });
  };
  
  // Find user name by ID
  const getUserById = (userId: number | undefined) => {
    if (!userId || !users) return "Não atribuído";
    const user = users.find(u => u.id === userId);
    return user ? user.name : `ID: ${userId}`;
  };
  
  // Find company name by ID
  const getCompanyById = (companyId: number | undefined) => {
    if (!companyId || !companies) return "N/A";
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : `ID: ${companyId}`;
  };
  
  // Find department name by ID
  const getDepartmentById = (departmentId: number | undefined) => {
    if (!departmentId || !departments) return "N/A";
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : `ID: ${departmentId}`;
  };

  // Get user initials
  const getUserInitials = (userId: number | undefined) => {
    if (!userId || !users) return "?";
    const user = users.find(u => u.id === userId);
    if (!user) return `${userId}`.substring(0, 2);
    return user.name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };
  
  // Custom render for calendar day cells
  const renderDay = (props: any) => {
    try {
      // Verificar se temos uma propriedade date (biblioteca react-day-picker)
      if (!props || !props.date || typeof props.date.getDate !== 'function') {
        return <div className="w-full h-full min-h-10 p-1">{props?.children}</div>;
      }
      
      const day = props.date;
      const dateStr = format(day, "yyyy-MM-dd");
      const dayTasks = tasksByDate[dateStr] || [];
      const filteredDayTasks = getFilteredTasks(dayTasks);
      const isToday = isSameDay(day, new Date());
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, date);
      
      // Group tasks by status
      const pendingCount = filteredDayTasks.filter(t => t.status === 'pending').length;
      const inProgressCount = filteredDayTasks.filter(t => t.status === 'in_progress').length;
      const completedCount = filteredDayTasks.filter(t => t.status === 'completed').length;
      const clientPendingCount = filteredDayTasks.filter(t => t.status === 'client_pending').length;
      const overdueCount = filteredDayTasks.filter(t => t.status === 'overdue').length;
      
      return (
      <div 
        className={`w-full h-full min-h-14 p-1 relative
          ${isToday ? "bg-primary-50 font-medium ring-1 ring-primary-200" : ""}
          ${isSelected ? "bg-primary-100 ring-2 ring-primary-500" : ""}
          ${!isCurrentMonth ? "opacity-40" : ""}
        `}
      >
        <span className={`text-xs ${isToday ? "font-medium text-primary-800" : ""}`}>
          {format(day, "d")}
        </span>
        
        {filteredDayTasks.length > 0 && (
          <div className="mt-1 flex flex-col">
            {filteredDayTasks.length <= 3 ? (
              // Show individual tasks if 3 or fewer
              filteredDayTasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className={`px-1 py-0.5 my-0.5 text-xs rounded truncate cursor-pointer hover:bg-gray-50 ${getStatusColor(task.status)}`}
                  title={task.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(day);
                  }}
                >
                  {task.title}
                </div>
              ))
            ) : (
              // Otherwise show counts by status
              <div className="flex flex-wrap gap-1 mt-1">
                {pendingCount > 0 && (
                  <div className="px-1 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">
                    {pendingCount}
                  </div>
                )}
                {inProgressCount > 0 && (
                  <div className="px-1 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                    {inProgressCount}
                  </div>
                )}
                {completedCount > 0 && (
                  <div className="px-1 py-0.5 text-xs rounded bg-green-100 text-green-800">
                    {completedCount}
                  </div>
                )}
                {clientPendingCount > 0 && (
                  <div className="px-1 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                    {clientPendingCount}
                  </div>
                )}
                {overdueCount > 0 && (
                  <div className="px-1 py-0.5 text-xs rounded bg-red-100 text-red-800">
                    {overdueCount}
                  </div>
                )}
                <div className="text-xs text-center text-gray-500">
                  {filteredDayTasks.length} itens
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
    } catch (error) {
      console.error("Erro ao renderizar célula do calendário:", error);
      return <div className="w-full h-full min-h-10 p-1">{props?.children || ''}</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Calendário de Obrigações</h1>
              <p className="mt-1 text-sm text-gray-500">
                Visualize e gerencie tarefas por vencimento ou competência.
              </p>
            </div>
            <Sheet open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
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
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Tabs 
                    defaultValue="calendar" 
                    value={viewMode} 
                    onValueChange={setViewMode}
                    className="w-full"
                  >
                    <TabsList>
                      <TabsTrigger value="calendar" className="flex items-center gap-1">
                        <CalendarDate className="h-4 w-4" />
                        Vencimento
                      </TabsTrigger>
                      <TabsTrigger value="competence" className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        Competência
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
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
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters sidebar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={selectedFilters.status || ""}
                          onValueChange={(value) => handleFilterChange('status', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todos os status" />
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

                      <div>
                        <label className="text-sm font-medium">Empresa</label>
                        <Select
                          value={selectedFilters.companyId?.toString() || ""}
                          onValueChange={(value) => handleFilterChange('company', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todas as empresas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as empresas</SelectItem>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Departamento</label>
                        <Select
                          value={selectedFilters.departmentId?.toString() || ""}
                          onValueChange={(value) => handleFilterChange('department', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todos os departamentos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os departamentos</SelectItem>
                            {departments?.map((department) => (
                              <SelectItem key={department.id} value={department.id.toString()}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Responsável</label>
                        <Select
                          value={selectedFilters.responsibleId?.toString() || ""}
                          onValueChange={(value) => handleFilterChange('responsible', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Todos os responsáveis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os responsáveis</SelectItem>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={clearFilters}
                        >
                          Limpar Filtros
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Today's Tasks */}
                  {viewMode === 'calendar' && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Tarefas do Dia</CardTitle>
                        <CardDescription>
                          {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isTasksLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : (
                          <>
                            {getFilteredTasks(tasksByDate[format(new Date(), "yyyy-MM-dd")] || []).length > 0 ? (
                              <div className="space-y-2">
                                {getFilteredTasks(tasksByDate[format(new Date(), "yyyy-MM-dd")] || []).map(task => (
                                  <div key={task.id} className="p-2 border rounded-md hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium text-sm">{task.title}</h3>
                                        <div className="flex items-center mt-1 space-x-1 text-xs text-gray-500">
                                          <Badge variant="outline" className={getStatusColor(task.status)}>
                                            {getStatusDisplay(task.status)}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 text-center py-2">
                                Nenhuma tarefa para hoje
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Main content area */}
                <div className="lg:col-span-3">
                  {/* View Tabs */}
                  <Tabs defaultValue="calendar" className="w-full" onValueChange={setViewMode}>
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="calendar">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Calendário
                      </TabsTrigger>
                      <TabsTrigger value="competence">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Competência
                      </TabsTrigger>
                    </TabsList>
                  
                    {/* Calendar View */}
                    <TabsContent value="calendar" className="m-0">
                      <Card>
                        {isTasksLoading ? (
                          <div className="p-6">
                            <Skeleton className="h-96 w-full" />
                          </div>
                        ) : isTasksError ? (
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

                    {/* Selected Date Tasks */}
                    {selectedDate && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Tarefas para {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {getFilteredTasks(getTasksForSelectedDate()).length > 0 ? (
                            <div className="space-y-3">
                              {getFilteredTasks(getTasksForSelectedDate()).map(task => (
                                <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">{task.title}</h3>
                                      {task.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                      )}
                                    </div>
                                    <Badge variant="outline" className={getStatusColor(task.status)}>
                                      {getStatusDisplay(task.status)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                                      <span>
                                        Competência: {task.competenceMonth}/{task.competenceYear}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="h-4 w-4 text-gray-400" />
                                      <span>{getCompanyById(task.companyId || undefined)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      <span>{getDepartmentById(task.departmentId || undefined)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-4 w-4">
                                        <AvatarFallback className="text-xs">
                                          {getUserInitials(task.responsibleId || undefined)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{getUserById(task.responsibleId || undefined)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              Não há tarefas para esta data com os filtros aplicados.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Competence View */}
                  <TabsContent value="competence" className="m-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Visualização por Competência</CardTitle>
                        <CardDescription>
                          Tarefas agrupadas por mês/ano de competência
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isTasksLoading ? (
                          <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        ) : isTasksError ? (
                          <div className="p-6">
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar dados</h3>
                              <p className="text-sm text-gray-500">
                                Não foi possível carregar as tarefas por competência. Tente novamente mais tarde.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible className="w-full">
                            {sortedCompetencePeriods.map((competencePeriod) => {
                              const [month, year] = competencePeriod.split('-').map(Number);
                              const tasksInCompetence = getFilteredTasks(tasksByCompetence[competencePeriod]);
                              
                              if (tasksInCompetence.length === 0) return null;
                              
                              // Count tasks by status
                              const pendingCount = tasksInCompetence.filter(t => t.status === 'pending').length;
                              const inProgressCount = tasksInCompetence.filter(t => t.status === 'in_progress').length;
                              const completedCount = tasksInCompetence.filter(t => t.status === 'completed').length;
                              const clientPendingCount = tasksInCompetence.filter(t => t.status === 'client_pending').length;
                              const overdueCount = tasksInCompetence.filter(t => t.status === 'overdue').length;
                              
                              return (
                                <AccordionItem key={competencePeriod} value={competencePeriod}>
                                  <AccordionTrigger className="hover:bg-gray-50 px-4">
                                    <div className="flex justify-between items-center w-full pr-4">
                                      <div className="font-medium">
                                        {getMonthName(month)} de {year}
                                      </div>
                                      <div className="flex gap-2">
                                        {pendingCount > 0 && (
                                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                        {inProgressCount > 0 && (
                                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                            {inProgressCount} em progresso
                                          </Badge>
                                        )}
                                        {completedCount > 0 && (
                                          <Badge variant="outline" className="bg-green-100 text-green-800">
                                            {completedCount} concluída{completedCount > 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                        {overdueCount > 0 && (
                                          <Badge variant="outline" className="bg-red-100 text-red-800">
                                            {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-3 mt-2">
                                      {tasksInCompetence.map(task => {
                                        const daysUntilDue = differenceInDays(new Date(task.dueDate), new Date());
                                        const isOverdue = daysUntilDue < 0;
                                        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
                                        
                                        return (
                                          <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h3 className="font-medium">{task.title}</h3>
                                                {task.description && (
                                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                                )}
                                              </div>
                                              <Badge variant="outline" className={getStatusColor(task.status)}>
                                                {getStatusDisplay(task.status)}
                                              </Badge>
                                            </div>
                                            
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                              <div className="flex items-center gap-1">
                                                <CalendarIcon className={`h-4 w-4 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-gray-400'}`} />
                                                <span className={isOverdue ? 'text-red-500 font-medium' : isDueSoon ? 'text-amber-500 font-medium' : ''}>
                                                  Vencimento: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                                                  {isOverdue && " (atrasado)"}
                                                  {isDueSoon && !isOverdue && " (próximo)"}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Briefcase className="h-4 w-4 text-gray-400" />
                                                <span>{getCompanyById(task.companyId || undefined)}</span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>{getDepartmentById(task.departmentId || undefined)}</span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Avatar className="h-4 w-4">
                                                  <AvatarFallback className="text-xs">
                                                    {getUserInitials(task.responsibleId || undefined)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span>{getUserById(task.responsibleId || undefined)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                            {sortedCompetencePeriods.filter(period => 
                              getFilteredTasks(tasksByCompetence[period]).length > 0
                            ).length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                Não há tarefas que correspondam aos filtros selecionados.
                              </div>
                            )}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}