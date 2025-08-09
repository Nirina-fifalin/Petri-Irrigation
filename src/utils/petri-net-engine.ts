"use client";

import { PetriNet, Place, Transition, Arc, IrrigationState } from '@/types/petri-net';

export class PetriNetEngine {
  private net: PetriNet;
  private state: IrrigationState;

  constructor(zones: number = 1) {
    this.state = {
      zones,
      reservoirLevel: 50,
      emergency: false,
      soilDry: new Array(zones).fill(false),
      autoMode: false
    };
    this.net = this.createIrrigationNet(zones);
  }

  private createIrrigationNet(zones: number): PetriNet {
    const places: Place[] = [
      { id: 'reservoir', name: 'Reservoir', tokens: this.state.reservoirLevel, x: 100, y: 100 },
      { id: 'emergency', name: 'Emergency', tokens: this.state.emergency ? 1 : 0, x: 300, y: 50 },
    ];

    const transitions: Transition[] = [];
    const arcs: Arc[] = [];

    // Créer les places et transitions pour chaque zone
    for (let i = 0; i < zones; i++) {
      const zoneId = `zone_${i}`;
      
      // Places pour chaque zone
      places.push(
        { id: `soil_dry_${i}`, name: `Soil Dry ${i+1}`, tokens: 0, x: 200, y: 150 + i * 100 },
        { id: `watering_${i}`, name: `Watering ${i+1}`, tokens: 0, x: 400, y: 150 + i * 100 },
        { id: `soil_wet_${i}`, name: `Soil Wet ${i+1}`, tokens: 1, x: 600, y: 150 + i * 100 }
      );

      // Transitions pour chaque zone
      transitions.push(
        { id: `start_pump_${i}`, name: `Start Pump ${i+1}`, enabled: false, x: 300, y: 150 + i * 100 },
        { id: `stop_pump_${i}`, name: `Stop Pump ${i+1}`, enabled: false, x: 500, y: 150 + i * 100 }
      );

      // Arcs normaux
      arcs.push(
        // Start pump
        { id: `arc_reservoir_start_${i}`, source: 'reservoir', target: `start_pump_${i}`, weight: 10, type: 'normal' },
        { id: `arc_soil_dry_start_${i}`, source: `soil_dry_${i}`, target: `start_pump_${i}`, weight: 1, type: 'normal' },
        { id: `arc_start_watering_${i}`, source: `start_pump_${i}`, target: `watering_${i}`, weight: 1, type: 'normal' },
        
        // Stop pump
        { id: `arc_watering_stop_${i}`, source: `watering_${i}`, target: `stop_pump_${i}`, weight: 1, type: 'normal' },
        { id: `arc_stop_wet_${i}`, source: `stop_pump_${i}`, target: `soil_wet_${i}`, weight: 1, type: 'normal' },

        // Arc inhibiteur depuis Emergency
        { id: `arc_emergency_start_${i}`, source: 'emergency', target: `start_pump_${i}`, weight: 1, type: 'inhibitor' }
      );
    }

    return { places, transitions, arcs };
  }

  public updateState(newState: Partial<IrrigationState>) {
    this.state = { ...this.state, ...newState };
    this.updateNetFromState();
  }

  private updateNetFromState() {
    // Mettre à jour les tokens des places selon l'état
    const reservoirPlace = this.net.places.find(p => p.id === 'reservoir');
    if (reservoirPlace) reservoirPlace.tokens = this.state.reservoirLevel;

    const emergencyPlace = this.net.places.find(p => p.id === 'emergency');
    if (emergencyPlace) emergencyPlace.tokens = this.state.emergency ? 1 : 0;

    // Mettre à jour les sols secs
    for (let i = 0; i < this.state.zones; i++) {
      const soilDryPlace = this.net.places.find(p => p.id === `soil_dry_${i}`);
      if (soilDryPlace) soilDryPlace.tokens = this.state.soilDry[i] ? 1 : 0;
    }

    this.updateTransitionStates();
  }

  private updateTransitionStates() {
    this.net.transitions.forEach(transition => {
      transition.enabled = this.canFireTransition(transition.id);
    });
  }

  private canFireTransition(transitionId: string): boolean {
    const inputArcs = this.net.arcs.filter(arc => arc.target === transitionId);
    
    for (const arc of inputArcs) {
      const sourcePlace = this.net.places.find(p => p.id === arc.source);
      if (!sourcePlace) continue;

      if (arc.type === 'inhibitor') {
        // Arc inhibiteur : empêche le tir si la place source a des tokens
        if (sourcePlace.tokens > 0) return false;
      } else {
        // Arc normal : nécessite suffisamment de tokens
        if (sourcePlace.tokens < arc.weight) return false;
      }
    }

    return true;
  }

  public fireTransition(transitionId: string): boolean {
    if (!this.canFireTransition(transitionId)) return false;

    const inputArcs = this.net.arcs.filter(arc => arc.target === transitionId && arc.type === 'normal');
    const outputArcs = this.net.arcs.filter(arc => arc.source === transitionId);

    // Consommer les tokens des places d'entrée
    inputArcs.forEach(arc => {
      const sourcePlace = this.net.places.find(p => p.id === arc.source);
      if (sourcePlace) {
        sourcePlace.tokens = Math.max(0, sourcePlace.tokens - arc.weight);
      }
    });

    // Produire des tokens dans les places de sortie
    outputArcs.forEach(arc => {
      const targetPlace = this.net.places.find(p => p.id === arc.target);
      if (targetPlace) {
        targetPlace.tokens += arc.weight;
      }
    });

    this.updateTransitionStates();
    return true;
  }

  public fireAllEnabledTransitions(): number {
    let firedCount = 0;
    let changed = true;

    while (changed && firedCount < 100) { // Limite de sécurité
      changed = false;
      for (const transition of this.net.transitions) {
        if (transition.enabled) {
          if (this.fireTransition(transition.id)) {
            firedCount++;
            changed = true;
          }
        }
      }
    }

    return firedCount;
  }

  public startAllPumps() {
    for (let i = 0; i < this.state.zones; i++) {
      this.fireTransition(`start_pump_${i}`);
    }
  }

  public getNet(): PetriNet {
    return this.net;
  }

  public getState(): IrrigationState {
    return this.state;
  }

  public exportToPNML(): string {
    let pnml = `<?xml version="1.0" encoding="UTF-8"?>
<pnml>
  <net id="irrigation_net" type="P/T net">
    <name>
      <text>Irrigation Petri Net</text>
    </name>`;

    // Places
    this.net.places.forEach(place => {
      pnml += `
    <place id="${place.id}">
      <name>
        <text>${place.name}</text>
      </name>
      <initialMarking>
        <text>${place.tokens}</text>
      </initialMarking>
      <graphics>
        <position x="${place.x}" y="${place.y}"/>
      </graphics>
    </place>`;
    });

    // Transitions
    this.net.transitions.forEach(transition => {
      pnml += `
    <transition id="${transition.id}">
      <name>
        <text>${transition.name}</text>
      </name>
      <graphics>
        <position x="${transition.x}" y="${transition.y}"/>
      </graphics>
    </transition>`;
    });

    // Arcs
    this.net.arcs.forEach(arc => {
      pnml += `
    <arc id="${arc.id}" source="${arc.source}" target="${arc.target}">
      <inscription>
        <text>${arc.weight}</text>
      </inscription>
      <type>
        <text>${arc.type}</text>
      </type>
    </arc>`;
    });

    pnml += `
  </net>
</pnml>`;

    return pnml;
  }
}