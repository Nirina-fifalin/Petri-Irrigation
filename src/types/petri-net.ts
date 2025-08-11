export type TransitionName =
  | 'inc_tank'
  | 'dec_tank'
  | 'toggle_emergency'
  | 'start_pump'
  | 'irrigate_zone1'
  | 'irrigate_zone2'

export type PetriMarking = {
  atRest: number
  reservoirOk: number
  zone1Watered: number
  zone2Watered: number
  pumpBusy: number
  emergency: number
  turnZone1: number
  turnZone2: number
  tankLevel: number
}