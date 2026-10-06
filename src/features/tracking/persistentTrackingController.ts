import { createTrackingController } from './trackingController'
import type { TrackingControllerOptions, TrackingResult } from './trackingController'
import { createGeolocationService } from '../../services/geolocation/geolocationService'
import { createPersistenceCoordinator } from './persistenceCoordinator'

/** Composición opcional T18; conserva el controlador T17 y su API síncrona. Una instancia por caminata. */
export function createPersistentTrackingController(
  persistence: ReturnType<typeof createPersistenceCoordinator>, options: TrackingControllerOptions = {},
) {
  const source = options.geolocation ?? createGeolocationService()
  let controller: ReturnType<typeof createTrackingController>
  controller = createTrackingController({ ...options, geolocation: {
    start(callbacks, settings) {
      return source.start({
        onPosition(position) { callbacks.onPosition(position); if (controller) void persistence.observe(controller.getSnapshot()) },
        onError(error) { callbacks.onError(error); if (controller) void persistence.observe(controller.getSnapshot()) },
      }, settings)
    }, stop: () => source.stop(),
  } })
  function observe(result: TrackingResult) { void persistence.observe(controller.getSnapshot()); return result }
  return {
    getSnapshot: controller.getSnapshot,
    getPersistenceState: persistence.getState,
    start(...args: Parameters<typeof controller.start>): TrackingResult {
      if (persistence.getState().disposed || persistence.getState().finalized || controller.getSnapshot().session?.status === 'finished') {
        return { ok: false, error: { kind: 'new-controller-required', message: 'Create a new coordinator/controller for the next walk' } }
      }
      return observe(controller.start(...args))
    },
    pause: (...args: Parameters<typeof controller.pause>) => observe(controller.pause(...args)),
    resume: (...args: Parameters<typeof controller.resume>) => observe(controller.resume(...args)),
    refresh: (...args: Parameters<typeof controller.refresh>) => observe(controller.refresh(...args)),
    tick: () => persistence.checkFlush(),
    forceFlush: persistence.forceFlush,
    async finish(...args: Parameters<typeof controller.finish>) {
      const result: TrackingResult = controller.getSnapshot().session?.status === 'finished'
        ? { ok: true, value: controller.getSnapshot() } : controller.finish(...args)
      if (!result.ok) return { tracking: result, persistence: null }
      return { tracking: result, persistence: await persistence.finalize(controller.getSnapshot()) }
    },
    stop: (...args: Parameters<typeof controller.stop>) => observe(controller.stop(...args)),
    async cleanup(...args: Parameters<typeof controller.cleanup>) {
      const result = observe(controller.cleanup(...args))
      return { tracking: result, persistence: await persistence.cleanup() }
    },
    async cancel() {
      // Guarda primero como incompleta; nunca borra registros ni descarta un buffer fallido.
      const stopped = observe(controller.stop())
      const saved = await persistence.cleanup()
      if (!saved.ok || controller.getSnapshot().watcherActive) return { tracking: stopped, persistence: saved }
      return { tracking: controller.cancel(), persistence: saved }
    },
  }
}
