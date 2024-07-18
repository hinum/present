import kaboom from "kaplay"
import { promisify } from "./utils"

const WIDTH = 128
const ASPECT_RATIO = (16 / 9)

export const k = kaboom({
  width: WIDTH,
  height: WIDTH * ASPECT_RATIO,
  scale: innerWidth / WIDTH
})

const awaitKeyPress = promisify(k.onKeyPress)

interface StateChange{
  prev(): StateChange
  next(): StateChange
}

async function scene1_title(): Promise<StateChange> {
  const initChange = {
    next(){ return initChange }, //TODO
    prev(){ return initChange }
  }

  return initChange
}