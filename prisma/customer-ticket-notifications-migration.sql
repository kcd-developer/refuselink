CREATE TABLE IF NOT EXISTS "CustomerTicketRead" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerTicketRead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerTicketRead_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerTicketRead_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerTicketRead_ticketId_customerUserId_key"
ON "CustomerTicketRead"("ticketId", "customerUserId");

CREATE INDEX IF NOT EXISTS "CustomerTicketRead_customerUserId_idx"
ON "CustomerTicketRead"("customerUserId");
