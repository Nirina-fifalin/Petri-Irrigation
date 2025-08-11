export type PetriMarking = {
  atRest: number;
  reservoirOk: number;
  zone1Watered: number;
  zone2Watered: number;
  pumpBusy: number;
  emergency: number;
  turnZone1: number;
  turnZone2: number;
  tankLevel: number;
};

export type TransitionName =
  | 'inc_tank'
  | 'dec_tank'
  | 'toggle_emergency'
  | 'start_pump'
  | 'irrigate_zone1'
  | 'irrigate_zone2'
  | 'to_atRest';

let currentMarking: PetriMarking = {
  atRest: 1,
  reservoirOk: 1,
  zone1Watered: 0,
  zone2Watered: 0,
  pumpBusy: 0,
  emergency: 0,
  turnZone1: 1,
  turnZone2: 0,
  tankLevel: 5,
};

export function getInitialMarking(): PetriMarking {
  return { ...currentMarking };
}

function consume(m: PetriMarking, key: keyof PetriMarking, amount = 1): void {
  m[key] = Math.max(0, m[key] - amount);
}

function produce(m: PetriMarking, key: keyof PetriMarking, amount = 1): void {
  m[key] = m[key] + amount;
}

export function applyTransition(transition: TransitionName): PetriMarking {
  const newMarking = { ...currentMarking };

  switch (transition) {
    case 'inc_tank':
      produce(newMarking, 'tankLevel');
      if (newMarking.tankLevel > 0) newMarking.reservoirOk = 1;
      break;

    case 'dec_tank':
      consume(newMarking, 'tankLevel');
      if (newMarking.tankLevel === 0) newMarking.reservoirOk = 0;
      break;

    case 'toggle_emergency':
      newMarking.emergency = newMarking.emergency ? 0 : 1;
      break;

    case 'start_pump':
      if (newMarking.emergency) throw new Error('Mode urgence actif');
      if (!newMarking.atRest) throw new Error('Système pas au repos');
      if (!newMarking.reservoirOk) throw new Error('Reservoir vide');
      
      consume(newMarking, 'atRest');
      consume(newMarking, 'reservoirOk');
      produce(newMarking, 'pumpBusy');
      break;

    case 'irrigate_zone1':
      if (!newMarking.pumpBusy) throw new Error('Pompe inactive');
      if (!newMarking.turnZone1) throw new Error('Pas le tour zone 1');
      if (newMarking.tankLevel <= 0) throw new Error('Plus d\'eau');
      
      consume(newMarking, 'tankLevel');
      produce(newMarking, 'zone1Watered');
      newMarking.turnZone1 = 0;
      newMarking.turnZone2 = 1;
      consume(newMarking, 'pumpBusy');
      break;

    case 'irrigate_zone2':
      if (!newMarking.pumpBusy) throw new Error('Pompe inactive');
      if (!newMarking.turnZone2) throw new Error('Pas le tour zone 2');
      if (newMarking.tankLevel <= 0) throw new Error('Plus d\'eau');
      
      consume(newMarking, 'tankLevel');
      produce(newMarking, 'zone2Watered');
      newMarking.turnZone2 = 0;
      newMarking.turnZone1 = 1;
      consume(newMarking, 'pumpBusy');
      break;

    case 'to_atRest':
      produce(newMarking, 'atRest');
      break;

    default:
      throw new Error(`Transition inconnue: ${transition}`);
  }

  currentMarking = newMarking;
  return { ...currentMarking };
}