// ─── Base Entity Fields ───────────────────────────────────────────────────────
// All Prisma models inherit these fields via the schema.
// This interface mirrors the base fields on every model.

export interface BaseEntity {
  id:        string;       // cuid()
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null; // userId who created
  updatedBy: string | null; // userId who last updated
}

// Use in Prisma schema on every model:
// id        String   @id @default(cuid())
// createdAt DateTime @default(now())
// updatedAt DateTime @updatedAt
// createdBy String?
// updatedBy String?
