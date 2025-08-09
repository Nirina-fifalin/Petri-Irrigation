"use client";

import { PetriNetVisualization } from '@/components/PetriNetVisualization';

export default function HomePage() {
  return (
    <main>
      <PetriNetVisualization initialZones={2} />
    </main>
  );
}