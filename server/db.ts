import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, responderCommitments, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertResponderCommitment(input: {
  needId: string;
  responderId: number;
  evidenceKey?: string;
  evidenceUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  await db.insert(responderCommitments).values({
    needId: input.needId,
    responderId: input.responderId,
    status: "committed",
    evidenceKey: input.evidenceKey,
    evidenceUrl: input.evidenceUrl,
  }).onDuplicateKeyUpdate({
    set: {
      status: "committed",
      evidenceKey: input.evidenceKey,
      evidenceUrl: input.evidenceUrl,
    },
  });
}

export async function getCommitmentSummary(needId: string, responderId?: number) {
  const db = await getDb();
  if (!db) return { committedCount: 0, currentResponderCommitted: false };

  const commitments = await db.select({ responderId: responderCommitments.responderId, status: responderCommitments.status })
    .from(responderCommitments)
    .where(and(eq(responderCommitments.needId, needId), eq(responderCommitments.status, "committed")));

  return {
    committedCount: commitments.length,
    currentResponderCommitted: responderId ? commitments.some(commitment => commitment.responderId === responderId) : false,
  };
}

export async function getCommitmentSummaries(needIds: string[], responderId?: number) {
  if (needIds.length === 0) return [];
  const db = await getDb();
  if (!db) return needIds.map(needId => ({ needId, committedCount: 0, currentResponderCommitted: false }));

  const commitments = await db.select({ needId: responderCommitments.needId, responderId: responderCommitments.responderId })
    .from(responderCommitments)
    .where(and(inArray(responderCommitments.needId, needIds), eq(responderCommitments.status, "committed")));

  return needIds.map(needId => {
    const matching = commitments.filter(commitment => commitment.needId === needId);
    return {
      needId,
      committedCount: matching.length,
      currentResponderCommitted: responderId ? matching.some(commitment => commitment.responderId === responderId) : false,
    };
  });
}
