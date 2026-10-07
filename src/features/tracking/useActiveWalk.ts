import { useEffect, useRef, useState } from 'react'
import type { ActiveWalkRuntime } from './activeWalkRuntime'

export const SNAPSHOT_INTERVAL_MS = 1000

export function useActiveWalk(runtime: ActiveWalkRuntime) {
  const [view, setView] = useState(() => runtime.getView())
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    const timer = setInterval(() => { runtime.refresh(); setView(runtime.getView()) }, SNAPSHOT_INTERVAL_MS)
    return () => { mounted.current = false; clearInterval(timer) }
  }, [runtime])
  const update = () => { if (mounted.current) setView(runtime.getView()) }
  return { view,
    start() { runtime.start(); update() },
    pause() { runtime.pause(); update() },
    resume() { runtime.resume(); update() },
    async finish() { const pending = runtime.finish(); update(); await pending; update() },
  }
}
