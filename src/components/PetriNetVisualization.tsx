"use client";

import ReactFlow, {
  Handle,
  Position,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
  XYPosition
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

const nodeWidth = 120;
const nodeHeight = 60;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      }
    };
  });
};

const PlaceNode = ({ data }: { data: any }) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
    <div
      className={`w-16 h-16 rounded-full border-2 ${
        data.highlight ? "border-green-500" : "border-blue-500"
      } bg-blue-50 flex items-center justify-center`}
    >
      <span className="text-xs font-semibold">{data.label}</span>
      {data.tokens > 0 && (
        <>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {data.tokens}
          </div>
          {Array.from({ length: Math.min(data.tokens, 5) }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-red-600 rounded-full"
              style={{
                top: `${20 + (i % 3) * 15}px`,
                left: `${20 + Math.floor(i / 3) * 15}px`,
              }}
            />
          ))}
        </>
      )}
    </div>
  </div>
);

const TransitionNode = ({ data }: { data: any }) => (
  <div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
    <div
      className={`w-24 h-8 flex items-center justify-center rounded-sm ${
        data.active ? "bg-yellow-500" : "bg-gray-800"
      }`}
    >
      <span className="text-xs text-white">{data.label}</span>
    </div>
  </div>
);

export default function PetriNetVisualization({
  marking,
  activeTransition
}: {
  marking: any;
  activeTransition?: string;
}) {
  const initialNodes: Node[] = [
    { 
      id: "p_emergency", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Emergency", 
        tokens: marking.p_emergency || 0,
        highlight: activeTransition === "toggleEmergency"
      } 
    },
    { 
      id: "p_atRest", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "At Rest", 
        tokens: marking.p_atRest || 0,
        highlight: activeTransition === "t_startPump" || activeTransition === "t_toRest"
      } 
    },
    { 
      id: "t_startPump", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Start Pump", 
        active: activeTransition === "t_startPump"
      } 
    },
    { 
      id: "p_pumpBusy", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Pump Busy", 
        tokens: marking.p_pumpBusy || 0,
        highlight: activeTransition === "t_irrig1" || activeTransition === "t_irrig2"
      } 
    },
    { 
      id: "t_irrig1", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Irrigate Z1", 
        active: activeTransition === "t_irrig1"
      } 
    },
    { 
      id: "p_zone1", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Zone 1", 
        tokens: marking.p_zone1 || 0,
        highlight: activeTransition === "t_toRest"
      } 
    },
    { 
      id: "t_irrig2", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Irrigate Z2", 
        active: activeTransition === "t_irrig2"
      } 
    },
    { 
      id: "p_zone2", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Zone 2", 
        tokens: marking.p_zone2 || 0,
        highlight: activeTransition === "t_toRest"
      } 
    },
    { 
      id: "t_toRest", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "To Rest", 
        active: activeTransition === "t_toRest"
      } 
    },
    { 
      id: "p_reservoir", 
      type: "place", 
      position: { x: 0, y: 0 },
      data: { 
        label: "Reservoir", 
        tokens: marking.p_reservoir || 0,
        highlight: activeTransition === "t_startPump" || activeTransition === "t_incTank" || activeTransition === "t_decTank"
      } 
    },
    { 
      id: "t_incTank", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "+ Reservoir", 
        active: activeTransition === "t_incTank"
      } 
    },
    { 
      id: "t_decTank", 
      type: "transition", 
      position: { x: 0, y: 0 },
      data: { 
        label: "- Reservoir", 
        active: activeTransition === "t_decTank"
      } 
    }
  ];

  const initialEdges: Edge[] = [
    { id: "e1", source: "p_atRest", target: "t_startPump", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e2", source: "t_startPump", target: "p_pumpBusy", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e3", source: "p_pumpBusy", target: "t_irrig1", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e4", source: "p_pumpBusy", target: "t_irrig2", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e5", source: "t_irrig1", target: "p_zone1", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e6", source: "t_irrig2", target: "p_zone2", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e7", source: "p_zone1", target: "t_toRest", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e8", source: "p_zone2", target: "t_toRest", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e9", source: "t_toRest", target: "p_atRest", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e10", source: "p_reservoir", target: "t_startPump", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e11", source: "t_incTank", target: "p_reservoir", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e12", source: "p_reservoir", target: "t_decTank", markerEnd: { type: MarkerType.ArrowClosed } }
  ];

  const layoutedNodes = getLayoutedElements(initialNodes, initialEdges);

  return (
    <ReactFlow
      nodes={layoutedNodes}
      edges={initialEdges}
      nodeTypes={{ place: PlaceNode, transition: TransitionNode }}
      fitView
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}