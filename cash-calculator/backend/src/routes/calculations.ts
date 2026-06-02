import { Router, type IRouter } from "express";
import { eq, desc, ilike, sql, or } from "drizzle-orm";
import { db, calculationsTable } from "@workspace/db";
import {
  ListCalculationsQueryParams,
  CreateCalculationBody,
  GetCalculationParams,
  DeleteCalculationParams,
  ListCalculationsResponse,
  GetCalculationResponse,
  ClearCalculationsResponse,
  DeleteCalculationResponse,
  GetCalculationStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calculations/stats", async (req, res): Promise<void> => {
  const rows = await db.select().from(calculationsTable);

  const totalCalculations = rows.length;
  const totalAmountProcessed = rows.reduce((sum, r) => sum + r.totalAmount, 0);
  const averageAmount = totalCalculations > 0 ? Math.round(totalAmountProcessed / totalCalculations) : 0;
  const largestCalculation = rows.reduce((max, r) => Math.max(max, r.totalAmount), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = rows.filter((r) => new Date(r.createdAt) >= today).length;

  const stats = GetCalculationStatsResponse.parse({
    totalCalculations,
    totalAmountProcessed,
    averageAmount,
    largestCalculation,
    todayCount,
  });

  res.json(stats);
});

router.get("/calculations", async (req, res): Promise<void> => {
  const parsed = ListCalculationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, limit = 50, offset = 0 } = parsed.data;

  let query = db.select().from(calculationsTable).$dynamic();

  if (search) {
    query = query.where(ilike(calculationsTable.label, `%${search}%`));
  }

  const rows = await query
    .orderBy(desc(calculationsTable.createdAt))
    .limit(limit ?? 50)
    .offset(offset ?? 0);

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(calculationsTable);
  const [countRow] = search
    ? await countQuery.where(ilike(calculationsTable.label, `%${search}%`))
    : await countQuery;

  const result = ListCalculationsResponse.parse({
    items: rows,
    total: Number(countRow.count),
  });

  res.json(result);
});

router.post("/calculations", async (req, res): Promise<void> => {
  const parsed = CreateCalculationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(calculationsTable)
    .values({
      label: parsed.data.label ?? null,
      denominations: parsed.data.denominations,
      totalAmount: parsed.data.totalAmount,
      totalNotes: parsed.data.totalNotes,
    })
    .returning();

  res.status(201).json(GetCalculationResponse.parse(row));
});

router.delete("/calculations", async (req, res): Promise<void> => {
  await db.delete(calculationsTable);
  res.json(ClearCalculationsResponse.parse({ success: true, message: "All calculations cleared" }));
});

router.get("/calculations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCalculationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(calculationsTable)
    .where(eq(calculationsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Calculation not found" });
    return;
  }

  res.json(GetCalculationResponse.parse(row));
});

router.delete("/calculations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCalculationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(calculationsTable)
    .where(eq(calculationsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Calculation not found" });
    return;
  }

  res.json(DeleteCalculationResponse.parse({ success: true, message: "Calculation deleted" }));
});

export default router;
