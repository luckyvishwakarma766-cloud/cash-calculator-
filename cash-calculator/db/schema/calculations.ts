import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calculationsTable = pgTable("calculations", {
  id: serial("id").primaryKey(),
  label: text("label"),
  denominations: jsonb("denominations").notNull(),
  totalAmount: integer("total_amount").notNull(),
  totalNotes: integer("total_notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCalculationSchema = createInsertSchema(calculationsTable).omit({ id: true, createdAt: true });
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type Calculation = typeof calculationsTable.$inferSelect;
