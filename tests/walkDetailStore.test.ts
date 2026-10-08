import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { createDatabase, ACTIVE_SESSION_KEY } from '../src/data/db/database'
import type { WalkingTrackerDatabase } from '../src/data/db/database'
import { createWalkDetailStore } from '../src/data/repositories/walkDetailStore'
import type { Walk } from '../src/types'
let db: WalkingTrackerDatabase, factory: IDBFactory
const metric = { value: null, estimated: false as const }
const walk: Walk = { id:'a',name:'Park',startedAt:1000,endedAt:4000,activeDurationMs:3000,totalDurationMs:3000,distanceMeters:metric,averageSpeedMetersPerSecond:metric,averagePaceSecondsPerKilometer:metric,elevationGainMeters:metric,elevationLossMeters:metric,status:'finished',isIncomplete:false }
beforeEach(async()=>{factory=new IDBFactory();db=createDatabase('detail-test',{indexedDB:factory,IDBKeyRange});await db.walks.add(walk);const point={timestamp:2000,latitude:0,longitude:0,altitude:100,speed:null,accuracy:5,estimated:false as const,quality:'valid' as const};await db.trackPoints.bulkAdd([{...point,id:'p',walkId:'a'},{...point,id:'q',walkId:'b'}])})
afterEach(async()=>{await db.delete();expect(await factory.databases()).toEqual([])})
test('get lee Walk/puntos correctos, sin tocar activeSession',async()=>{expect(await createWalkDetailStore(db).get('a')).toEqual({walk,points:[expect.objectContaining({id:'p',walkId:'a'})],metadata:undefined});expect(await db.activeSession.count()).toBe(0)})
test('get ausente no inventa caminata',async()=>{expect(await createWalkDetailStore(db).get('missing')).toBeUndefined()})
test('rename trim persiste tras reapertura y no modifica métricas/puntos',async()=>{expect(await createWalkDetailStore(db).rename('a',' New name ')).toBe('New name');db.close();db=createDatabase('detail-test',{indexedDB:factory,IDBKeyRange});expect((await createWalkDetailStore(db).get('a'))?.walk).toEqual({...walk,name:'New name'});expect(await db.trackPoints.count()).toBe(2)})
test('rename vacío/ausente rechaza sin crear registros',async()=>{await expect(createWalkDetailStore(db).rename('a',' ')).rejects.toThrow();await expect(createWalkDetailStore(db).rename('missing','name')).rejects.toThrow();expect(await db.walks.count()).toBe(1)})
test('metadatos de sesión disponibles se leen, rename se protege sin mutarla',async()=>{const session={walkId:'a',status:'incomplete' as const,startedAt:1000,stateChangedAt:1000,activeDurationMs:0,totalDurationMs:0,lastPersistedAt:1000,lastPointTimestamp:2000,pointMetadata:[{id:'p',segment:1,quality:'valid' as const}]};await db.activeSession.put(session,ACTIVE_SESSION_KEY);expect((await createWalkDetailStore(db).get('a'))?.metadata).toEqual(session.pointMetadata);await expect(createWalkDetailStore(db).rename('a','Changed')).rejects.toThrow();expect(await db.activeSession.get(ACTIVE_SESSION_KEY)).toEqual(session)})
