export interface Place {
  id: string;
  name: string;
  tokens: number;
  x: number;
  y: number;
}

export interface Transition {
  id: string;
  name: string;
  enabled: boolean;
  x: number;
  y: number;
}

export interface Arc {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: 'normal' | 'inhibitor';
}

export interface PetriNet {
  places: Place[];
  transitions: Transition[];
  arcs: Arc[];
}

export interface IrrigationState {
  zones: number;
  reservoirLevel: number;
  emergency: boolean;
  soilDry: boolean[];
  autoMode: boolean;
}