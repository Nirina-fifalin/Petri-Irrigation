"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface IrrigationNodeData {
  label: string;
  tokens: number;
  type: 'place' | 'transition';
  firing?: boolean;
}

const IrrigationNode: React.FC<NodeProps<IrrigationNodeData>> = ({ data }) => {
  const { label, tokens, type, firing } = data;

  if (type === 'place') {
    return (
      <div className="relative">
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <div className="w-16 h-16 rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center relative">
          <span className="text-xs text-center font-semibold">{label}</span>
          {/* Affichage des tokens */}
          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {tokens}
          </div>
          {/* Points pour représenter les tokens */}
          {Array.from({ length: Math.min(tokens, 3) }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-red-600 rounded-full"
              style={{
                top: `${20 + (i % 2) * 20}px`,
                left: `${20 + Math.floor(i / 2) * 15}px`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className={`w-12 h-6 border-2 ${firing ? 'bg-yellow-400' : 'bg-gray-800'} border-gray-600 flex items-center justify-center transition-colors`}>
        <span className="text-xs text-white font-semibold">{label}</span>
      </div>
    </div>
  );
};

export default IrrigationNode;