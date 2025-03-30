import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { User, Task, Department, Company } from '@shared/schema';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Estende a definição do jsPDF para incluir autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Função para obter o nome formatado do período
export const getTimeRangeLabel = (timeRange: string): string => {
  switch (timeRange) {
    case 'week':
      return 'Última Semana';
    case 'month':
      return 'Último Mês';
    case 'quarter':
      return 'Último Trimestre';
    case 'year':
      return 'Último Ano';
    case 'all':
      return 'Todos os Períodos';
    default:
      return timeRange;
  }
};

// Função para obter o status formatado em português
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'in_progress':
      return 'Em Andamento';
    case 'completed':
      return 'Concluído';
    case 'client_pending':
      return 'Pendente Cliente';
    case 'overdue':
      return 'Atrasado';
    default:
      return status;
  }
};

// Função principal para gerar relatório PDF
export const generateReport = (
  reportType: string,
  timeRange: string,
  departmentFilter: string | undefined,
  tasks: Task[],
  users: User[],
  departments: Department[],
  companies: Company[]
) => {
  // Cria uma nova instância do PDF
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  const logoHeight = 15; // Altura do logo em mm

  // Filtra as tarefas conforme os filtros
  let filteredTasks = [...tasks];
  if (departmentFilter) {
    filteredTasks = filteredTasks.filter(task => task.departmentId === parseInt(departmentFilter));
  }

  // Adiciona cabeçalho
  doc.setFontSize(20);
  doc.text('TaskFlow', 105, 15, { align: 'center' });
  
  doc.setFontSize(14);
  let reportTitle = 'Relatório';
  switch (reportType) {
    case 'overview':
      reportTitle = 'Relatório de Visão Geral';
      break;
    case 'departments':
      reportTitle = 'Relatório por Departamentos';
      break;
    case 'companies':
      reportTitle = 'Relatório por Empresas';
      break;
  }
  doc.text(reportTitle, 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Período: ${getTimeRangeLabel(timeRange)}`, 105, 32, { align: 'center' });
  
  if (departmentFilter) {
    const dept = departments.find(d => d.id === parseInt(departmentFilter));
    if (dept) {
      doc.text(`Departamento: ${dept.name}`, 105, 37, { align: 'center' });
    }
  }
  
  doc.text(`Gerado em: ${dateStr}`, 105, 42, { align: 'center' });
  
  // Adiciona linhas separadoras
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);
  
  // Posição inicial Y após o cabeçalho
  let yPos = 55;
  
  // Adiciona estatísticas de tarefas por status
  doc.setFontSize(12);
  doc.text('Tarefas por Status', 20, yPos);
  yPos += 10;
  
  const statusCounts: Record<string, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    client_pending: 0,
    overdue: 0,
  };
  
  filteredTasks.forEach(task => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
  });
  
  const statusRows = Object.entries(statusCounts).map(([status, count]) => [
    getStatusLabel(status),
    count.toString(),
    `${((count / filteredTasks.length) * 100).toFixed(1)}%`
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Status', 'Quantidade', 'Percentual']],
    body: statusRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 59, 106] }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (reportType === 'overview') {
    // Adiciona estatísticas de tarefas por responsável
    doc.setFontSize(12);
    doc.text('Tarefas por Responsável', 20, yPos);
    yPos += 10;
    
    const userCounts: Record<number, number> = {};
    filteredTasks.forEach(task => {
      if (task.responsibleId) {
        userCounts[task.responsibleId] = (userCounts[task.responsibleId] || 0) + 1;
      }
    });
    
    const userRows = Object.entries(userCounts).map(([userId, count]) => {
      const user = users.find(u => u.id === parseInt(userId));
      return [
        user ? user.name : `ID: ${userId}`,
        count.toString(),
        `${((count / filteredTasks.length) * 100).toFixed(1)}%`
      ];
    }).sort((a, b) => parseInt(b[1]) - parseInt(a[1])); // Ordena por quantidade (decrescente)
    
    doc.autoTable({
      startY: yPos,
      head: [['Responsável', 'Quantidade', 'Percentual']],
      body: userRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 59, 106] }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  if (reportType === 'departments' || reportType === 'overview') {
    // Adiciona estatísticas de tarefas por departamento
    doc.setFontSize(12);
    doc.text('Tarefas por Departamento', 20, yPos);
    yPos += 10;
    
    const deptCounts: Record<number, Record<string, number>> = {};
    
    filteredTasks.forEach(task => {
      if (task.departmentId) {
        if (!deptCounts[task.departmentId]) {
          deptCounts[task.departmentId] = {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            client_pending: 0,
            overdue: 0,
          };
        }
        deptCounts[task.departmentId].total += 1;
        deptCounts[task.departmentId][task.status] += 1;
      }
    });
    
    const deptRows = Object.entries(deptCounts).map(([deptId, counts]) => {
      const dept = departments.find(d => d.id === parseInt(deptId));
      return [
        dept ? dept.name : `ID: ${deptId}`,
        counts.total.toString(),
        counts.pending.toString(),
        counts.in_progress.toString(),
        counts.completed.toString(),
        counts.client_pending.toString(),
        counts.overdue.toString(),
      ];
    }).sort((a, b) => parseInt(b[1]) - parseInt(a[1])); // Ordena por total (decrescente)
    
    doc.autoTable({
      startY: yPos,
      head: [['Departamento', 'Total', 'Pendentes', 'Em Andamento', 'Concluídas', 'Pend. Cliente', 'Atrasadas']],
      body: deptRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 59, 106] }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  if (reportType === 'companies' || reportType === 'overview') {
    // Adiciona estatísticas de tarefas por empresa
    doc.setFontSize(12);
    doc.text('Tarefas por Empresa', 20, yPos);
    yPos += 10;
    
    const companyCounts: Record<number, Record<string, number>> = {};
    
    filteredTasks.forEach(task => {
      if (task.companyId) {
        if (!companyCounts[task.companyId]) {
          companyCounts[task.companyId] = {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            client_pending: 0,
            overdue: 0,
          };
        }
        companyCounts[task.companyId].total += 1;
        companyCounts[task.companyId][task.status] += 1;
      }
    });
    
    const companyRows = Object.entries(companyCounts).map(([companyId, counts]) => {
      const company = companies.find(c => c.id === parseInt(companyId));
      return [
        company ? company.name : `ID: ${companyId}`,
        counts.total.toString(),
        counts.pending.toString(),
        counts.in_progress.toString(),
        counts.completed.toString(),
        counts.client_pending.toString(),
        counts.overdue.toString(),
      ];
    }).sort((a, b) => parseInt(b[1]) - parseInt(a[1])); // Ordena por total (decrescente)
    
    // Verifica se precisa adicionar uma nova página
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.autoTable({
      startY: yPos,
      head: [['Empresa', 'Total', 'Pendentes', 'Em Andamento', 'Concluídas', 'Pend. Cliente', 'Atrasadas']],
      body: companyRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 59, 106] }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount} - TaskFlow - Sistema de Gestão Corporativa`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Salva o PDF
  doc.save(`TaskFlow_Relatorio_${reportType}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
};