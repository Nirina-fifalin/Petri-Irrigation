"use client";

import React from 'react';
import { IrrigationState } from '@/types/petri-net';

interface ControlPanelProps {
  state: IrrigationState;
  onStateChange: (newState: Partial<IrrigationState>) => void;
  onFireAllTransitions: () => void;
  onStartAllPumps: () => void;
  onExportPNML: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  onStateChange,
  onFireAllTransitions,
  onStartAllPumps,
  onExportPNML,
}) => {
  const adjustReservoir = (delta: number) => {
    const newLevel = Math.max(0, Math.min(100, state.reservoirLevel + delta));
    onStateChange({ reservoirLevel: newLevel });
  };

  const toggleSoilDry = (zoneIndex: number) => {
    const newSoilDry = [...state.soilDry];
    newSoilDry[zoneIndex] = !newSoilDry[zoneIndex];
    onStateChange({ soilDry: newSoilDry });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Contrôles Irrigation</h2>

      {/* Réservoir */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Niveau Réservoir</h3>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => adjustReservoir(-10)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            -10
          </button>
          <span className="min-w-16 text-center">{state.reservoirLevel}</span>
          <button
            onClick={() => adjustReservoir(10)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            +10
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${state.reservoirLevel}%` }}
          />
        </div>
      </div>

      {/* Emergency */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Urgence</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.emergency}
            onChange={(e) => onStateChange({ emergency: e.target.checked })}
            className="mr-2"
          />
          <span className={state.emergency ? 'text-red-600 font-semibold' : ''}>
            Mode Urgence {state.emergency ? 'ACTIF' : 'Inactif'}
          </span>
        </label>
      </div>

      {/* Zones */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Zones d'irrigation</h3>
        {Array.from({ length: state.zones }).map((_, index) => (
          <div key={index} className="flex items-center justify-between mb-2">
            <span>Zone {index + 1}</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.soilDry[index] || false}
                onChange={() => toggleSoilDry(index)}
                className="mr-2"
              />
              <span className={state.soilDry[index] ? 'text-orange-600' : 'text-green-600'}>
                {state.soilDry[index] ? 'Sol Sec' : 'Sol Humide'}
              </span>
            </label>
          </div>
        ))}
      </div>

      {/* Mode Auto */}
      <div className="mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.autoMode}
            onChange={(e) => onStateChange({ autoMode: e.target.checked })}
            className="mr-2"
          />
          <span>Mode Automatique</span>
        </label>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onFireAllTransitions}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tirer Transitions Activées
        </button>

        <button
          onClick={onStartAllPumps}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Démarrer Toutes les Pompes
        </button>

        <button
          onClick={onExportPNML}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Exporter PNML
        </button>
      </div>

      {/* Informations */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-semibold mb-1">Légende:</h4>
        <ul className="space-y-1">
          <li>🔵 Places (cercles) avec tokens</li>
          <li>🟩 Transitions activées</li>
          <li>⬜ Transitions désactivées</li>
          <li className="text-red-600">--- Arcs inhibiteurs</li>
        </ul>
      </div>
    </div>
  );
};