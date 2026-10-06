export type WakeLockResult =
  | { ok: true }
  | { ok: false; error: { kind: 'unsupported' | 'request-failed' | 'release-failed' | 'already-released'; name: string; message: string } }

export interface WakeLockService {
  isSupported(): boolean
  isActive(): boolean
  request(): Promise<WakeLockResult>
  release(): Promise<WakeLockResult>
  subscribeRelease(callback: () => void): () => void
  /** Cancela notificaciones y libera el lock, incluso con una solicitud pendiente. */
  cleanup(): Promise<WakeLockResult>
}

type WakeLockApi = Pick<WakeLock, 'request'>

function failure(kind: 'request-failed' | 'release-failed', cause: unknown): WakeLockResult {
  // DOMException y errores de otros realms no siempre cumplen instanceof Error.
  const name = typeof cause === 'object' && cause !== null && 'name' in cause
    && typeof cause.name === 'string' ? cause.name : 'UnknownError'
  const message = typeof cause === 'object' && cause !== null && 'message' in cause
    && typeof cause.message === 'string' ? cause.message : String(cause)
  return { ok: false, error: {
    kind, name, message,
  } }
}

/** Sin solicitudes al importar/construir ni integración con visibilidad o settings. */
export function createWakeLockService(injectedApi?: WakeLockApi): WakeLockService {
  const getApi = () => injectedApi ?? (typeof navigator === 'undefined' ? undefined : navigator.wakeLock)
  let current: { sentinel: WakeLockSentinel; listener: () => void } | undefined
  const subscribers = new Set<{ callback: () => void }>()
  let queue: Promise<void> = Promise.resolve()

  function enqueue(operation: () => Promise<WakeLockResult>): Promise<WakeLockResult> {
    const result = queue.then(operation)
    queue = result.then(() => undefined, () => undefined)
    return result
  }

  function finish(record: NonNullable<typeof current>) {
    if (current !== record) return
    current = undefined
    record.sentinel.removeEventListener('release', record.listener)
    for (const subscription of [...subscribers]) {
      if (subscribers.has(subscription)) subscription.callback()
    }
  }

  function release(): Promise<WakeLockResult> {
    return enqueue(async () => {
      const record = current
      if (!record) return { ok: true }
      try {
        if (!record.sentinel.released) await record.sentinel.release()
      } catch (cause) {
        return failure('release-failed', cause)
      }
      finish(record)
      return { ok: true }
    })
  }

  return {
    isSupported: () => typeof getApi()?.request === 'function',
    isActive: () => current !== undefined && !current.sentinel.released,
    request() {
      return enqueue(async () => {
        if (current && !current.sentinel.released) return { ok: true }
        if (current) finish(current)
        const api = getApi()
        if (typeof api?.request !== 'function') {
          return { ok: false, error: { kind: 'unsupported', name: 'NotSupportedError', message: 'Screen Wake Lock API unavailable' } }
        }
        let sentinel: WakeLockSentinel
        try {
          sentinel = await api.request('screen')
        } catch (cause) {
          return failure('request-failed', cause)
        }
        if (sentinel.released) {
          return { ok: false, error: { kind: 'already-released', name: 'InvalidStateError', message: 'Wake Lock already released' } }
        }
        const record = { sentinel, listener: () => finish(record) }
        current = record
        sentinel.addEventListener('release', record.listener)
        return { ok: true }
      })
    },
    release,
    subscribeRelease(callback) {
      const subscription = { callback }
      subscribers.add(subscription)
      return () => { subscribers.delete(subscription) }
    },
    cleanup() {
      subscribers.clear()
      return release()
    },
  }
}
