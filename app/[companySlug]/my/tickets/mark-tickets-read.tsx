'use client'

import { useEffect } from 'react'

export function MarkTicketsRead({ companySlug, ticketIds }: { companySlug: string; ticketIds: string[] }) {
  useEffect(() => {
    if (!ticketIds.length) return
    void fetch(`/api/company/${encodeURIComponent(companySlug)}/customer/tickets/mark-customer-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketIds }),
    }).then((response) => {
      if (response.ok) window.dispatchEvent(new Event('resident-tickets-read'))
    })
  }, [companySlug, ticketIds])
  return null
}
