import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserFormProps {
  userId?: number;
  onSuccess?: () => void;
}

export default function UserForm({ userId, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const isEditMode = !!userId;

  // Fetch user data if in edit mode
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: isEditMode,
  });

  // Fetch departments for multiselect
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  // Fetch user departments if in edit mode
  const { data: userDepartments } = useQuery({
    queryKey: [`/api/users/${userId}/departments`],
    enabled: isEditMode,
  });

  const form = useForm({
    resolver: zodResolver(isEditMode 
      ? insertUserSchema.partial().omit({ password: true }) 
      : insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      photo: "",
      position: "",
      role: "employee",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        ...userData,
        password: "", // Don't show password
      });
    }
  }, [userData, form]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar usuário: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    // If it's edit mode and password is empty, remove it from data
    if (isEditMode && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      if (isEditMode) {
        updateUserMutation.mutate(dataWithoutPassword);
      }
    } else {
      if (isEditMode) {
        updateUserMutation.mutate(data);
      } else {
        createUserMutation.mutate(data);
      }
    }
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  if (isEditMode && isLoadingUser) {
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
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input placeholder="Nome de usuário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isEditMode ? "Nova senha (opcional)" : "Senha"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Cargo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Papel</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel do usuário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Foto</FormLabel>
              <FormControl>
                <Input placeholder="URL da foto de perfil (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Atualizar Usuário" : "Criar Usuário"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
