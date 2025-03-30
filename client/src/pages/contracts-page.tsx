import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Contract } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ContractsTable from "@/components/dashboard/ContractsTable";
import ContractForm from "@/components/forms/ContractForm";
import { Plus, Search, FilterX, AlertCircle } from "lucide-react";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<{
    status?: string;
    companyId?: number;
    responsibleId?: number;
  }>({});
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch companies for filter
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Fetch users for filter
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Reset other filters
    setFilter({});
    
    // Set status filter based on tab
    if (tab !== "all") {
      setFilter({ status: tab });
    }
  };

  const handleCompanyFilter = (companyId: string) => {
    if (companyId) {
      setFilter((prev) => ({ ...prev, companyId: parseInt(companyId) }));
      setActiveTab("all"); // Reset tab selection
    } else {
      // Remove company filter if empty selection
      const { companyId, ...rest } = filter;
      setFilter(rest);
    }
  };

  const handleResponsibleFilter = (responsibleId: string) => {
    if (responsibleId) {
      setFilter((prev) => ({ ...prev, responsibleId: parseInt(responsibleId) }));
      setActiveTab("all"); // Reset tab selection
    } else {
      // Remove responsible filter if empty selection
      const { responsibleId, ...rest } = filter;
      setFilter(rest);
    }
  };

  const clearFilters = () => {
    setFilter({});
    setSearchTerm("");
    setActiveTab("all");
  };

  const hasActiveFilters = Object.keys(filter).length > 0 || searchTerm.length > 0;

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Contratos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os contratos da empresa.
          </p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar contratos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filter.companyId?.toString() || ""}
                  onValueChange={handleCompanyFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Empresa" />
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
                
                <Select
                  value={filter.responsibleId?.toString() || ""}
                  onValueChange={handleResponsibleFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Responsável" />
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
                
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={clearFilters}
                    title="Limpar filtros"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Sheet open={isNewContractOpen} onOpenChange={setIsNewContractOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contrato
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Novo Contrato</SheetTitle>
                </SheetHeader>
                <ContractForm onSuccess={() => setIsNewContractOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="renewed">Renovados</TabsTrigger>
              <TabsTrigger value="expired">Expirados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ContractsTable
                companyId={filter.companyId}
                responsibleId={filter.responsibleId}
              />
            </TabsContent>
            
            <TabsContent value="active">
              <ContractsTable
                status="active"
                companyId={filter.companyId}
                responsibleId={filter.responsibleId}
              />
            </TabsContent>
            
            <TabsContent value="renewed">
              <ContractsTable
                status="renewed"
                companyId={filter.companyId}
                responsibleId={filter.responsibleId}
              />
            </TabsContent>
            
            <TabsContent value="expired">
              <ContractsTable
                status="expired"
                companyId={filter.companyId}
                responsibleId={filter.responsibleId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
