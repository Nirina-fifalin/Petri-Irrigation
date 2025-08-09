"use client";

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PetriNet } from '@/types/petri-net';

interface PlaceNodeData {
  label: string;
  tokens: number;
}

interface TransitionNodeData {
  label: string;
  enabled: boolean;
}

const PlaceNode: React.FC<{ data: PlaceNodeData }> = ({ data }) => (
  <div className="relative w-16 h-16 border-2 border-blue-500 bg-blue-50 rounded-full flex items-center justify-center">
    <div className="text-xs font-semibold text-center">{data.label}</div>
    {data.tokens > 0 && (
      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
        {data.tokens}
      </div>
    )}
    {/* Tokens visuels */}
    {data.tokens > 0 && (
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: Math.min(data.tokens, 5) }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-black rounded-full"
            style={{
              transform: `rotate(${(i * 360) / Math.min(data.tokens, 5)}deg) translateX(15px)`,
            }}
          />
        ))}
      </div>
    )}
  </div>
);

const TransitionNode: React.FC<{ data: TransitionNodeData }> = ({ data }) => (
  <div
    className={`w-4 h-12 ${
      data.enabled ? 'bg-green-600' : 'bg-gray-400'
    } flex items-center justify-center relative`}
  >
    <div className="absolute -bottom-8 text-xs text-center whitespace-nowrap min-w-max">
      {data.label}
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  place: PlaceNode,
  transition: TransitionNode,
};

interface PetriNetGraphProps {
  petriNet: PetriNet;
  onTransitionClick: (transitionId: string) => void;
}

export const PetriNetGraph: React.FC<PetriNetGraphProps> = ({
  petriNet,
  onTransitionClick,
}) => {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [
      ...petriNet.places.map(place => ({
        id: place.id,
        type: 'place',
        position: { x: place.x, y: place.y },
        data: {
          label: place.name,
          tokens: place.tokens,
        },
      })),
      ...petriNet.transitions.map(transition => ({
        id: transition.id,
        type: 'transition',
        position: { x: transition.x, y: transition.y },
        data: {
          label: transition.name,
          enabled: transition.enabled,
        },
      })),
    ];

    const edges: Edge[] = petriNet.arcs.map(arc => ({
      id: arc.id,
      source: arc.source,
      target: arc.target,
      label: arc.weight > 1 ? arc.weight.toString() : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: arc.type === 'inhibitor' ? '#ef4444' : '#333',
      },
      style: {
        stroke: arc.type === 'inhibitor' ? '#ef4444' : '#333',
        strokeDasharray: arc.type === 'inhibitor' ? '5,5' : undefined,
      },
    }));

    return { nodes, edges };
  }, [petriNet]);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === 'transition') {
      onTransitionClick(node.id);
    }
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};