import { pgTable, text, serial, integer, boolean, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Role Enum
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "employee", "client"]);

// Supplier Type Enum
export const supplierTypeEnum = pgEnum("supplier_type", ["contractor", "supplier", "service_provider", "other"]);

// Tax Regime Enum
export const taxRegimeEnum = pgEnum("tax_regime", ["simples", "presumido", "real", "scp"]);

// Task Status Enum
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "client_pending", "overdue"]);

// Contract Status Enum
export const contractStatusEnum = pgEnum("contract_status", ["active", "renewed", "expired", "terminated"]);

// Contract Type Enum
export const contractTypeEnum = pgEnum("contract_type", ["service", "supply", "lease", "other"]);

// Recurrence Enum
export const recurrenceEnum = pgEnum("recurrence", ["none", "daily", "weekly", "monthly", "bimonthly", "quarterly", "semiannual", "annual"]);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  photo: text("photo"),
  position: text("position"),
  role: userRoleEnum("role").notNull().default("employee"),
});

// Departments Table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

// User Department Relationship (Many-to-Many)
export const userDepartments = pgTable("user_departments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  departmentId: integer("department_id").notNull().references(() => departments.id),
});

// Companies Table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  taxRegime: taxRegimeEnum("tax_regime").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
});

// Suppliers/Contractors Table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: supplierTypeEnum("type").notNull(),
  document: text("document").notNull().unique(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
});

// Obligations Table
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dueDay: integer("due_day").notNull(),
  recurrence: recurrenceEnum("recurrence").notNull(),
});

// Company Obligations (Many-to-Many)
export const companyObligations = pgTable("company_obligations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  obligationId: integer("obligation_id").notNull().references(() => obligations.id),
  responsibleId: integer("responsible_id").references(() => users.id),
});

// Tasks Table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  competenceMonth: integer("competence_month").notNull(),
  competenceYear: integer("competence_year").notNull(),
  recurrence: recurrenceEnum("recurrence").notNull().default("none"),
  status: taskStatusEnum("status").notNull().default("pending"),
  companyId: integer("company_id").references(() => companies.id),
  departmentId: integer("department_id").references(() => departments.id),
  responsibleId: integer("responsible_id").references(() => users.id),
  contractId: integer("contract_id").references(() => contracts.id),
  created: timestamp("created").notNull().defaultNow(),
  updated: timestamp("updated").notNull().defaultNow(),
});

// Task Comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  created: timestamp("created").notNull().defaultNow(),
});

// Contracts Table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contractType: contractTypeEnum("contract_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  value: text("value").notNull(),
  adjustmentInfo: text("adjustment_info"),
  status: contractStatusEnum("status").notNull().default("active"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  responsibleId: integer("responsible_id").references(() => users.id),
  departmentId: integer("department_id").references(() => departments.id),
  filePath: text("file_path"),
  created: timestamp("created").notNull().defaultNow(),
  updated: timestamp("updated").notNull().defaultNow(),
});

// Files Table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  contractId: integer("contract_id").references(() => contracts.id),
  companyId: integer("company_id").references(() => companies.id),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploaded: timestamp("uploaded").notNull().defaultNow(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(["admin", "manager", "employee", "client"]),
}).omit({ id: true });

// Login Schema for Authentication
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Nome de usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type LoginData = z.infer<typeof loginSchema>;

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });

export const insertUserDepartmentSchema = createInsertSchema(userDepartments).omit({ id: true });

export const insertCompanySchema = createInsertSchema(companies, {
  taxRegime: z.enum(["simples", "presumido", "real", "scp"]),
}).omit({ id: true });

export const insertSupplierSchema = createInsertSchema(suppliers, {
  type: z.enum(["contractor", "supplier", "service_provider", "other"]),
}).omit({ id: true });

export const insertObligationSchema = createInsertSchema(obligations, {
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "bimonthly", "quarterly", "semiannual", "annual"]),
}).omit({ id: true });

export const insertCompanyObligationSchema = createInsertSchema(companyObligations).omit({ id: true });

export const insertTaskSchema = createInsertSchema(tasks, {
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "bimonthly", "quarterly", "semiannual", "annual"]),
  status: z.enum(["pending", "in_progress", "completed", "client_pending", "overdue"]),
}).omit({ id: true, created: true, updated: true });

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, created: true });

export const insertContractSchema = createInsertSchema(contracts, {
  contractType: z.enum(["service", "supply", "lease", "other"]),
  status: z.enum(["active", "renewed", "expired", "terminated"]),
}).omit({ id: true, created: true, updated: true });

export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploaded: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type UserDepartment = typeof userDepartments.$inferSelect;
export type InsertUserDepartment = z.infer<typeof insertUserDepartmentSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Obligation = typeof obligations.$inferSelect;
export type InsertObligation = z.infer<typeof insertObligationSchema>;

export type CompanyObligation = typeof companyObligations.$inferSelect;
export type InsertCompanyObligation = z.infer<typeof insertCompanyObligationSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;


