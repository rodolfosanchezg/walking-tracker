import { useEffect, useState } from 'react'
import type { ActiveWalkRuntime } from './activeWalkRuntime'

export const WALK_STATUS_INTERVAL_MS = 1000
export type WalkStatusReader = Pick<ActiveWalkRuntime, 'getView'>

/** Lectura únicamente; no refresh/tick ni acciones de tracking desde Home. */
export function useWalkStatus(runtime: WalkStatusReader) {
  const [view, setView] = useState(() => runtime.getView())
  useEffect(() => {
    const timer = setInterval(() => setView(runtime.getView()), WALK_STATUS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [runtime])
  return view
}
