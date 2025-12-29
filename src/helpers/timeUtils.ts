/**
 * Time Utilities
 * Handle timezone detection and day/night mode calculations
 */

import { TIME_CONFIG } from '../constants/designSystem'

/**
 * Check if it's currently night time in Helsinki
 * Night: 6:01 PM (18:00) to 7:59 AM (07:59)
 * Day: 8:00 AM (08:00) to 6:00 PM (18:00)
 */
export function isNightInHelsinki(): boolean {
  const now = new Date()
  const helsinkiTime = new Date(
    now.toLocaleString('en-US', { timeZone: TIME_CONFIG.timezone })
  )
  const hour = helsinkiTime.getHours()

  return hour >= TIME_CONFIG.dayEnd || hour < TIME_CONFIG.dayStart
}

