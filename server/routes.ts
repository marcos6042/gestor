import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import {
  insertCompanySchema,
  insertDepartmentSchema,
  insertUserDepartmentSchema,
  insertObligationSchema,
  insertCompanyObligationSchema,
  insertTaskSchema,
  insertTaskCommentSchema,
  insertContractSchema,
  insertFileSchema,
  insertUserSchema,
  insertSupplierSchema
} from "@shared/schema";

// Helper for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { dirname } from "path";

// Auth middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
};

// Role middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso proibido" });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Configure multer storage
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });

  const upload = multer({ 
    storage: storage_config,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from users
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários", error });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      // Remove password from user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário", error });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Only admins or the user themselves can update their profile
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Não autorizado a editar este usuário" });
      }

      // Validate input
      const validatedData = insertUserSchema.partial().parse(userData);

      // If password is being updated, hash it
      if (validatedData.password) {
        const { scrypt, randomBytes } = await import("crypto");
        const { promisify } = await import("util");
        const scryptAsync = promisify(scrypt);

        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(validatedData.password, salt, 64)) as Buffer;
        validatedData.password = `${buf.toString("hex")}.${salt}`;
      }

      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Create audit log
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "user",
        entityId: userId,
        details: `User ${updatedUser.username} updated`,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário", error });
    }
  });

  // Department routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar departamentos", error });
    }
  });

  app.post("/api/departments", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      // Validate input
      const departmentData = insertDepartmentSchema.parse(req.body);
      
      // Check if department already exists
      const existingDept = await storage.getDepartmentByName(departmentData.name);
      if (existingDept) {
        return res.status(400).json({ message: "Departamento com este nome já existe" });
      }
      
      const department = await storage.createDepartment(departmentData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "department",
        entityId: department.id,
        details: `Department ${department.name} created`,
      });
      
      res.status(201).json(department);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar departamento", error });
    }
  });

  app.get("/api/departments/:id", requireAuth, async (req, res) => {
    try {
      const department = await storage.getDepartment(parseInt(req.params.id));
      if (!department) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar departamento", error });
    }
  });

  app.put("/api/departments/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const deptId = parseInt(req.params.id);
      
      // Validate input
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      
      // Check if name is being changed and if it already exists
      if (departmentData.name) {
        const existingDept = await storage.getDepartmentByName(departmentData.name);
        if (existingDept && existingDept.id !== deptId) {
          return res.status(400).json({ message: "Departamento com este nome já existe" });
        }
      }
      
      const updatedDepartment = await storage.updateDepartment(deptId, departmentData);
      if (!updatedDepartment) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "department",
        entityId: deptId,
        details: `Department ${updatedDepartment.name} updated`,
      });
      
      res.json(updatedDepartment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar departamento", error });
    }
  });

  app.delete("/api/departments/:id", requireRole(["admin"]), async (req, res) => {
    try {
      const deptId = parseInt(req.params.id);
      
      // First check if department exists
      const department = await storage.getDepartment(deptId);
      if (!department) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      
      const deleted = await storage.deleteDepartment(deptId);
      if (!deleted) {
        return res.status(400).json({ message: "Não foi possível excluir o departamento" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "deleted",
        entityType: "department",
        entityId: deptId,
        details: `Department ${department.name} deleted`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir departamento", error });
    }
  });

  // User Department assignment routes
  app.post("/api/user-departments", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      // Validate input
      const assignmentData = insertUserDepartmentSchema.parse(req.body);
      
      // Check if user and department exist
      const user = await storage.getUser(assignmentData.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const department = await storage.getDepartment(assignmentData.departmentId);
      if (!department) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      
      // Assign user to department
      const result = await storage.assignUserToDepartment(assignmentData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "assigned",
        entityType: "user_department",
        entityId: result.id,
        details: `User ${user.username} assigned to department ${department.name}`,
      });
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao associar usuário ao departamento", error });
    }
  });

  app.delete("/api/user-departments", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const departmentId = parseInt(req.query.departmentId as string);
      
      if (isNaN(userId) || isNaN(departmentId)) {
        return res.status(400).json({ message: "IDs de usuário e departamento são necessários" });
      }
      
      // Check if user and department exist
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const department = await storage.getDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      
      // Remove user from department
      const result = await storage.removeUserFromDepartment(userId, departmentId);
      if (!result) {
        return res.status(404).json({ message: "Associação não encontrada" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "removed",
        entityType: "user_department",
        entityId: userId,
        details: `User ${user.username} removed from department ${department.name}`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover usuário do departamento", error });
    }
  });

  app.get("/api/users/:id/departments", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const departments = await storage.getUserDepartments(userId);
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar departamentos do usuário", error });
    }
  });

  app.get("/api/departments/:id/users", requireAuth, async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const users = await storage.getDepartmentUsers(departmentId);
      
      // Remove passwords from users
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários do departamento", error });
    }
  });

  // Company routes
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresas", error });
    }
  });

  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      // Validate input
      const companyData = insertCompanySchema.parse(req.body);
      
      // Check if company with CNPJ already exists
      const existingCompany = await storage.getCompanyByCnpj(companyData.cnpj);
      if (existingCompany) {
        return res.status(400).json({ message: "Empresa com este CNPJ já existe" });
      }
      
      const company = await storage.createCompany(companyData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "company",
        entityId: company.id,
        details: `Company ${company.name} created`,
      });
      
      res.status(201).json(company);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar empresa", error });
    }
  });

  app.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const company = await storage.getCompany(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresa", error });
    }
  });

  app.put("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Validate input
      const companyData = insertCompanySchema.partial().parse(req.body);
      
      // If CNPJ is being updated, check if it already exists
      if (companyData.cnpj) {
        const existingCompany = await storage.getCompanyByCnpj(companyData.cnpj);
        if (existingCompany && existingCompany.id !== companyId) {
          return res.status(400).json({ message: "Empresa com este CNPJ já existe" });
        }
      }
      
      const updatedCompany = await storage.updateCompany(companyId, companyData);
      if (!updatedCompany) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "company",
        entityId: companyId,
        details: `Company ${updatedCompany.name} updated`,
      });
      
      res.json(updatedCompany);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar empresa", error });
    }
  });

  app.delete("/api/companies/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      // Check if company exists
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      const deleted = await storage.deleteCompany(companyId);
      if (!deleted) {
        return res.status(400).json({ message: "Não foi possível excluir a empresa" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "deleted",
        entityType: "company",
        entityId: companyId,
        details: `Company ${company.name} deleted`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir empresa", error });
    }
  });

  // Obligation routes
  app.get("/api/obligations", requireAuth, async (req, res) => {
    try {
      const obligations = await storage.getObligations();
      res.json(obligations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar obrigações", error });
    }
  });

  app.post("/api/obligations", requireAuth, async (req, res) => {
    try {
      // Validate input
      const obligationData = insertObligationSchema.parse(req.body);
      
      const obligation = await storage.createObligation(obligationData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "obligation",
        entityId: obligation.id,
        details: `Obligation ${obligation.name} created`,
      });
      
      res.status(201).json(obligation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar obrigação", error });
    }
  });

  // Company Obligation assignment routes
  app.post("/api/company-obligations", requireAuth, async (req, res) => {
    try {
      // Validate input
      const assignmentData = insertCompanyObligationSchema.parse(req.body);
      
      // Check if company and obligation exist
      const company = await storage.getCompany(assignmentData.companyId);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      const obligation = await storage.getObligation(assignmentData.obligationId);
      if (!obligation) {
        return res.status(404).json({ message: "Obrigação não encontrada" });
      }
      
      // If responsible provided, check if user exists
      if (assignmentData.responsibleId) {
        const responsible = await storage.getUser(assignmentData.responsibleId);
        if (!responsible) {
          return res.status(404).json({ message: "Responsável não encontrado" });
        }
      }
      
      // Assign obligation to company
      const result = await storage.assignObligationToCompany(assignmentData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "assigned",
        entityType: "company_obligation",
        entityId: result.id,
        details: `Obligation ${obligation.name} assigned to company ${company.name}`,
      });
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao associar obrigação à empresa", error });
    }
  });

  app.get("/api/companies/:id/obligations", requireAuth, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const obligations = await storage.getCompanyObligations(companyId);
      res.json(obligations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar obrigações da empresa", error });
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const { companyId, departmentId, responsibleId, status } = req.query;
      
      let tasks;
      
      if (companyId) {
        tasks = await storage.getTasksByCompany(parseInt(companyId as string));
      } else if (departmentId) {
        tasks = await storage.getTasksByDepartment(parseInt(departmentId as string));
      } else if (responsibleId) {
        tasks = await storage.getTasksByResponsible(parseInt(responsibleId as string));
      } else if (status) {
        tasks = await storage.getTasksByStatus(status as string);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tarefas", error });
    }
  });

  app.get("/api/tasks/due-today", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksDueToday();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tarefas para hoje", error });
    }
  });

  app.get("/api/tasks/overdue", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksOverdue();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tarefas atrasadas", error });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      // Validate input
      const taskData = insertTaskSchema.parse(req.body);
      
      // Validate references
      if (taskData.companyId) {
        const company = await storage.getCompany(taskData.companyId);
        if (!company) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }
      }
      
      if (taskData.departmentId) {
        const department = await storage.getDepartment(taskData.departmentId);
        if (!department) {
          return res.status(404).json({ message: "Departamento não encontrado" });
        }
      }
      
      if (taskData.responsibleId) {
        const responsible = await storage.getUser(taskData.responsibleId);
        if (!responsible) {
          return res.status(404).json({ message: "Responsável não encontrado" });
        }
      }
      
      if (taskData.contractId) {
        const contract = await storage.getContract(taskData.contractId);
        if (!contract) {
          return res.status(404).json({ message: "Contrato não encontrado" });
        }
      }
      
      const task = await storage.createTask(taskData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "task",
        entityId: task.id,
        details: `Task ${task.title} created`,
      });
      
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar tarefa", error });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tarefa", error });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Validate input
      const taskData = insertTaskSchema.partial().parse(req.body);
      
      // Validate references
      if (taskData.companyId) {
        const company = await storage.getCompany(taskData.companyId);
        if (!company) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }
      }
      
      if (taskData.departmentId) {
        const department = await storage.getDepartment(taskData.departmentId);
        if (!department) {
          return res.status(404).json({ message: "Departamento não encontrado" });
        }
      }
      
      if (taskData.responsibleId) {
        const responsible = await storage.getUser(taskData.responsibleId);
        if (!responsible) {
          return res.status(404).json({ message: "Responsável não encontrado" });
        }
      }
      
      if (taskData.contractId) {
        const contract = await storage.getContract(taskData.contractId);
        if (!contract) {
          return res.status(404).json({ message: "Contrato não encontrado" });
        }
      }
      
      const updatedTask = await storage.updateTask(taskId, taskData);
      if (!updatedTask) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "task",
        entityId: taskId,
        details: `Task ${updatedTask.title} updated`,
      });
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar tarefa", error });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      
      const deleted = await storage.deleteTask(taskId);
      if (!deleted) {
        return res.status(400).json({ message: "Não foi possível excluir a tarefa" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "deleted",
        entityType: "task",
        entityId: taskId,
        details: `Task ${task.title} deleted`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir tarefa", error });
    }
  });

  // Task comments
  app.post("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      
      // Validate input
      const commentData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId,
        userId: req.user.id
      });
      
      const comment = await storage.addTaskComment(commentData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "commented",
        entityType: "task",
        entityId: taskId,
        details: `Comment added to task ${task.title}`,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar comentário", error });
    }
  });

  app.get("/api/tasks/:id/comments", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comentários", error });
    }
  });

  // Contract routes
  app.get("/api/contracts", requireAuth, async (req, res) => {
    try {
      const { companyId, responsibleId, status } = req.query;
      
      let contracts;
      
      if (companyId) {
        contracts = await storage.getContractsByCompany(parseInt(companyId as string));
      } else if (responsibleId) {
        contracts = await storage.getContractsByResponsible(parseInt(responsibleId as string));
      } else if (status) {
        contracts = await storage.getContractsByStatus(status as string);
      } else {
        contracts = await storage.getContracts();
      }
      
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar contratos", error });
    }
  });

  app.post("/api/contracts", requireAuth, async (req, res) => {
    try {
      // Validate input
      const contractData = insertContractSchema.parse(req.body);
      
      // Validate references
      const company = await storage.getCompany(contractData.companyId);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      if (contractData.responsibleId) {
        const responsible = await storage.getUser(contractData.responsibleId);
        if (!responsible) {
          return res.status(404).json({ message: "Responsável não encontrado" });
        }
      }
      
      if (contractData.departmentId) {
        const department = await storage.getDepartment(contractData.departmentId);
        if (!department) {
          return res.status(404).json({ message: "Departamento não encontrado" });
        }
      }
      
      const contract = await storage.createContract(contractData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "contract",
        entityId: contract.id,
        details: `Contract ${contract.title} created`,
      });
      
      res.status(201).json(contract);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar contrato", error });
    }
  });

  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const contract = await storage.getContract(parseInt(req.params.id));
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar contrato", error });
    }
  });

  app.put("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // Validate input
      const contractData = insertContractSchema.partial().parse(req.body);
      
      // Validate references
      if (contractData.companyId) {
        const company = await storage.getCompany(contractData.companyId);
        if (!company) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }
      }
      
      if (contractData.responsibleId) {
        const responsible = await storage.getUser(contractData.responsibleId);
        if (!responsible) {
          return res.status(404).json({ message: "Responsável não encontrado" });
        }
      }
      
      if (contractData.departmentId) {
        const department = await storage.getDepartment(contractData.departmentId);
        if (!department) {
          return res.status(404).json({ message: "Departamento não encontrado" });
        }
      }
      
      const updatedContract = await storage.updateContract(contractId, contractData);
      if (!updatedContract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "contract",
        entityId: contractId,
        details: `Contract ${updatedContract.title} updated`,
      });
      
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar contrato", error });
    }
  });

  app.delete("/api/contracts/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // Check if contract exists
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      
      const deleted = await storage.deleteContract(contractId);
      if (!deleted) {
        return res.status(400).json({ message: "Não foi possível excluir o contrato" });
      }
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "deleted",
        entityType: "contract",
        entityId: contractId,
        details: `Contract ${contract.title} deleted`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir contrato", error });
    }
  });

  // File upload and management
  app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const { taskId, contractId, companyId } = req.body;
      
      // Validate that at least one relationship is specified
      if (!taskId && !contractId && !companyId) {
        return res.status(400).json({ message: "Especifique tarefa, contrato ou empresa" });
      }
      
      // Validate references
      if (taskId) {
        const task = await storage.getTask(parseInt(taskId));
        if (!task) {
          return res.status(404).json({ message: "Tarefa não encontrada" });
        }
      }
      
      if (contractId) {
        const contract = await storage.getContract(parseInt(contractId));
        if (!contract) {
          return res.status(404).json({ message: "Contrato não encontrado" });
        }
      }
      
      if (companyId) {
        const company = await storage.getCompany(parseInt(companyId));
        if (!company) {
          return res.status(404).json({ message: "Empresa não encontrada" });
        }
      }
      
      // Prepare file data
      const fileData = insertFileSchema.parse({
        filename: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        type: req.file.mimetype,
        taskId: taskId ? parseInt(taskId) : null,
        contractId: contractId ? parseInt(contractId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        uploadedBy: req.user.id
      });
      
      const savedFile = await storage.saveFile(fileData);
      
      await storage.addAuditLog({
        userId: req.user.id,
        action: "uploaded",
        entityType: "file",
        entityId: savedFile.id,
        details: `File ${savedFile.filename} uploaded`,
      });
      
      res.status(201).json(savedFile);
    } catch (error) {
      res.status(500).json({ message: "Erro ao enviar arquivo", error });
    }
  });

  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const { taskId, contractId, companyId } = req.query;
      
      let files;
      
      if (taskId) {
        files = await storage.getTaskFiles(parseInt(taskId as string));
      } else if (contractId) {
        files = await storage.getContractFiles(parseInt(contractId as string));
      } else if (companyId) {
        files = await storage.getCompanyFiles(parseInt(companyId as string));
      } else {
        return res.status(400).json({ message: "Especifique tarefa, contrato ou empresa" });
      }
      
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar arquivos", error });
    }
  });

  app.get("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Check if file exists on disk
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor" });
      }
      
      res.sendFile(file.path);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar arquivo", error });
    }
  });

  // Audit logs
  app.get("/api/audit-logs", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar logs de auditoria", error });
    }
  });

  app.get("/api/audit-logs/entity/:type/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const { type, id } = req.params;
      const logs = await storage.getEntityAuditLogs(type, parseInt(id));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar logs de auditoria", error });
    }
  });

  app.get("/api/audit-logs/user/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const logs = await storage.getUserAuditLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar logs de auditoria", error });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      // Retrieve all suppliers
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar fornecedores", error });
    }
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      // Validate input
      const supplierData = insertSupplierSchema.parse(req.body);
      
      // Check if supplier with document already exists
      const existingSupplier = await storage.getSupplierByDocument(supplierData.document);
      if (existingSupplier) {
        return res.status(400).json({ message: "Fornecedor com este documento já existe" });
      }
      
      // Create supplier
      const supplier = await storage.createSupplier(supplierData);
      
      // Add audit log
      await storage.addAuditLog({
        userId: req.user.id,
        action: "created",
        entityType: "supplier",
        entityId: supplier.id,
        details: `Supplier ${supplier.name} created`,
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar fornecedor", error });
    }
  });

  app.get("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(parseInt(req.params.id));
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar fornecedor", error });
    }
  });

  app.patch("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      
      // Validate input
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      
      // If document is being updated, check if it already exists
      if (supplierData.document) {
        const existingSupplier = await storage.getSupplierByDocument(supplierData.document);
        if (existingSupplier && existingSupplier.id !== supplierId) {
          return res.status(400).json({ message: "Fornecedor com este documento já existe" });
        }
      }
      
      // Update supplier
      const updatedSupplier = await storage.updateSupplier(supplierId, supplierData);
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      // Add audit log
      await storage.addAuditLog({
        userId: req.user.id,
        action: "updated",
        entityType: "supplier",
        entityId: supplierId,
        details: `Supplier ${updatedSupplier.name} updated`,
      });
      
      res.json(updatedSupplier);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar fornecedor", error });
    }
  });

  app.delete("/api/suppliers/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      
      // Check if supplier exists
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      // Delete supplier
      const deleted = await storage.deleteSupplier(supplierId);
      if (!deleted) {
        return res.status(400).json({ message: "Não foi possível excluir o fornecedor" });
      }
      
      // Add audit log
      await storage.addAuditLog({
        userId: req.user.id,
        action: "deleted",
        entityType: "supplier",
        entityId: supplierId,
        details: `Supplier ${supplier.name} deleted`,
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir fornecedor", error });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
