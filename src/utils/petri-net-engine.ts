"use client";

import { PetriNet, Place, Transition, Arc, IrrigationState } from '@/types/petri-net';

export class PetriNetEngine {
  private net: PetriNet;
  private state: IrrigationState;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private onStateChange?: () => void;

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

  public setOnStateChange(callback: () => void) {
    this.onStateChange = callback;
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  private createIrrigationNet(zones: number): PetriNet {
    const places: Place[] = [
      { id: 'reservoir', name: 'Reservoir', tokens: this.state.reservoirLevel, x: 100, y: 100 },
      { id: 'emergency', name: 'Emergency', tokens: this.state.emergency ? 1 : 0, x: 300, y: 50 },
    ];

    const transitions: Transition[] = [];
    const arcs: Arc[] = [];

    for (let i = 0; i < zones; i++) {
      const zoneId = `zone_${i}`;
      
      places.push(
        { id: `soil_dry_${i}`, name: `Soil Dry ${i+1}`, tokens: 0, x: 200, y: 150 + i * 120 },
        { id: `watering_${i}`, name: `Watering ${i+1}`, tokens: 0, x: 400, y: 150 + i * 120 },
        { id: `soil_wet_${i}`, name: `Soil Wet ${i+1}`, tokens: 1, x: 600, y: 150 + i * 120 },
        { id: `irrigation_timer_${i}`, name: `Timer ${i+1}`, tokens: 0, x: 500, y: 200 + i * 120 }
      );

      transitions.push(
        { id: `start_pump_${i}`, name: `Start Pump ${i+1}`, enabled: false, x: 300, y: 150 + i * 120 },
        { id: `irrigation_active_${i}`, name: `Irrigate ${i+1}`, enabled: false, x: 450, y: 150 + i * 120 },
        { id: `stop_irrigation_${i}`, name: `Stop ${i+1}`, enabled: false, x: 550, y: 150 + i * 120 },
        { id: `soil_drying_${i}`, name: `Dry ${i+1}`, enabled: false, x: 400, y: 200 + i * 120 }
      );

      arcs.push(
        { id: `arc_reservoir_start_${i}`, source: 'reservoir', target: `start_pump_${i}`, weight: 5, type: 'normal' },
        { id: `arc_soil_dry_start_${i}`, source: `soil_dry_${i}`, target: `start_pump_${i}`, weight: 1, type: 'normal' },
        { id: `arc_start_watering_${i}`, source: `start_pump_${i}`, target: `watering_${i}`, weight: 1, type: 'normal' },

        { id: `arc_watering_irrigate_${i}`, source: `watering_${i}`, target: `irrigation_active_${i}`, weight: 1, type: 'normal' },
        { id: `arc_irrigate_timer_${i}`, source: `irrigation_active_${i}`, target: `irrigation_timer_${i}`, weight: 1, type: 'normal' },

        { id: `arc_timer_stop_${i}`, source: `irrigation_timer_${i}`, target: `stop_irrigation_${i}`, weight: 1, type: 'normal' },
        { id: `arc_stop_wet_${i}`, source: `stop_irrigation_${i}`, target: `soil_wet_${i}`, weight: 1, type: 'normal' },

        { id: `arc_wet_drying_${i}`, source: `soil_wet_${i}`, target: `soil_drying_${i}`, weight: 1, type: 'normal' },
        { id: `arc_drying_dry_${i}`, source: `soil_drying_${i}`, target: `soil_dry_${i}`, weight: 1, type: 'normal' },

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
    const reservoirPlace = this.net.places.find(p => p.id === 'reservoir');
    if (reservoirPlace) reservoirPlace.tokens = this.state.reservoirLevel;

    const emergencyPlace = this.net.places.find(p => p.id === 'emergency');
    if (emergencyPlace) emergencyPlace.tokens = this.state.emergency ? 1 : 0;

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
        if (sourcePlace.tokens > 0) return false;
      } else {
        if (sourcePlace.tokens < arc.weight) return false;
      }
    }

    return true;
  }

  public fireTransition(transitionId: string): boolean {
    if (!this.canFireTransition(transitionId)) return false;

    const inputArcs = this.net.arcs.filter(arc => arc.target === transitionId && arc.type === 'normal');
    const outputArcs = this.net.arcs.filter(arc => arc.source === transitionId);

    inputArcs.forEach(arc => {
      const sourcePlace = this.net.places.find(p => p.id === arc.source);
      if (sourcePlace) {
        sourcePlace.tokens = Math.max(0, sourcePlace.tokens - arc.weight);

        if (sourcePlace.id === 'reservoir') {
          this.state.reservoirLevel = sourcePlace.tokens;
        }
      }
    });

    outputArcs.forEach(arc => {
      const targetPlace = this.net.places.find(p => p.id === arc.target);
      if (targetPlace) {
        targetPlace.tokens += arc.weight;
      }
    });

    this.handleTimedTransition(transitionId);

    this.updateTransitionStates();
    this.notifyStateChange();
    return true;
  }

  private handleTimedTransition(transitionId: string) {
    if (transitionId.includes('start_pump_')) {
      const zoneIndex = parseInt(transitionId.split('_')[2]);

      setTimeout(() => {
        this.fireTransition(`irrigation_active_${zoneIndex}`);
      }, 5000);
      
    } else if (transitionId.includes('irrigation_active_')) {
      const zoneIndex = parseInt(transitionId.split('_')[2]);

      setTimeout(() => {
        this.fireTransition(`stop_irrigation_${zoneIndex}`);
      }, 5000);
      
    } else if (transitionId.includes('stop_irrigation_')) {
      const zoneIndex = parseInt(transitionId.split('_')[2]);

      setTimeout(() => {
        this.fireTransition(`soil_drying_${zoneIndex}`);
      }, 2000);
    }
  }

  public fireAllEnabledTransitions(): number {
    let firedCount = 0;
    let changed = true;

    while (changed && firedCount < 50) { // Réduire la limite pour éviter les boucles infinies
      changed = false;

      const priorityTransitions = this.net.transitions
        .filter(t => t.enabled)
        .sort((a, b) => {
          const getPriority = (id: string) => {
            if (id.includes('irrigation_active_')) return 1;
            if (id.includes('stop_irrigation_')) return 2;
            if (id.includes('soil_drying_')) return 3;
            if (id.includes('start_pump_')) return 4;
            return 5;
          };
          return getPriority(a.id) - getPriority(b.id);
        });

      for (const transition of priorityTransitions.slice(0, 3)) { 
        if (transition.enabled) {
          if (this.fireTransition(transition.id)) {
            firedCount++;
            changed = true;
            break;
          }
        }
      }
    }

    return firedCount;
  }

  public startAllPumps() {
    for (let i = 0; i < this.state.zones; i++) {
      const soilDryPlace = this.net.places.find(p => p.id === `soil_dry_${i}`);
      if (soilDryPlace && soilDryPlace.tokens === 0) {
        soilDryPlace.tokens = 1;
      }
      this.fireTransition(`start_pump_${i}`);
    }
    this.updateTransitionStates();
  }

  public startIrrigationCycle() {
    console.log('Démarrage du cycle d\'irrigation automatique...');

    for (let i = 0; i < this.state.zones; i++) {
      const soilDryPlace = this.net.places.find(p => p.id === `soil_dry_${i}`);
      const soilWetPlace = this.net.places.find(p => p.id === `soil_wet_${i}`);
      
      if (soilWetPlace && soilWetPlace.tokens > 0) {
        soilWetPlace.tokens = 0;
        if (soilDryPlace) {
          soilDryPlace.tokens = 1;
        }
      }
    }
    
    this.updateTransitionStates();
    this.notifyStateChange();

    setTimeout(() => {
      this.fireAllEnabledTransitions();
    }, 100);
  }

  public cleanup() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
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