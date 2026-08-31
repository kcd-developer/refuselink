CREATE TABLE IF NOT EXISTS "ManagerTicketRead" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "customerUserId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagerTicketRead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ManagerTicketRead_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ManagerTicketRead_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ManagerTicketRead_ticketId_customerUserId_key"
ON "ManagerTicketRead"("ticketId", "customerUserId");

CREATE INDEX IF NOT EXISTS "ManagerTicketRead_customerUserId_idx"
ON "ManagerTicketRead"("customerUserId");
