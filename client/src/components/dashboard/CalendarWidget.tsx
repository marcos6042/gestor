import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { format, getMonth, getYear, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function CalendarWidget() {
  const [date, setDate] = useState<Date>(new Date());
  const month = getMonth(date);
  const year = getYear(date);
  
  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);
  
  // Format dates for API query
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");
  
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
  
  // Custom day render function
  const renderDay = (props: any) => {
    try {
      // Verificar se temos uma propriedade date (que é o que a biblioteca react-day-picker passa)
      if (props && props.date && typeof props.date.getDate === 'function') {
        const day = props.date;
        const dateStr = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDate[dateStr] || [];
        const isToday = isSameDay(day, new Date());
        
        return (
          <div className={`w-full h-full min-h-10 p-1 ${isToday ? "bg-primary-50" : ""}`}>
            <span className={`text-xs ${isToday ? "font-medium text-primary-800" : ""}`}>
              {format(day, "d")}
            </span>
            
            {dayTasks.length > 0 && (
              <div className="mt-1 overflow-y-auto max-h-16 space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <div 
                    key={task.id} 
                    className={`px-1 py-0.5 text-xs rounded truncate ${getStatusColor(task.status)}`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 2} mais
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      // Fallback caso não seja um objeto com uma data válida
      return <div className="w-full h-full min-h-10 p-1">{props?.children}</div>;
    } catch (error) {
      console.error("Erro ao renderizar dia:", error);
      return <div className="w-full h-full min-h-10 p-1"></div>;
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-4">
          <Skeleton className="h-4 w-40" />
        </CardFooter>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar calendário</h3>
            <p className="text-sm text-gray-500">
              Não foi possível carregar os eventos do calendário. Tente novamente mais tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Calendário de Obrigações</CardTitle>
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
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            locale={ptBR}
            showOutsideDays
            fixedWeeks
            ISOWeek
            className="rounded-none p-0"
            components={{ Day: renderDay }}
            classNames={{
              day_today: "bg-primary-50"
            }}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-6 py-4">
        <Link href="/calendario" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          Ver calendário completo →
        </Link>
      </CardFooter>
    </Card>
  );
}