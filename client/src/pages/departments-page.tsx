import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Department } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DepartmentForm from "@/components/forms/DepartmentForm";
import { Plus, Search, Eye, PenSquare, Briefcase, AlertCircle, Users } from "lucide-react";

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isNewDepartmentOpen, setIsNewDepartmentOpen] = useState(false);
  const [isViewDepartmentOpen, setIsViewDepartmentOpen] = useState(false);
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false);

  const { data: departments, isLoading, isError } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Filter departments based on search term
  const filteredDepartments = departments?.filter(
    (department) =>
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle view department
  const handleViewDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsViewDepartmentOpen(true);
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDepartmentOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Departamentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os departamentos da empresa.
          </p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar departamentos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Sheet open={isNewDepartmentOpen} onOpenChange={setIsNewDepartmentOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Departamento
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Novo Departamento</SheetTitle>
                </SheetHeader>
                <DepartmentForm onSuccess={() => setIsNewDepartmentOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Erro ao carregar departamentos. Por favor, tente novamente.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Usuários</TableHead>
                    <TableHead className="font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Briefcase className="h-10 w-10 mb-2" />
                          <p>Nenhum departamento encontrado.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments?.map((department) => (
                      <TableRow key={department.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium text-gray-900">{department.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {department.description || "Sem descrição"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleViewDepartment(department)}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Ver Usuários
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDepartment(department)}
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <PenSquare className="h-4 w-4 text-primary-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* View Department */}
      <Sheet open={isViewDepartmentOpen} onOpenChange={setIsViewDepartmentOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Departamento</SheetTitle>
          </SheetHeader>
          {selectedDepartment && (
            <div className="py-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedDepartment.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDepartment.description || "Sem descrição"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Usuários do Departamento</h3>
                  <div className="mt-2">
                    {/* This would be populated from a useQuery call to fetch department users */}
                    <p className="text-sm text-gray-500 italic">Carregando usuários...</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => {
                    setIsViewDepartmentOpen(false);
                    handleEditDepartment(selectedDepartment);
                  }}
                >
                  Editar Departamento
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Department */}
      <Sheet open={isEditDepartmentOpen} onOpenChange={setIsEditDepartmentOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Departamento</SheetTitle>
          </SheetHeader>
          {selectedDepartment && (
            <DepartmentForm
              departmentId={selectedDepartment.id}
              onSuccess={() => setIsEditDepartmentOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
