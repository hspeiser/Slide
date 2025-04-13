import { type CalculationSession, type InsertCalculationSession } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getCalculationSessions(): Promise<CalculationSession[]>;
  getCalculationSession(id: number): Promise<CalculationSession | undefined>;
  createCalculationSession(session: InsertCalculationSession): Promise<CalculationSession>;
  deleteCalculationSession(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private sessions: Map<number, CalculationSession>;
  currentId: number;

  constructor() {
    this.sessions = new Map();
    this.currentId = 1;
  }

  async getCalculationSessions(): Promise<CalculationSession[]> {
    return Array.from(this.sessions.values());
  }

  async getCalculationSession(id: number): Promise<CalculationSession | undefined> {
    return this.sessions.get(id);
  }

  async createCalculationSession(insertSession: InsertCalculationSession): Promise<CalculationSession> {
    const id = this.currentId++;
    const session: CalculationSession = { ...insertSession, id };
    this.sessions.set(id, session);
    return session;
  }

  async deleteCalculationSession(id: number): Promise<boolean> {
    if (!this.sessions.has(id)) {
      return false;
    }
    return this.sessions.delete(id);
  }
}

export const storage = new MemStorage();
