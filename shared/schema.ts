import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const calculationSessions = pgTable("calculation_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  variables: jsonb("variables").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertCalculationSessionSchema = createInsertSchema(calculationSessions).pick({
  name: true,
  content: true,
  variables: true,
  createdAt: true,
});

export type InsertCalculationSession = z.infer<typeof insertCalculationSessionSchema>;
export type CalculationSession = typeof calculationSessions.$inferSelect;
