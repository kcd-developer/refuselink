import { getFileUrl } from '@/lib/supabase'

export async function signTicketAttachmentUrls<T extends { messages?: Array<{ attachments?: Array<{ fileUrl: string; mimeType: string }> }> }>(ticket: T): Promise<T> {
  const messages = await Promise.all((ticket.messages ?? []).map(async (message) => ({
    ...message,
    attachments: await Promise.all((message.attachments ?? []).map(async (attachment) => ({
      ...attachment,
      fileUrl: /^https?:\/\//i.test(attachment.fileUrl)
        ? attachment.fileUrl
        : await getFileUrl(attachment.fileUrl, attachment.mimeType, false),
    }))),
  })))

  return { ...ticket, messages } as T
}
