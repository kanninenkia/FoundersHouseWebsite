import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TRANSITION_TIMING } from './config'

type Phase = 'idle' | 'covering' | 'covered' | 'revealing'

interface TransitionContextValue {
  navigateWithTransition: (to: string) => void
  phase: Phase
  contentReady: boolean
  revealMaxDelayMs: number | undefined
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateWithTransition: () => {},
  phase: 'idle',
  contentReady: true,
  revealMaxDelayMs: undefined,
})

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<Phase>('idle')
  const [contentReady, setContentReady] = useState(true)
  const [revealMaxDelayMs, setRevealMaxDelayMs] = useState<number | undefined>(undefined)
  const skipRevealRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const phaseRef = useRef<Phase>('idle')

  const {
    maxDelayMs,
    pixelHoldMs,
    newPageDelayMs,
    pixelRevealDelayMs,
    overlayFadeMs,
    maxTransitionMs,
  } = TRANSITION_TIMING
  const totalCoverMs = maxDelayMs + pixelHoldMs

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const navigateWithTransition = useCallback((to: string) => {
    if (phaseRef.current !== 'idle') return
    if (to === location.pathname) return

    const goingToMap = to === '/'
    const isHomePage = to === '/home'
    // Home page gets a longer pixel-in stagger (900ms vs 600ms) to match its longer visual buildup
    const effectiveRevealMaxDelayMs = isHomePage ? 900 : maxDelayMs
    skipRevealRef.current = goingToMap
    clearTimers()

    setRevealMaxDelayMs(isHomePage ? 900 : undefined)

    // Phase 1: Cover screen with pixel-out (content stays visible while pixels cover)
    setPhaseSync('covering')

    // Phase 2: After cover completes, hide old content, navigate, mount new page hidden
    const coverTimer = window.setTimeout(() => {
      setPhaseSync('covered')
      setContentReady(false)  // hide content only once pixels fully cover the screen
      window.scrollTo(0, 0)
      navigate(to)

      if (goingToMap) {
        // Map page: skip reveal, go idle after brief pause
        const doneTimer = window.setTimeout(() => {
          setPhaseSync('idle')
          setContentReady(true)
          setRevealMaxDelayMs(undefined)
        }, newPageDelayMs)
        timersRef.current.push(doneTimer)
      } else {
        // Phase 3: Reveal new page with pixel-in
        const revealTimer = window.setTimeout(() => {
          setPhaseSync('revealing')
          setContentReady(true)

          // Phase 4: Reveal complete, back to idle
          const doneTimer = window.setTimeout(() => {
            setPhaseSync('idle')
            setRevealMaxDelayMs(undefined)
          }, effectiveRevealMaxDelayMs + overlayFadeMs)
          timersRef.current.push(doneTimer)
        }, newPageDelayMs + pixelRevealDelayMs)
        timersRef.current.push(revealTimer)
      }
    }, totalCoverMs)
    timersRef.current.push(coverTimer)

    // Watchdog: force idle after max time
    const watchdog = window.setTimeout(() => {
      setPhaseSync('idle')
      setContentReady(true)
    }, maxTransitionMs)
    timersRef.current.push(watchdog)
  }, [location.pathname, navigate, totalCoverMs, newPageDelayMs, pixelRevealDelayMs, maxDelayMs, overlayFadeMs, maxTransitionMs])

  // Expose on window for LoadingScreen compatibility
  useEffect(() => {
    ;(window as any).navigateWithTransition = navigateWithTransition
    return () => {
      delete (window as any).navigateWithTransition
    }
  }, [navigateWithTransition])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [])

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, phase, contentReady, revealMaxDelayMs }}>
      {children}
    </TransitionContext.Provider>
  )
}

export const useTransition = () => useContext(TransitionContext)
