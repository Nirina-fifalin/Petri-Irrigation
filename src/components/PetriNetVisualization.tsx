"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PetriNetEngine } from '@/utils/petri-net-engine';
import { PetriNetGraph } from './PetriNetGraph';
import { ControlPanel } from './ControlPanel';
import { IrrigationState } from '@/types/petri-net';

interface PetriNetVisualizationProps {
  initialZones?: number;
}

export const PetriNetVisualization: React.FC<PetriNetVisualizationProps> = ({
  initialZones = 1,
}) => {
  const [engine, setEngine] = useState<PetriNetEngine>(
    () => new PetriNetEngine(initialZones)
  );
  const [petriNet, setPetriNet] = useState(() => engine.getNet());
  const [state, setState] = useState(() => engine.getState());

  // Mode automatique
  useEffect(() => {
    if (!state.autoMode) return;

    const interval = setInterval(() => {
      const firedCount = engine.fireAllEnabledTransitions();
      if (firedCount > 0) {
        setPetriNet({ ...engine.getNet() });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.autoMode, engine]);

  const handleStateChange = useCallback((newState: Partial<IrrigationState>) => {
    engine.updateState(newState);
    setState(engine.getState());
    setPetriNet({ ...engine.getNet() });
  }, [engine]);

  const handleTransitionClick = useCallback((transitionId: string) => {
    const success = engine.fireTransition(transitionId);
    if (success) {
      setPetriNet({ ...engine.getNet() });
    }
  }, [engine]);

  const handleFireAllTransitions = useCallback(() => {
    const firedCount = engine.fireAllEnabledTransitions();
    if (firedCount > 0) {
      setPetriNet({ ...engine.getNet() });
    }
  }, [engine]);

  const handleStartAllPumps = useCallback(() => {
    engine.startAllPumps();
    setPetriNet({ ...engine.getNet() });
  }, [engine]);

  const handleExportPNML = useCallback(async () => {
    const pnml = engine.exportToPNML();
    
    try {
      const response = await fetch('/api/export-pnml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pnml }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'irrigation-petri-net.pnml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      // Fallback: copier dans le presse-papiers
      navigator.clipboard.writeText(pnml).then(() => {
        alert('PNML copié dans le presse-papiers');
      });
    }
  }, [engine]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Système d'Irrigation - Réseau de Petri
          </h1>
          <p className="text-gray-600">
            Zones: {state.zones} | Réservoir: {state.reservoirLevel}% | 
            Emergency: {state.emergency ? 'ACTIF' : 'Inactif'}
          </p>
        </header>
        
        <div className="flex-1">
          <PetriNetGraph
            petriNet={petriNet}
            onTransitionClick={handleTransitionClick}
          />
        </div>
      </div>

      <ControlPanel
        state={state}
        onStateChange={handleStateChange}
        onFireAllTransitions={handleFireAllTransitions}
        onStartAllPumps={handleStartAllPumps}
        onExportPNML={handleExportPNML}
      />
    </div>
  );
};