import { PosComp,Vec2 } from "kaplay";
import { k } from "./main";

type allowedKey = string | number | symbol
export const entries = <K extends allowedKey,T>(obj: Record<K,T>)=>Object.entries(obj) as [K,T][]
export const fromEntries = <K extends allowedKey,T>(arr: [K,T][])=>Object.entries(arr) as Record<K,T>
export const keys = <K extends allowedKey>(obj: Record<K, unknown>)=>Object.keys(obj) as K[]
export const values = <T>(obj: Record<any, T>)=>Object.values(obj) as T[]

export const promisify = <T = void>(fn: (handler: (e: T)=>void)=>unknown)=>()=>new Promise<T>(res=>fn(res))
export function print<T>(inp: T){
  console.log(inp)
  return inp
}

type DynamicState = {
  value: number
  Dvalue: number
  target: number
}
type DynamicConst = {
  c1: number
  c2: number
}

const calculateConst = (damp: number, speed: number): DynamicConst=>({
  c1 : damp / (Math.PI * speed),
  c2 : 1 / (2 * Math.PI * speed) ** 2
})

function updateDynamics(state: DynamicState, constants: DynamicConst): DynamicState{
  const { value, Dvalue, target } = state
  const { c1, c2 } = constants

  const dt = k.dt()
  const k2 = Math.max( c2, dt*dt/2 + dt*c1/2, dt*c1)

  return {
    value: value + dt * (Dvalue),
    Dvalue: Dvalue + dt * ( target - value - c1 * Dvalue ) / k2,
    target
  }
}

export type SmoothMoveComp = PosComp & {
  target: Vec2
  state: {
    x: DynamicState
    y: DynamicState
  }
  constants: DynamicConst
  teleportTo(x: number, y: number):void
  smoothTo(x: number, y: number):void
  smoothBy(x: number, y: number):void

  teleportToV(vec2: Vec2): void
  smoothToV(vec2: Vec2): void
  smoothByV(vec2: Vec2): void
}

export const smoothMove = (x:number, y:number, damp: number, speed: number): SmoothMoveComp=>({
  id: "smoothMove",

  constants: calculateConst(damp, speed),
  state: {
    x: {
      value: x,
      Dvalue: 0,
      target: x
    },
    y: {
      value: y,
      Dvalue: 0,
      target: y
    }
  },

  update(){ 
    this.state.x.value = this.pos.x
    this.state.y.value = this.pos.y
    this.state.x = updateDynamics(this.state.x, this.constants)
    this.state.y = updateDynamics(this.state.y, this.constants)
    this.moveTo(this.state.x.value, this.state.y.value)
  },

  set target(vec: Vec2){
    this.state.x.target = vec.x
    this.state.y.target = vec.y
  },
  get target(){
    return k.vec2(this.state.x.target, this.state.y.target)
  },

  teleportTo(x:number, y: number) {
    this.teleportToV(k.vec2(x,y))
  },
  smoothTo(x: number, y: number) {
    this.smoothToV(k.vec2(x,y))
  },
  smoothBy(x: number, y: number) {
    this.smoothByV(k.vec2(x,y))
  },
  smoothByV(vec: Vec2) {
    this.target = this.target.add(vec)
  },
  smoothToV(vec: Vec2) {
    this.target = vec
  },
  teleportToV(vec: Vec2) {
    this.target = vec
    this.moveTo(vec)
  },

  ...k.pos(x,y)
})
