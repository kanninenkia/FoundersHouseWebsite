/**
 * Auto Tour Manager
 * Handles automatic POI tour cycling functionality
 */
import { POINTS_OF_INTEREST } from '../../constants/poi'

export interface AutoTourConfig {
  enabled: boolean
  currentIndex: number
  poiSequence: Array<keyof typeof POINTS_OF_INTEREST>
  inactivityTimeout: number
  finalPoiPause: number
}

export class AutoTourManager {
  private timeout: number | null = null
  private inactivityTimer: number | null = null
  private lastInteractionTime: number = 0
  private isWaitingForNextPOI: boolean = false

  public enabled: boolean = true
  public currentIndex: number = 0
  public readonly poiSequence: Array<keyof typeof POINTS_OF_INTEREST>
  public readonly inactivityTimeout: number
  public readonly finalPoiPause: number

  constructor(config?: Partial<AutoTourConfig>) {
    this.enabled = config?.enabled ?? false // Disable auto-tour by default
    this.currentIndex = config?.currentIndex ?? 0
    this.poiSequence = config?.poiSequence ?? [
      'SUPERCELL',
      'AIVEN',
      'TOM',
      'METACORE',
      'IXI',
      'FOUNDERS_HOUSE',
      'VARJO',
      'OURA',
      'DISTANCE',
      'SWARMIA',
    ]
    this.inactivityTimeout = config?.inactivityTimeout ?? 35000 // 35 seconds as requested
    this.finalPoiPause = config?.finalPoiPause ?? 3000
  }

  /**
   * Start the auto-tour from the beginning
   */
  public start(onFlyToNext: () => void): void {
    this.currentIndex = 0
    this.isWaitingForNextPOI = true

    // Wait 1.5 seconds before starting tour
    this.timeout = window.setTimeout(() => {
      this.isWaitingForNextPOI = false
      onFlyToNext()
    }, 1500)
  }

  /**
   * Stop the auto-tour (does NOT reset currentIndex)
   */
  public stop(): void {
    this.enabled = false
    this.isWaitingForNextPOI = false
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  /**
   * Get the next POI in the sequence or null if tour is complete
   */
  public getNextPOI(): keyof typeof POINTS_OF_INTEREST | null {
    if (this.currentIndex >= this.poiSequence.length) {
      return null
    }
    return this.poiSequence[this.currentIndex]
  }

  /**
   * Advance to next POI in sequence
   */
  public advance(): void {
    this.currentIndex++
  }

  /**
   * Check if tour is complete (all POIs visited)
   */
  public isComplete(): boolean {
    return this.currentIndex >= this.poiSequence.length
  }

  /**
   * Reset tour to beginning
   */
  public reset(): void {
    this.currentIndex = 0
  }

  /**
   * Schedule next POI transition with delay
   */
  public scheduleNext(onFlyToNext: () => void, delay: number = 1500): void {
    if (!this.enabled) {
      this.isWaitingForNextPOI = false
      return
    }

    this.isWaitingForNextPOI = true
    this.timeout = window.setTimeout(() => {
      this.isWaitingForNextPOI = false
      onFlyToNext()
    }, delay)
  }

  /**
   * Handle tour completion - pause then restart
   */
  public handleCompletion(onRestart: () => void): void {
    this.isWaitingForNextPOI = true
    this.timeout = window.setTimeout(() => {
      this.reset()
      this.isWaitingForNextPOI = false
      onRestart()
    }, this.finalPoiPause)
  }

  /**
   * Start inactivity timer to resume tour after user stops interacting
   */
  public startInactivityTimer(onResume: () => void): void {
    this.clearInactivityTimer()
    this.lastInteractionTime = Date.now()

    this.inactivityTimer = window.setTimeout(() => {
      const timeSinceLastInteraction = Date.now() - this.lastInteractionTime

      if (timeSinceLastInteraction >= this.inactivityTimeout) {
        // Re-enable tour (keeping current index)
        this.enabled = true
        this.isWaitingForNextPOI = true

        // If at end, restart from beginning
        if (this.isComplete()) {
          this.reset()
        }

        // Resume tour after brief delay
        this.timeout = window.setTimeout(() => {
          this.isWaitingForNextPOI = false
          onResume()
        }, 500)
      }
    }, this.inactivityTimeout)
  }

  /**
   * Clear inactivity timer
   */
  public clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
  }

  /**
   * Update last interaction time
   */
  public recordInteraction(): void {
    this.lastInteractionTime = Date.now()
  }

  /**
   * Check if waiting between POI transitions
   */
  public isWaiting(): boolean {
    return this.isWaitingForNextPOI
  }

  /**
   * Set waiting state
   */
  public setWaiting(waiting: boolean): void {
    this.isWaitingForNextPOI = waiting
  }

  /**
   * Dispose of all timers
   */
  public dispose(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.clearInactivityTimer()
  }
}
