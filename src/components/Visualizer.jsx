import React, { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';

const Visualizer = ({ nodes, edges, highlightedStates = [], isDFA = false }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const buildGraph = useCallback(() => {
    if (!containerRef.current || !nodes || nodes.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cyNodes = nodes.map(n => ({
      data: {
        id: n.id.toString(),
        label: isDFA ? `D${n.id}` : `q${n.id}`,
        sublabel: isDFA && n.nfaStates ? `{${n.nfaStates.map(s => 'q' + s).join(',')}}` : '',
        isStart: n.isStart,
        isEnd: n.isEnd,
        isHighlighted: highlightedStates.includes(n.id)
      }
    }));

    // Merge parallel edges with same source/target
    const edgeMap = new Map();
    edges.forEach(e => {
      const key = `${e.source}→${e.target}`;
      if (edgeMap.has(key)) {
        edgeMap.get(key).label += `, ${e.label}`;
      } else {
        edgeMap.set(key, { ...e });
      }
    });

    const cyEdges = Array.from(edgeMap.values()).map((e, index) => ({
      data: {
        id: `e${index}`,
        source: e.source.toString(),
        target: e.target.toString(),
        label: e.label
      }
    }));

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
      style: [
        // ── Default nodes ──
        {
          selector: 'node',
          style: {
            'background-color': '#0f172a',
            'background-opacity': 0.9,
            'border-width': 2.5,
            'border-color': '#6366f1',
            'label': 'data(label)',
            'color': '#e2e8f0',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '13px',
            'font-weight': '600',
            'font-family': 'Inter, system-ui, sans-serif',
            'width': 48,
            'height': 48,
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': '0.3s',
            'transition-timing-function': 'ease-in-out-sine'
          }
        },
        // ── Start state ──
        {
          selector: 'node[?isStart]',
          style: {
            'background-color': '#1e1b4b',
            'border-width': 3,
            'border-color': '#a78bfa',
            'shadow-blur': 15,
            'shadow-color': 'rgba(124, 58, 237, 0.5)',
            'shadow-opacity': 0.8,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'width': 54,
            'height': 54,
          }
        },
        // ── Accepting state ──
        {
          selector: 'node[?isEnd]',
          style: {
            'border-style': 'double',
            'border-width': 5,
            'border-color': '#10b981',
            'shadow-blur': 12,
            'shadow-color': 'rgba(16, 185, 129, 0.4)',
            'shadow-opacity': 0.7,
          }
        },
        // ── Highlighted (active simulation) ──
        {
          selector: 'node[?isHighlighted]',
          style: {
            'background-color': '#7c3aed',
            'border-color': '#c4b5fd',
            'border-width': 3,
            'color': '#ffffff',
            'shadow-blur': 25,
            'shadow-color': 'rgba(124, 58, 237, 0.8)',
            'shadow-opacity': 1,
            'width': 56,
            'height': 56,
          }
        },
        // ── Default edges ──
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '12px',
            'font-weight': '600',
            'font-family': "'JetBrains Mono', 'Fira Code', monospace",
            'color': '#a78bfa',
            'text-background-opacity': 1,
            'text-background-color': '#0a0e1a',
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-border-color': 'rgba(124, 58, 237, 0.2)',
            'control-point-step-size': 50,
            'loop-direction': '-45deg',
            'loop-sweep': '-90deg',
            'edge-distances': 'node-position',
            'overlay-opacity': 0,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.3s',
          }
        },
        // Epsilon edges
        {
          selector: 'edge[label = "ε"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'line-color': '#1e293b',
            'target-arrow-color': '#334155',
            'color': '#64748b',
            'text-border-color': 'rgba(100, 116, 139, 0.2)',
            'font-style': 'italic',
          }
        },
        // Self-loops
        {
          selector: 'edge[source = edge[target]]',
          style: {
            'curve-style': 'loop',
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 60,
        spacingFactor: 1.5,
        animate: true,
        animationDuration: 600,
        animationEasing: 'ease-in-out-sine',
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        roots: nodes.filter(n => n.isStart).map(n => n.id.toString()),
      }
    });

    // Node hover effect
    cyRef.current.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      node.animate({
        style: { 'border-width': node.data('isEnd') ? 6 : 4 }
      }, { duration: 150 });
      
      // Highlight connected edges
      node.connectedEdges().animate({
        style: { 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed', 'width': 3 }
      }, { duration: 150 });
    });

    cyRef.current.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      node.animate({
        style: { 'border-width': node.data('isEnd') ? 5 : node.data('isStart') ? 3 : 2.5 }
      }, { duration: 150 });
      
      node.connectedEdges().animate({
        style: { 'line-color': '#334155', 'target-arrow-color': '#475569', 'width': 2 }
      }, { duration: 150 });
      
      // Re-style epsilon edges
      node.connectedEdges().filter(e => e.data('label') === 'ε').animate({
        style: { 'line-color': '#1e293b', 'target-arrow-color': '#334155' }
      }, { duration: 150 });
    });

    // Fit with padding after layout finishes
    cyRef.current.on('layoutstop', () => {
      cyRef.current.fit(undefined, 50);
      setIsReady(true);
    });

  }, [nodes, edges, highlightedStates, isDFA]);

  useEffect(() => {
    setIsReady(false);
    buildGraph();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [buildGraph]);

  // Update highlighted states without full rebuild
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.nodes().forEach(node => {
      const id = parseInt(node.id());
      node.data('isHighlighted', highlightedStates.includes(id));
    });
  }, [highlightedStates]);

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { padding: 50 }
      }, { duration: 400, easing: 'ease-in-out-sine' });
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        zoom: cyRef.current.zoom() * 1.3,
        center: cyRef.current.extent()
      }, { duration: 200 });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        zoom: cyRef.current.zoom() / 1.3,
        center: cyRef.current.extent()
      }, { duration: 200 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Graph container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.03) 0%, transparent 70%)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Loading animation */}
      {!isReady && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 8, 22, 0.5)',
          borderRadius: '12px',
        }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 10,
      }}>
        {[
          { label: '+', onClick: handleZoomIn },
          { label: '◎', onClick: handleFit },
          { label: '−', onClick: handleZoomOut },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            title={btn.label === '◎' ? 'Fit to view' : btn.label === '+' ? 'Zoom in' : 'Zoom out'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              color: '#94a3b8',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(124, 58, 237, 0.2)';
              e.target.style.color = '#a78bfa';
              e.target.style.borderColor = 'rgba(124, 58, 237, 0.3)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              e.target.style.color = '#94a3b8';
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.12)';
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Node count badge */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        padding: '4px 10px',
        borderRadius: 8,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        fontSize: 11,
        color: '#64748b',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        zIndex: 10,
      }}>
        {nodes.length} states · {edges.length} transitions
      </div>
    </div>
  );
};

export default Visualizer;
