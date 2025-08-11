"use client";

export default function ControlPanel({
  fire,
  nextStep,
  marking,
}: {
  fire: (t: string) => void;
  nextStep: () => void;
  marking: {
    atRest: number;
    pumpBusy: number;
    zone1Watered: number;
    zone2Watered: number;
    tankLevel: number;
    reservoirOk: number;
    emergency: number;
    turnZone1: number;
    turnZone2: number;
  };
}) {
  return (
    <div className="p-4 bg-gray-100 flex flex-col gap-3 text-sm">
      <button
        onClick={nextStep}
        className="bg-black text-white p-2 rounded hover:bg-gray-800 transition-colors"
      >
        ➡ Suivant
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => fire("t_incTank")}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => fire("t_decTank")}
          disabled={marking.tankLevel <= 0}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          -
        </button>
        <span>Réservoir: {marking.tankLevel}</span>
        <span className="ml-2">({marking.reservoirOk ? 'OK' : 'VIDE'})</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => fire("toggleEmergency")}
          className={`px-3 py-1 rounded text-white ${
            marking.emergency ? 'bg-red-600' : 'bg-gray-500'
          } hover:opacity-90 transition-colors`}
        >
          Urgence {marking.emergency ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>At Rest: <span className="font-bold">{marking.atRest}</span></div>
        <div>Zone 1: <span className="font-bold">{marking.zone1Watered}</span></div>
        <div>Pump Busy: <span className="font-bold">{marking.pumpBusy}</span></div>
        <div>Zone 2: <span className="font-bold">{marking.zone2Watered}</span></div>
        <div>Emergency: <span className="font-bold">{marking.emergency}</span></div>
        <div>Tour: 
          <span className="font-bold">
            {marking.turnZone1 ? 'Zone 1' : 'Zone 2'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => fire("t_startPump")}
          disabled={!(marking.atRest > 0 && marking.reservoirOk > 0 && !marking.pumpBusy && !marking.emergency)}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Démarrer Pompe
        </button>
        <button
          onClick={() => fire("t_irrig1")}
          disabled={!(marking.pumpBusy > 0 && marking.turnZone1 > 0)}
          className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Irriguer Zone 1
        </button>
        <button
          onClick={() => fire("t_irrig2")}
          disabled={!(marking.pumpBusy > 0 && marking.turnZone2 > 0)}
          className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Irriguer Zone 2
        </button>
      </div>

      {/* Boîte d’info */}
      <div className="mt-4 p-3 bg-white border border-gray-300 rounded text-xs text-gray-700">
        <strong>Description du réseau de Petri :</strong>
        <p className="mt-1">
          Ce réseau modélise un système d'irrigation automatique alternant entre
          deux zones. La pompe démarre uniquement si le réservoir est plein et
          qu'il n'y a pas d'urgence. Après avoir irriguer chaque zone, le système
          revient à l'état "Au repos". Le réservoir peut être rempli ou vidé
          manuellement, et un mode urgence stoppe immédiatement la pompe.
        </p>
      </div>
    </div>
  );
}