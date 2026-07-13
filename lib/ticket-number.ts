import { prisma } from "@/lib/db";

export async function generateTicketNumber(companyId: string): Promise<string> {
  const lastTicket = await prisma.ticket.findFirst({
    where: { companyId },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  let nextNum = 1;
  if (lastTicket?.ticketNumber) {
    const match = lastTicket.ticketNumber.match(/TKT-(\d+)/);
    if (match?.[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `TKT-${String(nextNum).padStart(5, "0")}`;
}
