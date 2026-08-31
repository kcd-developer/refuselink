'use client'

import { useEffect } from 'react'

export function MarkAnnouncementsRead({
  companySlug,
  companyAnnouncementIds,
  communityAnnouncementIds,
}: {
  companySlug: string
  companyAnnouncementIds: string[]
  communityAnnouncementIds: string[]
}) {
  useEffect(() => {
    if (!companyAnnouncementIds.length && !communityAnnouncementIds.length) return
    void fetch(`/api/company/${encodeURIComponent(companySlug)}/customer/announcements/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyAnnouncementIds, communityAnnouncementIds }),
    }).then((response) => {
      if (response.ok) window.dispatchEvent(new Event('announcements-read'))
    })
  }, [companySlug, companyAnnouncementIds, communityAnnouncementIds])

  return null
}
