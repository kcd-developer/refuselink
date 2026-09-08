interface CommunityContact {
  role: string
  publicEmail: string | null
  publicPhone: string | null
  showEmail: boolean
  showPhone: boolean
  shareEmailWithCommunity: boolean
  sharePhoneWithCommunity: boolean
}

export function visibleCommunityContact(contact: CommunityContact, viewerIsCommunityBoardMember: boolean) {
  const board = contact.role === 'board_member'
  return {
    publicEmail: (board ? viewerIsCommunityBoardMember || contact.shareEmailWithCommunity : contact.showEmail) ? contact.publicEmail : null,
    publicPhone: (board ? viewerIsCommunityBoardMember || contact.sharePhoneWithCommunity : contact.showPhone) ? contact.publicPhone : null,
  }
}
