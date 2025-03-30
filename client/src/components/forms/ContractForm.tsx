import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contract, insertContractSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ContractFormProps {
  contractId?: number;
  onSuccess?: () => void;
}

export default function ContractForm({ contractId, onSuccess }: ContractFormProps) {
  const { toast } = useToast();
  const isEditMode = !!contractId;

  // Fetch companies for dropdown
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  // Fetch users for dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch contract data if in edit mode
  const { data: contractData, isLoading: isLoadingContract } = useQuery<Contract>({
    queryKey: [`/api/contracts/${contractId}`],
    enabled: isEditMode,
  });

  const form = useForm({
    resolver: zodResolver(insertContractSchema),
    defaultValues: {
      title: "",
      number: "",
      description: "",
      contractType: "service",
      startDate: "",
      endDate: "",
      value: "",
      adjustmentInfo: "",
      status: "active",
      companyId: 0,
      responsibleId: undefined,
      departmentId: undefined,
      filePath: "",
    },
  });

  // Update form values when contract data is loaded
  useEffect(() => {
    if (contractData) {
      form.reset({
        ...contractData,
        startDate: format(new Date(contractData.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(contractData.endDate), "yyyy-MM-dd"),
      });
    }
  }, [contractData, form]);

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar contrato: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/contracts/${contractId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato atualizado",
        description: "O contrato foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar contrato: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    // Convert string IDs to numbers
    const formattedData = {
      ...data,
      companyId: Number(data.companyId),
      responsibleId: data.responsibleId ? Number(data.responsibleId) : null,
      departmentId: data.departmentId ? Number(data.departmentId) : null,
    };

    if (isEditMode) {
      updateContractMutation.mutate(formattedData);
    } else {
      createContractMutation.mutate(formattedData);
    }
  };

  const isPending = createContractMutation.isPending || updateContractMutation.isPending;

  if (isEditMode && isLoadingContract) {
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Contrato</FormLabel>
              <FormControl>
                <Input placeholder="Título do contrato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Contrato</FormLabel>
              <FormControl>
                <Input placeholder="Número ou referência do contrato" {...field} />
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
                <Textarea placeholder="Descrição do contrato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contractType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Contrato</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de contrato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="service">Prestação de Serviços</SelectItem>
                  <SelectItem value="supply">Fornecimento</SelectItem>
                  <SelectItem value="lease">Locação</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input placeholder="Valor do contrato (ex: R$ 1.000,00/mês)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adjustmentInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações de Reajuste</FormLabel>
              <FormControl>
                <Textarea placeholder="Informações sobre reajuste, periodicidade, índice, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="responsibleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEditMode && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="renewed">Renovado</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="terminated">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="filePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivo do Contrato (Caminho)</FormLabel>
              <FormControl>
                <Input placeholder="Caminho do arquivo (opcional)" {...field} />
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
            {isEditMode ? "Atualizar Contrato" : "Criar Contrato"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
