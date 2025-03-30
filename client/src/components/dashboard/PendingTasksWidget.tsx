import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function PendingTasksWidget() {
  // Get tasks for counting
  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Get departments
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });
  
  // Count tasks by department
  const tasksByDepartment = tasks?.reduce<Record<number, number>>((acc, task) => {
    if (task.departmentId && task.status !== 'completed') {
      acc[task.departmentId] = (acc[task.departmentId] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  // Count tasks by status
  const tasksByStatus = tasks?.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {}) || {};
  
  // Calculate percentages
  const totalPendingTasks = tasks?.filter(task => task.status !== 'completed')?.length || 0;
  
  // Get department name
  const getDepartmentName = (id: number) => {
    const dept = departments?.find(d => d.id === id);
    return dept?.name || `Departamento ${id}`;
  };
  
  if (isLoading) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-gray-200">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full mt-6" />
          <Skeleton className="h-12 w-full mt-6" />
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Erro ao carregar pendências</h3>
            <p className="text-sm text-gray-500">
              Não foi possível carregar o resumo de pendências. Tente novamente mais tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort departments by number of tasks
  const sortedDepartments = Object.entries(tasksByDepartment)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 4); // Limit to top 4 departments
  
  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Resumo de Pendências</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Por Departamento</h3>
          <div className="space-y-3">
            {sortedDepartments.length > 0 ? (
              sortedDepartments.map(([deptId, count]) => {
                const percentage = totalPendingTasks > 0 
                  ? Math.round((count / totalPendingTasks) * 100) 
                  : 0;
                  
                return (
                  <div key={deptId}>
                    <div className="flex items-center justify-between text-sm">
                      <div>{getDepartmentName(Number(deptId))}</div>
                      <div>{count} pendência{count !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 py-2">
                Nenhuma tarefa pendente por departamento.
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Por Status</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-semibold text-red-600">
                {tasksByStatus.overdue || 0}
              </div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-semibold text-yellow-600">
                {tasksByStatus.in_progress || 0}
              </div>
              <div className="text-sm text-gray-600">Em Andamento</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-semibold text-gray-500">
                {tasksByStatus.pending || 0}
              </div>
              <div className="text-sm text-gray-600">Aguardando</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-semibold text-green-600">
                {tasksByStatus.completed || 0}
              </div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Link href="/relatorios">
            <Button 
              variant="outline" 
              className="w-full justify-center text-primary-700 bg-primary-100 hover:bg-primary-200 border-none"
            >
              Ver relatórios detalhados
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
