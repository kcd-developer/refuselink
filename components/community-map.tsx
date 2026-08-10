'use client'

import { useEffect, useRef } from 'react'

export interface CommunityMapPoint {
  id: string
  address: string
  address2: string | null
  latitude: number
  longitude: number
  services: Array<{ service: string; route: string | null; containerSize?: string | null; dayOfWeek: number }>
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const serviceLabels: Record<string, string> = { trash: 'Trash', recycling: 'Recycling', yard_waste: 'Yard Waste' }
export const routeColors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#be123c']

export function colorForRoute(route: string, routes: string[]) {
  return routeColors[Math.max(0, routes.indexOf(route)) % routeColors.length]
}

export function CommunityMap({ points, showRouteLabels = false }: { points: CommunityMapPoint[]; showRouteLabels?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !points.length) return
    let disposed = false
    let map: import('leaflet').Map | undefined
    const resizeMap = () => map?.invalidateSize({ animate: false })
    window.addEventListener('beforeprint', resizeMap)
    window.addEventListener('afterprint', resizeMap)

    void import('leaflet').then((L) => {
      if (disposed || !containerRef.current) return
      map = L.map(containerRef.current, { scrollWheelZoom: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const bounds = L.latLngBounds([])
      const routes = [...new Set(points.flatMap((point) => point.services.map((service) => service.route || 'Unassigned')))].sort()
      points.forEach((point) => {
        const location = L.latLng(point.latitude, point.longitude)
        bounds.extend(location)
        const popup = document.createElement('div')
        const heading = document.createElement('strong')
        heading.textContent = point.address
        popup.append(heading)
        if (point.address2) {
          popup.append(document.createElement('br'), document.createTextNode(point.address2))
        }
        point.services.forEach((service) => {
          popup.append(
            document.createElement('br'),
            document.createTextNode(`${serviceLabels[service.service] ?? service.service}: ${dayNames[service.dayOfWeek]}${service.route ? ` · ${service.route}` : ''}`),
          )
        })
        const route = point.services[0]?.route || 'Unassigned'
        const color = showRouteLabels ? colorForRoute(route, routes) : '#2563eb'
        const marker = L.circleMarker(location, {
          radius: 7,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(map!).bindPopup(popup)
        if (showRouteLabels) {
          marker.bindTooltip(route, { permanent: true, direction: 'top', offset: [0, -7], className: 'route-map-label' })
        }
      })

      if (points.length === 1) map.setView(bounds.getCenter(), 16)
      else map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
    })

    return () => {
      disposed = true
      window.removeEventListener('beforeprint', resizeMap)
      window.removeEventListener('afterprint', resizeMap)
      map?.remove()
    }
  }, [points, showRouteLabels])

  return <div ref={containerRef} className="h-[420px] w-full rounded-lg" aria-label="Community address map" />
}
