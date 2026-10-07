import { createDatabase } from '../../data/db/database'
import { createTrackingPersistenceStore } from '../../data/repositories/trackingPersistenceStore'
import { createPersistenceCoordinator } from './persistenceCoordinator'
import { createPersistentTrackingController } from './persistentTrackingController'
import { createTrackingController } from './trackingController'
import type { TrackingResult } from './trackingController'

export type PersistentController = ReturnType<typeof createPersistentTrackingController>

/** La conexión se crea al iniciar, nunca al renderizar ni al importar el módulo. */
function createController(): PersistentController {
  const database = createDatabase()
  const controller = createPersistentTrackingController(createPersistenceCoordinator(createTrackingPersistenceStore(database)))
  return { ...controller, async finish(...args: Parameters<typeof controller.finish>) {
    const result = await controller.finish(...args)
    if (result.persistence?.ok) database.close()
    return result
  } }
}

export function createActiveWalkRuntime(factory: () => PersistentController = createController,
  identity: () => string = () => crypto.randomUUID()) {
  const initial = createTrackingController().getSnapshot()
  let controller: PersistentController | undefined
  let actionError: string | null = null
  let finishing = false
  function getView() {
    return { snapshot: controller?.getSnapshot() ?? initial, persistence: controller?.getPersistenceState() ?? null,
      actionError, finishing }
  }
  function apply(action: () => TrackingResult) {
    if (finishing) return
    const result = action()
    actionError = result.ok ? null : result.error.kind
  }
  return {
    getView,
    start() {
      if (finishing) return
      try {
        if (!controller || controller.getPersistenceState().finalized) controller = factory()
        apply(() => controller!.start(identity()))
      } catch { actionError = 'start-failed' }
    },
    pause() { if (controller) apply(() => controller!.pause()) },
    resume() { if (controller) apply(() => controller!.resume()) },
    refresh() {
      if (!controller || finishing) return
      const status = controller.getSnapshot().session?.status
      if (status === 'active' || status === 'paused' || status === 'incomplete') {
        const result = controller.refresh()
        if (!result.ok) actionError = result.error.kind
        void controller.tick()
      }
    },
    async finish() {
      if (!controller || finishing) return
      finishing = true; actionError = null
      try {
        const result = await controller.finish()
        if (!result.tracking.ok) actionError = result.tracking.error.kind
        else if (result.persistence && !result.persistence.ok) actionError = 'persistence-failed'
      } catch { actionError = 'persistence-failed' }
      finally { finishing = false }
    },
  }
}
export type ActiveWalkRuntime = ReturnType<typeof createActiveWalkRuntime>
// Una sesión por pestaña: desmontar la vista no cancela una caminata del usuario.
export const activeWalkRuntime = createActiveWalkRuntime()
