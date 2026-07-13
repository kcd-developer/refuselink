export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(500).optional().default(''),
})

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }
    return entities[character] ?? character
  })
}

export async function POST(req: Request) {
  try {
    const parsed = contactSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 })
    }

    // Honeypot field: silently accept bot submissions without sending email.
    if (parsed.data.website) {
      return NextResponse.json({ success: true })
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.CONTACT_FROM_EMAIL
    const to = process.env.CONTACT_TO_EMAIL
    if (!apiKey || !from || !to) {
      console.error('Contact email is not configured')
      return NextResponse.json({ error: 'Email delivery is temporarily unavailable.' }, { status: 503 })
    }

    const { name, email, company, message } = parsed.data
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `New RefuseLink sales inquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || 'Not provided'}`,
        '',
        message,
      ].join('\n'),
      html: `
        <h2>New RefuseLink sales inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || 'Not provided')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    })

    if (error) {
      console.error('Resend contact email failed:', error)
      return NextResponse.json({ error: 'We could not send your message. Please email sales@refuselink.com directly.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form submission failed:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
