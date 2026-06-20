import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Appointment } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractRegion(address: string): string {
  if (!address) return "其他区域"
  const match = address.match(/^(?:\w+市)?([\u4e00-\u9fa5]+区)/)
  if (match) return match[1]
  const roadMatch = address.match(/([\u4e00-\u9fa5]+(路|街|大道|巷|弄))/)
  if (roadMatch) return `${roadMatch[1]}片区`
  return "其他区域"
}

export function groupAppointmentsByRegion(appointments: Appointment[]): Map<string, Appointment[]> {
  const groups = new Map<string, Appointment[]>()
  for (const appt of appointments) {
    const region = appt.region ?? extractRegion(appt.address)
    if (!groups.has(region)) groups.set(region, [])
    groups.get(region)!.push(appt)
  }
  return groups
}

export function sortAppointmentsByTime(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => a.appointmentTime - b.appointmentTime)
}

export function optimizeRouteOrder(appointments: Appointment[]): Appointment[] {
  return sortAppointmentsByTime(appointments)
}

export interface RegionCluster {
  region: string
  appointments: Appointment[]
  totalWeight: number
  estimatedDistanceKm: number
}

export function clusterAppointmentsToRoutes(
  appointments: Appointment[],
  maxPerRoute: number = 6
): RegionCluster[] {
  const groups = groupAppointmentsByRegion(appointments)
  const clusters: RegionCluster[] = []
  for (const [region, appts] of groups) {
    const sorted = optimizeRouteOrder(appts)
    for (let i = 0; i < sorted.length; i += maxPerRoute) {
      const chunk = sorted.slice(i, i + maxPerRoute)
      clusters.push({
        region,
        appointments: chunk,
        totalWeight: chunk.reduce((s, a) => s + a.estimatedWeight, 0),
        estimatedDistanceKm: Math.round(chunk.length * 1.8 * 10) / 10,
      })
    }
  }
  return clusters
}
