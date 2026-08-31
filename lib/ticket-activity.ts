type TicketActivity = {
  messageCount: number
  latestMessage?: { authorType: string } | null
}

export function getTicketActivityLabel({ messageCount, latestMessage }: TicketActivity) {
  if (!latestMessage || messageCount <= 1) return 'New request'

  switch (latestMessage.authorType) {
    case 'customer':
      return 'Resident replied'
    case 'community_manager':
      return 'Manager responded'
    case 'employee':
      return 'KC Disposal responded'
    default:
      return 'Status updated'
  }
}
