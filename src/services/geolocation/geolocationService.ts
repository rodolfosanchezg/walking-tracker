import type { GeolocationCallbacks, GeolocationError, GeolocationService, RawPosition } from './types'

/** Ajustables por inicio; timeout se omite para conservar el valor nativo. */
export const DEFAULT_GEOLOCATION_OPTIONS: Readonly<PositionOptions> = Object.freeze({
  enableHighAccuracy: true,
  maximumAge: 0,
})

type GeolocationApi = Pick<Geolocation, 'watchPosition' | 'clearWatch'>

function normalizePosition(position: GeolocationPosition): RawPosition {
  const { latitude, longitude, altitude, accuracy, speed } = position.coords
  return { latitude, longitude, altitude, accuracy, speed, timestamp: position.timestamp }
}

function normalizeError(error: GeolocationPositionError): GeolocationError {
  const kind = error.code === 1 ? 'permission-denied'
    : error.code === 2 ? 'position-unavailable'
      : error.code === 3 ? 'timeout' : 'unknown'
  return { kind, code: error.code, message: error.message }
}

/** Sin acceso al navegador al importar; admite inyección para pruebas aisladas. */
export function createGeolocationService(injectedApi?: GeolocationApi): GeolocationService {
  let observation: { api: GeolocationApi; watchId: number | null } | undefined

  return {
    start(callbacks: GeolocationCallbacks, options: PositionOptions = {}) {
      if (observation) return false
      const api = injectedApi ?? (typeof navigator === 'undefined' ? undefined : navigator.geolocation)
      if (!api) {
        callbacks.onError({ kind: 'unsupported', code: null, message: 'Geolocation API unavailable' })
        return false
      }

      const current = { api, watchId: null as number | null }
      observation = current
      try {
        current.watchId = api.watchPosition(
          (position) => {
            if (observation === current) callbacks.onPosition(normalizePosition(position))
          },
          (error) => {
            if (observation === current) callbacks.onError(normalizeError(error))
          },
          { ...DEFAULT_GEOLOCATION_OPTIONS, ...options },
        )
      } catch (error) {
        if (observation === current) observation = undefined
        // Fallos síncronos inesperados no se convierten en errores GPS inventados.
        throw error
      }
      // También libera el ID si un callback síncrono de un adaptador llamó stop().
      if (observation !== current) api.clearWatch(current.watchId)
      return observation === current
    },

    stop() {
      const current = observation
      observation = undefined
      if (current?.watchId != null) current.api.clearWatch(current.watchId)
    },
  }
}
