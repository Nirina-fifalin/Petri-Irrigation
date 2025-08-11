"use client";
import { useState } from "react";
import PetriNetVisualization from "../components/PetriNetVisualization";
import ControlPanel from "../components/ControlPanel";

export default function Page() {
  const [marking, setMarking] = useState({
    p_atRest: 1,
    p_pumpBusy: 0,
    p_zone1: 0,
    p_zone2: 0,
    p_reservoir: 2,
    p_emergency: 0,
    turnZone1: 1,
    turnZone2: 0,
    reservoirOk: 1
  });

  const [activeTransition, setActiveTransition] = useState<string>();

  const fire = (t: string) => {
    setActiveTransition(t);
    setTimeout(() => setActiveTransition(undefined), 500);

    setMarking(prev => {
      const m = { ...prev };

      switch (t) {
        case "t_startPump":
          if (m.p_emergency > 0) break;
          if (m.p_atRest > 0 && m.p_reservoir > 0) {
            m.p_atRest--;
            m.p_pumpBusy++;
            m.p_reservoir--;
            m.reservoirOk = m.p_reservoir > 0 ? 1 : 0;
          }
          break;

        case "t_irrig1":
          if (m.p_pumpBusy > 0 && m.turnZone1 > 0) {
            m.p_pumpBusy--;
            m.p_zone1++;
            m.turnZone1 = 0;
            m.turnZone2 = 1;
          }
          break;

        case "t_irrig2":
          if (m.p_pumpBusy > 0 && m.turnZone2 > 0) {
            m.p_pumpBusy--;
            m.p_zone2++;
            m.turnZone2 = 0;
            m.turnZone1 = 1;
          }
          break;

        case "t_toRest":
          if (m.p_zone1 > 0) {
            m.p_zone1--;
            m.p_atRest++;
          }
          if (m.p_zone2 > 0) {
            m.p_zone2--;
            m.p_atRest++;
          }
          break;

        case "t_incTank":
          m.p_reservoir++;
          m.reservoirOk = 1;
          break;

        case "t_decTank":
          if (m.p_reservoir > 0) {
            m.p_reservoir--;
            m.reservoirOk = m.p_reservoir > 0 ? 1 : 0;
          }
          break;

        case "toggleEmergency":
          m.p_emergency = m.p_emergency ? 0 : 1;
          break;
      }
      return m;
    });
  };

  const nextStep = () => {
    if (marking.p_atRest > 0) {
      fire("t_startPump");
    } else if (marking.p_pumpBusy > 0) {
      if (marking.turnZone1) {
        fire("t_irrig1");
      } else {
        fire("t_irrig2");
      }
    } else if (marking.p_zone1 > 0 || marking.p_zone2 > 0) {
      fire("t_toRest");
    }
  };

  return (
    <div className="flex">
      <div className="w-3/4 h-screen">
        <PetriNetVisualization
          marking={marking}
          activeTransition={activeTransition}
        />
      </div>
      <div className="w-1/4">
        <ControlPanel 
          fire={fire} 
          nextStep={nextStep} 
          marking={{
            ...marking,
            atRest: marking.p_atRest,
            pumpBusy: marking.p_pumpBusy,
            zone1Watered: marking.p_zone1,
            zone2Watered: marking.p_zone2,
            tankLevel: marking.p_reservoir,
            emergency: marking.p_emergency,
            turnZone1: marking.turnZone1,
            turnZone2: marking.turnZone2,
            reservoirOk: marking.reservoirOk,
          }} 
        />
      </div>
    </div>
  );
}