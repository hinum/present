import kaboom, { Vec2 } from "kaplay"
import { Color } from "kaplay/dist/declaration/math"
import { calculateConst, promisify, smoothMove } from "./utils"

const WIDTH = 100
const ASPECT_RATIO = (16 / 9)
const font = ""

export const k = kaboom({
  width: WIDTH,
  height: WIDTH * (1 / ASPECT_RATIO),
  scale: innerWidth / WIDTH,
})

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
  const mask = k.add([ smoothMove(center.x, center.y, damp, speed) ])
  const body = k.add([ k.pos(0,0) ])

  mask.onUpdate(()=>body.pos.y = mask.pos.y)

  k.loop(particle.spawnInterval, ()=>body.add([
    k.pos(center.x - radius - 20, particle.variationY * (Math.random() * 2 - 1)),
    k.move(k.RIGHT, particle.speed),
    k.lifespan((radius * 2 + 20) / particle.speed),
    k.color(particle.color),
    k.opacity(1),
    k.circle(0),
  ]))

  body.onUpdate(()=>body.children.forEach(child=>{
    const distanceRatio = 1 - Math.min(child.pos.sub(mask.pos.x, 0).len(), radius) / radius
    child.radius = k.easings.easeInOutSine(distanceRatio) * particle.radius
  }))

  return mask
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
    k.lifespan(110 / particle.speed),
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
  k.text("name", { size: 6, font}),
  k.anchor("center"),
  k.pos(k.center()),
  k.opacity(1),
  k.color(k.BLACK)
])
const nameTopText = k.add([
  k.text("presenting..", { size: 3, font}),
  k.anchor("bot"),
  k.pos(k.center().add(0, 7)),
  k.opacity(1),
  k.color(k.BLACK)
])

name.fadeIn(1)
k.wait(0.2, ()=>nameTopText.fadeIn(1))

const awaitNext = promisify(k.onClick)
async function main(){

  await awaitNext()

  cloudLeft.smoothBy( -60, 0 )
  cloudRight.smoothBy( 60, 0 )

  await k.wait(1.5)

  name.fadeOut(1)
  k.wait(0.2, ()=>nameTopText.fadeOut(1))
  bubbleLeft.smoothBy( -40, 0)
  bubbleRight.smoothBy( 40, 0)

  const sea = k.add([
    k.rect(100, 100),
    k.color(k.BLACK),
    smoothMove(0, k.height(), damp, speed)
  ])
  const boat = k.add([
    k.rect(10,10),
    k.color(k.BLACK),
    k.rotate(0),
    k.anchor("center"),
    smoothMove(60, k.height() + 5, 0.4, speed)
  ])
  const paragraph1 = `
uhhhhhhhhgh
uhhhhuyh
yeah :thumbsup:
`
  const paragraph = k.add([
    k.text(paragraph1, { size: 3, font}),
    k.anchor("botleft"),
    k.pos(5, k.height()-15),
    k.opacity(1),
    k.color(k.BLACK)
  ])

  cloudLeft.teleportTo( -20,10)
  cloudRight.teleportTo( 120,30)

  await k.wait(1)
  sea.smoothBy( 0, -10 )
  cloudLeft.smoothBy( 40, 0)
  cloudRight.smoothBy(-40, 0)

  await k.wait(1.5)
  boat.smoothBy(0,-16)

  await awaitNext()
  const boatLastPos = boat.pos.clone()
  
  k.tween(0,1, 2, t=>{
    boat.teleportToV(k.lerp( boatLastPos, k.vec2( 60, 70 ), t ))
    boat.angle = k.lerp(0,90,t)
  }, k.easings.easeInExpo)
  await k.wait(1.5)

  await k.wait(1.5)
  sea.constants = calculateConst(1.7, 0.2)
  sea.smoothBy(0,-70)
  cloudLeft.smoothBy(-40, 0)
  cloudRight.smoothBy(40, 0)

}
main()


