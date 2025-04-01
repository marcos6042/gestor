import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "taskflow-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Credenciais inválidas" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData: InsertUser & { departmentId?: string } = req.body;
      
      // Extract and remove departmentId from userData as it's not in the user schema
      const departmentId = userData.departmentId ? parseInt(userData.departmentId) : undefined;
      delete userData.departmentId;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Assign user to department if departmentId was provided
      if (departmentId) {
        try {
          await storage.assignUserToDepartment({
            userId: user.id,
            departmentId
          });
          
          // Create audit log for department assignment
          await storage.addAuditLog({
            userId: user.id,
            action: "assigned",
            entityType: "user_department",
            entityId: user.id,
            details: `User ${user.username} assigned to department ${departmentId}`,
          });
        } catch (error) {
          console.error("Failed to assign user to department:", error);
          // Continue anyway as user is created successfully
        }
      }
      
      // Create audit log for user creation
      await storage.addAuditLog({
        userId: user.id,
        action: "created",
        entityType: "user",
        entityId: user.id,
        details: `User ${user.username} created`,
      });
      
      // Log the user in after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Falha na autenticação" });
      
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        
        await storage.addAuditLog({
          userId: user.id,
          action: "logged_in",
          entityType: "user",
          entityId: user.id,
          details: `User ${user.username} logged in`,
        });
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Create audit log before logging out
    if (req.user) {
      storage.addAuditLog({
        userId: req.user.id,
        action: "logged_out",
        entityType: "user",
        entityId: req.user.id,
        details: `User ${req.user.username} logged out`,
      }).catch(console.error);
    }
    
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessionErr) => {
        if (sessionErr) return next(sessionErr);
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout bem-sucedido" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}
