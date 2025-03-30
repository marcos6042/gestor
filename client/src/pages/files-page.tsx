import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { File } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Download, Upload, FolderOpen, FileIcon, AlertCircle, PlusCircle, Trash2 } from "lucide-react";

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<{
    type?: string;
    companyId?: number;
    taskId?: number;
    contractId?: number;
  }>({});

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Here we would construct the queryUrl based on filters
  let queryUrl = "/api/files";
  const queryParams = [];
  
  if (filter.companyId) queryParams.push(`companyId=${filter.companyId}`);
  if (filter.taskId) queryParams.push(`taskId=${filter.taskId}`);
  if (filter.contractId) queryParams.push(`contractId=${filter.contractId}`);
  
  if (queryParams.length > 0) {
    queryUrl += `?${queryParams.join("&")}`;
  }

  const { data: files, isLoading, isError } = useQuery<File[]>({
    queryKey: [queryUrl],
    // This would error in a real app without proper implementation
    // as the files API requires at least one filter
    enabled: queryParams.length > 0, 
  });

  // Filter files based on search term
  const filteredFiles = files?.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format file size
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // Handle file download
  const handleDownload = (file: File) => {
    window.open(`/api/files/${file.id}`, "_blank");
  };

  // File type icon
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <FileIcon className="h-6 w-6 text-blue-500" />;
    } else if (type.includes("pdf")) {
      return <FileIcon className="h-6 w-6 text-red-500" />;
    } else if (type.includes("excel") || type.includes("spreadsheet")) {
      return <FileIcon className="h-6 w-6 text-green-500" />;
    } else if (type.includes("word") || type.includes("document")) {
      return <FileIcon className="h-6 w-6 text-blue-700" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Arquivos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os arquivos do sistema.
          </p>
        </div>

        <div className="mt-6 px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar arquivos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filter.companyId?.toString() || ""}
                  onValueChange={(value) => setFilter({ ...filter, companyId: value ? parseInt(value) : undefined })}
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
              </div>
            </div>

            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Enviar arquivo
            </Button>
          </div>

          {!filter.companyId && !filter.taskId && !filter.contractId ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um filtro</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Para visualizar os arquivos, selecione uma empresa, tarefa ou contrato nos filtros acima.
                  </p>
                  <Button variant="outline" className="mb-2" onClick={() => setFilter({ companyId: 1 })}>
                    Ver arquivos da primeira empresa
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Os arquivos são filtrados por empresa, tarefa ou contrato para otimizar o desempenho.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
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
                <span>Erro ao carregar arquivos. Por favor, tente novamente.</span>
              </div>
            </div>
          ) : filteredFiles && filteredFiles.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Arquivo</TableHead>
                    <TableHead className="font-medium">Tipo</TableHead>
                    <TableHead className="font-medium">Tamanho</TableHead>
                    <TableHead className="font-medium">Enviado por</TableHead>
                    <TableHead className="font-medium">Data de upload</TableHead>
                    <TableHead className="font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          {getFileTypeIcon(file.type)}
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{file.filename}</div>
                            <div className="text-xs text-gray-500">
                              {file.taskId ? `Tarefa ID: ${file.taskId}` : 
                               file.contractId ? `Contrato ID: ${file.contractId}` : 
                               file.companyId ? `Empresa ID: ${file.companyId}` : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100">
                          {file.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>ID: {file.uploadedBy}</TableCell>
                      <TableCell>{format(new Date(file.uploaded), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4 text-primary-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Não há arquivos disponíveis para os filtros selecionados. 
                    Tente selecionar outra empresa ou faça upload de novos arquivos.
                  </p>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Enviar novo arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
