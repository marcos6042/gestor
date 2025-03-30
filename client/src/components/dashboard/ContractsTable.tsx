import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contract } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ContractForm from "@/components/forms/ContractForm";
import { Eye, PenSquare, Download, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractsTableProps {
  limit?: number;
  companyId?: number;
  responsibleId?: number;
  status?: string;
}

export default function ContractsTable({
  limit,
  companyId,
  responsibleId,
  status,
}: ContractsTableProps) {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [viewContractOpen, setViewContractOpen] = useState(false);

  let queryUrl = "/api/contracts";
  const queryParams = [];
  
  if (companyId) queryParams.push(`companyId=${companyId}`);
  if (responsibleId) queryParams.push(`responsibleId=${responsibleId}`);
  if (status) queryParams.push(`status=${status}`);
  
  if (queryParams.length > 0) {
    queryUrl += `?${queryParams.join("&")}`;
  }

  const { data: contracts, isLoading, isError } = useQuery<Contract[]>({
    queryKey: [queryUrl],
  });

  // Get contract status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Ativo", className: "bg-green-100 text-green-800" };
      case "renewed":
        return { label: "Renovado", className: "bg-blue-100 text-blue-800" };
      case "expired":
        return { label: "Expirado", className: "bg-yellow-100 text-yellow-800" };
      case "terminated":
        return { label: "Encerrado", className: "bg-red-100 text-red-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  // Handle view contract
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setViewContractOpen(true);
  };

  // Handle edit contract
  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setContractFormOpen(true);
  };

  // Handle download contract
  const handleDownloadContract = (contract: Contract) => {
    if (contract.filePath) {
      window.open(`/api/files/${contract.filePath}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden shadow border-b border-gray-200 sm:rounded-lg">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          {[...Array(limit || 3)].map((_, index) => (
            <div key={index} className="bg-white divide-y divide-gray-200">
              <div className="px-4 py-4 whitespace-nowrap">
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Erro ao carregar contratos. Por favor, tente novamente.</span>
        </div>
      </div>
    );
  }

  // Limit results if limit is provided
  const displayContracts = limit ? contracts.slice(0, limit) : contracts;

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Contrato</TableHead>
              <TableHead className="font-medium">Empresa</TableHead>
              <TableHead className="font-medium">Valor</TableHead>
              <TableHead className="font-medium">Vigência</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayContracts.map((contract) => {
              const statusDisplay = getStatusDisplay(contract.status);
              return (
                <TableRow key={contract.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium text-gray-900">{contract.title}</div>
                    <div className="text-xs text-gray-500">{contract.number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {`ID: ${contract.companyId}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{contract.value}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {`${format(new Date(contract.startDate), "dd/MM/yyyy")} - ${format(new Date(contract.endDate), "dd/MM/yyyy")}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusDisplay.className}>
                      {statusDisplay.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewContract(contract)}
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditContract(contract)}
                      >
                        <PenSquare className="h-4 w-4 text-primary-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDownloadContract(contract)}
                        disabled={!contract.filePath}
                      >
                        <Download className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Contract edit form */}
      <Sheet open={contractFormOpen} onOpenChange={setContractFormOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Editar Contrato</SheetTitle>
          </SheetHeader>
          {selectedContract && (
            <ContractForm 
              contractId={selectedContract.id} 
              onSuccess={() => {
                setContractFormOpen(false);
                window.location.reload();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Contract view sheet */}
      <Sheet open={viewContractOpen} onOpenChange={setViewContractOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Detalhes do Contrato</SheetTitle>
          </SheetHeader>
          {selectedContract && (
            <div className="py-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Título</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Número</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.number}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.description || "Sem descrição"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Início</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedContract.startDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Término</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedContract.endDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valor</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.value}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${getStatusDisplay(selectedContract.status).className}`}
                    >
                      {getStatusDisplay(selectedContract.status).label}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo de Contrato</h3>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedContract.contractType}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Informações de Reajuste</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedContract.adjustmentInfo || "Não informado"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Empresa</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {`ID: ${selectedContract.companyId}`}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departamento</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedContract.departmentId ? `ID: ${selectedContract.departmentId}` : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedContract.responsibleId ? `ID: ${selectedContract.responsibleId}` : "Não atribuído"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Arquivo</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedContract.filePath ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadContract(selectedContract)}
                        className="mt-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar arquivo
                      </Button>
                    ) : (
                      "Nenhum arquivo disponível"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={() => {
                    setViewContractOpen(false);
                    handleEditContract(selectedContract);
                  }}
                >
                  Editar Contrato
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
