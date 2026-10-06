export type VisibilityState = 'visible' | 'hidden' | 'unknown'

export interface VisibilityService {
  getCurrentState(): VisibilityState
  /** Escucha cambios futuros; devuelve cleanup idempotente de esta suscripción. */
  subscribe(callback: (state: VisibilityState) => void): () => void
}

type VisibilityDocument = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>

/** No registra listeners al importar ni construir. Admite documento inyectado. */
export function createVisibilityService(injectedDocument?: VisibilityDocument): VisibilityService {
  const source = injectedDocument ?? (typeof document === 'undefined' ? undefined : document)
  if (!source) throw new Error('Page Visibility requires a document')

  function getCurrentState(): VisibilityState {
    const state = source!.visibilityState
    return state === 'visible' || state === 'hidden' ? state : 'unknown'
  }

  return {
    getCurrentState,
    subscribe(callback) {
      let active = true
      const listener = () => {
        if (active) callback(getCurrentState())
      }
      source.addEventListener('visibilitychange', listener)

      return () => {
        if (!active) return
        active = false
        source.removeEventListener('visibilitychange', listener)
      }
    },
  }
}
