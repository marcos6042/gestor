import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Department, insertDepartmentSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DepartmentFormProps {
  departmentId?: number;
  onSuccess?: () => void;
}

export default function DepartmentForm({ departmentId, onSuccess }: DepartmentFormProps) {
  const { toast } = useToast();
  const isEditMode = !!departmentId;

  // Fetch department data if in edit mode
  const { data: departmentData, isLoading: isLoadingDepartment } = useQuery<Department>({
    queryKey: [`/api/departments/${departmentId}`],
    enabled: isEditMode,
  });

  const form = useForm({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form values when department data is loaded
  useEffect(() => {
    if (departmentData) {
      form.reset(departmentData);
    }
  }, [departmentData, form]);

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/departments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Departamento criado",
        description: "O departamento foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar departamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/departments/${departmentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Departamento atualizado",
        description: "O departamento foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/departments/${departmentId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar departamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/departments/${departmentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir departamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    if (isEditMode) {
      updateDepartmentMutation.mutate(data);
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este departamento?")) {
      deleteDepartmentMutation.mutate();
    }
  };

  const isPending = 
    createDepartmentMutation.isPending || 
    updateDepartmentMutation.isPending || 
    deleteDepartmentMutation.isPending;

  if (isEditMode && isLoadingDepartment) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Departamento</FormLabel>
              <FormControl>
                <Input placeholder="Nome do departamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição do departamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between space-x-2 pt-4">
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {deleteDepartmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          )}
          
          <div className="flex ml-auto space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {(createDepartmentMutation.isPending || updateDepartmentMutation.isPending) && 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              }
              {isEditMode ? "Atualizar Departamento" : "Criar Departamento"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
