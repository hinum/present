import kaboom, { Vec2 } from "kaplay"
import { Color } from "kaplay/dist/declaration/math"
import { promisify, smoothMove } from "./utils"

const WIDTH = 100
const ASPECT_RATIO = (16 / 9)

export const k = kaboom({
  width: WIDTH,
  height: WIDTH * (1 / ASPECT_RATIO),
  scale: innerWidth / WIDTH,
})

const waveParam = Array(4).fill(0).map(()=>[k.rand(0.4,0.8), k.rand(1,4), k.rand(1,4)])
//const waveHieghtAt = (x: number)=>(waveParam.reduce((pv, [a,w,p])=>pv + a * Math.sin(x * w + k.time() * p),0) * 0.1 + 0.6) * k.height()
//const dyWaveAt = (x: number)=>(waveParam.reduce((pv, [a,w,p])=>pv + a * Math.cos(x * w + k.time() * p),0) * 0.1 + 0.6) * k.height()

k.loadShader("waves", undefined, `
uniform float u_time;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
  float waveHeight = ${waveParam.map(([a,w,p])=>`${a.toFixed(2)} * sin(uv.x * ${w.toFixed(2)} + u_time * ${p.toFixed(2)})`).join(" + ")};
  float opacity = step( uv.y * 2.0, waveHeight * 0.75 + 1.0);

  return vec4(color.x, color.y, color.z, opacity);
}
`)

const damp = 2
const speed = 0.5
const makeClouds = (
  center: Vec2,
  radius: number,
  particle: {
    spawnInterval: number,
    variationY: number,
    radius: number,
    speed: number,
    color: Color
  }
)=>{
  const body = k.add([ smoothMove(center.x ,center.y, damp, speed) ])

  const loop = k.loop(particle.spawnInterval, ()=>body.add([
    k.pos(-radius, particle.variationY * (Math.random() * 2 - 1)),
    k.move(k.RIGHT, particle.speed),
    k.lifespan((radius * 2) / particle.speed),
    k.color(particle.color),
    k.opacity(1),
    k.circle(0),
  ]))
  body.onDestroy(()=>loop.cancel())

  body.onUpdate(()=>body.children.forEach(child=>{
    const distanceRatio = 1 - Math.min(child.pos.len(), radius) / radius
    child.radius = k.easings.easeInOutSine(distanceRatio) * particle.radius
  }))

  return body
}
const makeBubbleColumn = (
  spawnPoint: Vec2,
  particle: {
    spawnInterval: number,
    radius: number,
    speed: number,
    color: Color
  }
)=>{
  const body = k.add([ smoothMove(spawnPoint.x ,spawnPoint.y, damp, speed) ])

  const loop = k.loop(particle.spawnInterval, ()=>body.add([
    k.lifespan(90 / particle.speed),
    k.color(particle.color),
    k.circle(particle.radius * k.rand(1, 1.2)),
    k.opacity(1),
    k.pos(0,0),

    {rand: Math.random()}
  ]))
  body.onDestroy(()=>loop.cancel())

  body.onUpdate(()=>body.children.forEach(child=>
    child.move(Math.sin(k.time() * k.lerp(1, 2, child.rand)) * k.lerp(4,6, child.rand), -particle.speed)))

  return body
}

const cloudOpts = {
  speed: 6,
  radius: 4,
  spawnInterval: 0.4,
  variationY: 5,
  color: k.rgb(0,0,0)
}
const cloudLeft = makeClouds( k.vec2(20, 40), 20, cloudOpts )
const cloudRight= makeClouds( k.vec2(80, 10), 20, cloudOpts )

const bubbleOpts = {
  spawnInterval: 1.25,
  radius: 3,
  speed: 10,
  color: k.BLACK
}
const bubbleLeft = makeBubbleColumn( k.vec2(20, 70), bubbleOpts )
const bubbleRight= makeBubbleColumn( k.vec2(80, 90), bubbleOpts )

const name = k.add([
  k.text("name", { size: 6 }),
  k.anchor("center"),
  k.pos(k.center()),
  k.opacity(1),
  k.color(k.BLACK)
])

const awaitNext = promisify(k.onClick)
async function main(){

  await awaitNext()

  cloudLeft.smoothBy( -40, 0 )
  cloudRight.smoothBy( 40, 0 )

  await k.wait(1.5)

  name.fadeOut(1)
  bubbleLeft.smoothBy( -40, 0)
  bubbleRight.smoothBy( 40, 0)

  const sea = k.add([
    k.rect(100, 10),
    k.color(k.BLACK),
    k.anchor("botleft"),
    smoothMove(0, k.height() + 10, damp, speed)
  ])
  cloudLeft.teleportTo( -20,40)
  cloudRight.teleportTo( 120,30)

  await k.wait(1)
  sea.smoothBy( 0, -10 )
  cloudLeft.smoothBy( 40, 0)
  cloudRight.smoothBy(-40, 0)

}
main()


