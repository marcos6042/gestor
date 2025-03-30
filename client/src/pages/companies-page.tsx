import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Company } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyForm from "@/components/forms/CompanyForm";
import { Plus, Search, Eye, PenSquare, Building2, AlertCircle } from "lucide-react";

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [isViewCompanyOpen, setIsViewCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);

  const { data: companies, isLoading, isError } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Get tax regime display
  const getTaxRegimeDisplay = (regime: string) => {
    switch (regime) {
      case "simples":
        return { label: "Simples Nacional", className: "bg-green-100 text-green-800" };
      case "presumido":
        return { label: "Lucro Presumido", className: "bg-blue-100 text-blue-800" };
      case "real":
        return { label: "Lucro Real", className: "bg-purple-100 text-purple-800" };
      case "scp":
        return { label: "SCP", className: "bg-yellow-100 text-yellow-800" };
      default:
        return { label: regime, className: "bg-gray-100 text-gray-800" };
    }
  };

  // Filter companies based on search term
  const filteredCompanies = companies?.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm)
  );

  // Handle view company
  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsViewCompanyOpen(true);
  };

  // Handle edit company
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditCompanyOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todas as empresas cadastradas no sistema.
          </p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar empresas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Sheet open={isNewCompanyOpen} onOpenChange={setIsNewCompanyOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Nova Empresa</SheetTitle>
                </SheetHeader>
                <CompanyForm onSuccess={() => setIsNewCompanyOpen(false)} />
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
                <span>Erro ao carregar empresas. Por favor, tente novamente.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">CNPJ</TableHead>
                    <TableHead className="font-medium">Regime Tributário</TableHead>
                    <TableHead className="font-medium">Contato</TableHead>
                    <TableHead className="font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Building2 className="h-10 w-10 mb-2" />
                          <p>Nenhuma empresa encontrada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies?.map((company) => {
                      const taxRegimeDisplay = getTaxRegimeDisplay(company.taxRegime);
                      return (
                        <TableRow key={company.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium text-gray-900">{company.name}</div>
                          </TableCell>
                          <TableCell>{company.cnpj}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={taxRegimeDisplay.className}>
                              {taxRegimeDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>{company.email}</div>
                            <div className="text-xs text-gray-500">{company.phone}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewCompany(company)}
                              >
                                <Eye className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCompany(company)}
                              >
                                <PenSquare className="h-4 w-4 text-primary-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* View Company */}
      <Sheet open={isViewCompanyOpen} onOpenChange={setIsViewCompanyOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes da Empresa</SheetTitle>
          </SheetHeader>
          {selectedCompany && (
            <div className="py-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Razão Social</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.cnpj}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Regime Tributário</h3>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${getTaxRegimeDisplay(selectedCompany.taxRegime).className}`}
                  >
                    {getTaxRegimeDisplay(selectedCompany.taxRegime).label}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Endereço</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.address || "Não informado"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.phone || "Não informado"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.email || "Não informado"}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => {
                    setIsViewCompanyOpen(false);
                    handleEditCompany(selectedCompany);
                  }}
                >
                  Editar Empresa
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Company */}
      <Sheet open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Empresa</SheetTitle>
          </SheetHeader>
          {selectedCompany && (
            <CompanyForm
              companyId={selectedCompany.id}
              onSuccess={() => setIsEditCompanyOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
