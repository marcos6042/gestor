import {
  users, departments, userDepartments, companies, suppliers, obligations, companyObligations, 
  tasks, taskComments, contracts, files, auditLogs,
  type User, type InsertUser, type Department, type InsertDepartment,
  type UserDepartment, type InsertUserDepartment, type Company, type InsertCompany,
  type Supplier, type InsertSupplier, type Obligation, type InsertObligation, 
  type CompanyObligation, type InsertCompanyObligation,
  type Task, type InsertTask, type TaskComment, type InsertTaskComment,
  type Contract, type InsertContract, type File, type InsertFile,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  getDepartments(): Promise<Department[]>;
  
  // User-Department relationship methods
  assignUserToDepartment(data: InsertUserDepartment): Promise<UserDepartment>;
  removeUserFromDepartment(userId: number, departmentId: number): Promise<boolean>;
  getUserDepartments(userId: number): Promise<Department[]>;
  getDepartmentUsers(departmentId: number): Promise<User[]>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCnpj(cnpj: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  getCompanies(): Promise<Company[]>;
  
  // Supplier methods
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByDocument(document: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  getSuppliers(): Promise<Supplier[]>;
  
  // Obligation methods
  getObligation(id: number): Promise<Obligation | undefined>;
  createObligation(obligation: InsertObligation): Promise<Obligation>;
  updateObligation(id: number, obligation: Partial<InsertObligation>): Promise<Obligation | undefined>;
  deleteObligation(id: number): Promise<boolean>;
  getObligations(): Promise<Obligation[]>;
  
  // Company-Obligation relationship methods
  assignObligationToCompany(data: InsertCompanyObligation): Promise<CompanyObligation>;
  removeObligationFromCompany(companyId: number, obligationId: number): Promise<boolean>;
  getCompanyObligations(companyId: number): Promise<Obligation[]>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasks(): Promise<Task[]>;
  getTasksByCompany(companyId: number): Promise<Task[]>;
  getTasksByDepartment(departmentId: number): Promise<Task[]>;
  getTasksByResponsible(responsibleId: number): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksDueToday(): Promise<Task[]>;
  getTasksOverdue(): Promise<Task[]>;
  
  // Task comments methods
  addTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  
  // Contract methods
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;
  getContracts(): Promise<Contract[]>;
  getContractsByCompany(companyId: number): Promise<Contract[]>;
  getContractsByResponsible(responsibleId: number): Promise<Contract[]>;
  getContractsByStatus(status: string): Promise<Contract[]>;
  
  // File methods
  saveFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getTaskFiles(taskId: number): Promise<File[]>;
  getContractFiles(contractId: number): Promise<File[]>;
  getCompanyFiles(companyId: number): Promise<File[]>;
  deleteFile(id: number): Promise<boolean>;
  
  // Audit log methods
  addAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  getEntityAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]>;
  getUserAuditLogs(userId: number): Promise<AuditLog[]>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private departmentsMap: Map<number, Department>;
  private userDepartmentsMap: Map<number, UserDepartment>;
  private companiesMap: Map<number, Company>;
  private suppliersMap: Map<number, Supplier>;
  private obligationsMap: Map<number, Obligation>;
  private companyObligationsMap: Map<number, CompanyObligation>;
  private tasksMap: Map<number, Task>;
  private taskCommentsMap: Map<number, TaskComment>;
  private contractsMap: Map<number, Contract>;
  private filesMap: Map<number, File>;
  private auditLogsMap: Map<number, AuditLog>;
  
  private userId: number = 1;
  private departmentId: number = 1;
  private userDepartmentId: number = 1;
  private companyId: number = 1;
  private supplierId: number = 1;
  private obligationId: number = 1;
  private companyObligationId: number = 1;
  private taskId: number = 1;
  private taskCommentId: number = 1;
  private contractId: number = 1;
  private fileId: number = 1;
  private auditLogId: number = 1;
  
  sessionStore: any;

  constructor() {
    this.usersMap = new Map();
    this.departmentsMap = new Map();
    this.userDepartmentsMap = new Map();
    this.companiesMap = new Map();
    this.suppliersMap = new Map();
    this.obligationsMap = new Map();
    this.companyObligationsMap = new Map();
    this.tasksMap = new Map();
    this.taskCommentsMap = new Map();
    this.contractsMap = new Map();
    this.filesMap = new Map();
    this.auditLogsMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });

    // Initialize with default departments
    const departments = [
      { name: "Contabilidade", description: "Departamento de Contabilidade" },
      { name: "Fiscal", description: "Departamento Fiscal" },
      { name: "Financeiro", description: "Departamento Financeiro" },
      { name: "Compras", description: "Departamento de Compras" },
      { name: "RH", description: "Departamento de Recursos Humanos" },
      { name: "Administrativo", description: "Departamento Administrativo" },
      { name: "Diretoria", description: "Diretoria Executiva" }
    ];
    
    departments.forEach(dept => {
      this.createDepartment(dept);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { ...existingUser, ...user };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departmentsMap.get(id);
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    return Array.from(this.departmentsMap.values()).find(dept => dept.name === name);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.departmentId++;
    const newDepartment: Department = { ...department, id };
    this.departmentsMap.set(id, newDepartment);
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const existingDept = await this.getDepartment(id);
    if (!existingDept) return undefined;
    
    const updatedDept: Department = { ...existingDept, ...department };
    this.departmentsMap.set(id, updatedDept);
    return updatedDept;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departmentsMap.delete(id);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departmentsMap.values());
  }

  // User-Department relationship methods
  async assignUserToDepartment(data: InsertUserDepartment): Promise<UserDepartment> {
    const id = this.userDepartmentId++;
    const userDepartment: UserDepartment = { ...data, id };
    this.userDepartmentsMap.set(id, userDepartment);
    return userDepartment;
  }

  async removeUserFromDepartment(userId: number, departmentId: number): Promise<boolean> {
    const entry = Array.from(this.userDepartmentsMap.entries()).find(
      ([_, ud]) => ud.userId === userId && ud.departmentId === departmentId
    );
    
    if (entry) {
      return this.userDepartmentsMap.delete(entry[0]);
    }
    
    return false;
  }

  async getUserDepartments(userId: number): Promise<Department[]> {
    const userDeptIds = Array.from(this.userDepartmentsMap.values())
      .filter(ud => ud.userId === userId)
      .map(ud => ud.departmentId);
    
    return userDeptIds.map(id => this.departmentsMap.get(id)).filter(Boolean) as Department[];
  }

  async getDepartmentUsers(departmentId: number): Promise<User[]> {
    const deptUserIds = Array.from(this.userDepartmentsMap.values())
      .filter(ud => ud.departmentId === departmentId)
      .map(ud => ud.userId);
    
    return deptUserIds.map(id => this.usersMap.get(id)).filter(Boolean) as User[];
  }

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companiesMap.get(id);
  }

  async getCompanyByCnpj(cnpj: string): Promise<Company | undefined> {
    return Array.from(this.companiesMap.values()).find(company => company.cnpj === cnpj);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.companyId++;
    const newCompany: Company = { ...company, id };
    this.companiesMap.set(id, newCompany);
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existingCompany = await this.getCompany(id);
    if (!existingCompany) return undefined;
    
    const updatedCompany: Company = { ...existingCompany, ...company };
    this.companiesMap.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companiesMap.delete(id);
  }

  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companiesMap.values());
  }

  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliersMap.get(id);
  }

  async getSupplierByDocument(document: string): Promise<Supplier | undefined> {
    return Array.from(this.suppliersMap.values()).find(supplier => supplier.document === document);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierId++;
    const newSupplier: Supplier = { 
      ...supplier, 
      id,
      email: supplier.email || null,
      address: supplier.address || null,
      phone: supplier.phone || null,
      contact: supplier.contact || null,
      notes: supplier.notes || null
    };
    this.suppliersMap.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = await this.getSupplier(id);
    if (!existingSupplier) return undefined;
    
    // Garantir tipos nulos em vez de undefined
    const updatedData = {
      ...supplier,
      email: supplier.email !== undefined ? supplier.email : existingSupplier.email,
      address: supplier.address !== undefined ? supplier.address : existingSupplier.address,
      phone: supplier.phone !== undefined ? supplier.phone : existingSupplier.phone,
      contact: supplier.contact !== undefined ? supplier.contact : existingSupplier.contact,
      notes: supplier.notes !== undefined ? supplier.notes : existingSupplier.notes
    };
    
    const updatedSupplier: Supplier = { ...existingSupplier, ...updatedData };
    this.suppliersMap.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliersMap.delete(id);
  }

  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliersMap.values());
  }

  // Obligation methods
  async getObligation(id: number): Promise<Obligation | undefined> {
    return this.obligationsMap.get(id);
  }

  async createObligation(obligation: InsertObligation): Promise<Obligation> {
    const id = this.obligationId++;
    const newObligation: Obligation = { ...obligation, id };
    this.obligationsMap.set(id, newObligation);
    return newObligation;
  }

  async updateObligation(id: number, obligation: Partial<InsertObligation>): Promise<Obligation | undefined> {
    const existingObligation = await this.getObligation(id);
    if (!existingObligation) return undefined;
    
    const updatedObligation: Obligation = { ...existingObligation, ...obligation };
    this.obligationsMap.set(id, updatedObligation);
    return updatedObligation;
  }

  async deleteObligation(id: number): Promise<boolean> {
    return this.obligationsMap.delete(id);
  }

  async getObligations(): Promise<Obligation[]> {
    return Array.from(this.obligationsMap.values());
  }

  // Company-Obligation relationship methods
  async assignObligationToCompany(data: InsertCompanyObligation): Promise<CompanyObligation> {
    const id = this.companyObligationId++;
    const companyObligation: CompanyObligation = { ...data, id };
    this.companyObligationsMap.set(id, companyObligation);
    return companyObligation;
  }

  async removeObligationFromCompany(companyId: number, obligationId: number): Promise<boolean> {
    const entry = Array.from(this.companyObligationsMap.entries()).find(
      ([_, co]) => co.companyId === companyId && co.obligationId === obligationId
    );
    
    if (entry) {
      return this.companyObligationsMap.delete(entry[0]);
    }
    
    return false;
  }

  async getCompanyObligations(companyId: number): Promise<Obligation[]> {
    const obligationIds = Array.from(this.companyObligationsMap.values())
      .filter(co => co.companyId === companyId)
      .map(co => co.obligationId);
    
    return obligationIds.map(id => this.obligationsMap.get(id)).filter(Boolean) as Obligation[];
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksMap.get(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const created = new Date();
    const updated = new Date();
    const newTask: Task = { ...task, id, created, updated };
    this.tasksMap.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = await this.getTask(id);
    if (!existingTask) return undefined;
    
    const updated = new Date();
    const updatedTask: Task = { ...existingTask, ...task, updated };
    this.tasksMap.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasksMap.delete(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasksMap.values());
  }

  async getTasksByCompany(companyId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).filter(task => task.companyId === companyId);
  }

  async getTasksByDepartment(departmentId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).filter(task => task.departmentId === departmentId);
  }

  async getTasksByResponsible(responsibleId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).filter(task => task.responsibleId === responsibleId);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).filter(task => task.status === status);
  }

  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.tasksMap.values()).filter(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  }

  async getTasksOverdue(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.tasksMap.values()).filter(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() < today.getTime() && task.status !== 'completed';
    });
  }

  // Task comments methods
  async addTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const id = this.taskCommentId++;
    const created = new Date();
    const newComment: TaskComment = { ...comment, id, created };
    this.taskCommentsMap.set(id, newComment);
    return newComment;
  }

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskCommentsMap.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => a.created.getTime() - b.created.getTime());
  }

  // Contract methods
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contractsMap.get(id);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const id = this.contractId++;
    const created = new Date();
    const updated = new Date();
    const newContract: Contract = { ...contract, id, created, updated };
    this.contractsMap.set(id, newContract);
    return newContract;
  }

  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existingContract = await this.getContract(id);
    if (!existingContract) return undefined;
    
    const updated = new Date();
    const updatedContract: Contract = { ...existingContract, ...contract, updated };
    this.contractsMap.set(id, updatedContract);
    return updatedContract;
  }

  async deleteContract(id: number): Promise<boolean> {
    return this.contractsMap.delete(id);
  }

  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contractsMap.values());
  }

  async getContractsByCompany(companyId: number): Promise<Contract[]> {
    return Array.from(this.contractsMap.values()).filter(contract => contract.companyId === companyId);
  }

  async getContractsByResponsible(responsibleId: number): Promise<Contract[]> {
    return Array.from(this.contractsMap.values()).filter(contract => contract.responsibleId === responsibleId);
  }

  async getContractsByStatus(status: string): Promise<Contract[]> {
    return Array.from(this.contractsMap.values()).filter(contract => contract.status === status);
  }

  // File methods
  async saveFile(file: InsertFile): Promise<File> {
    const id = this.fileId++;
    const uploaded = new Date();
    const newFile: File = { ...file, id, uploaded };
    this.filesMap.set(id, newFile);
    return newFile;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.filesMap.get(id);
  }

  async getTaskFiles(taskId: number): Promise<File[]> {
    return Array.from(this.filesMap.values()).filter(file => file.taskId === taskId);
  }

  async getContractFiles(contractId: number): Promise<File[]> {
    return Array.from(this.filesMap.values()).filter(file => file.contractId === contractId);
  }

  async getCompanyFiles(companyId: number): Promise<File[]> {
    return Array.from(this.filesMap.values()).filter(file => file.companyId === companyId);
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.filesMap.delete(id);
  }

  // Audit log methods
  async addAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogId++;
    const timestamp = new Date();
    const newLog: AuditLog = { ...log, id, timestamp };
    this.auditLogsMap.set(id, newLog);
    return newLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getEntityAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserAuditLogs(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
