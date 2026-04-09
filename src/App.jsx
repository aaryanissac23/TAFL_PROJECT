import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Play, RotateCcw, Info, ChevronRight, Layers, Table2,
  GitBranch, Cpu, Sparkles, BookOpen, ArrowRight, Pause, SkipForward
} from 'lucide-react';
import {
  buildNFA, flattenNFA, nfaToDFA, simulateNFA,
  simulateNFASteps, getTransitionTable, PRESETS
} from './logic/Automata';
import Visualizer from './components/Visualizer';
import TransitionTable from './components/TransitionTable';
import ConstructionSteps from './components/ConstructionSteps';

// ─── Floating particles background ─────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    duration: Math.random() * 18 + 14,
    delay: Math.random() * 12,
    color: i % 3 === 0 ? 'rgba(124,58,237,0.35)' : i % 3 === 1 ? 'rgba(6,182,212,0.3)' : 'rgba(16,185,129,0.25)',
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────
function App() {
  const [regex, setRegex] = useState('(a|b)*abb');
  const [data, setData] = useState(null);
  const [view, setView] = useState('NFA');
  const [error, setError] = useState('');
  const [testString, setTestString] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [nfaInstance, setNfaInstance] = useState(null);
  const [constructionSteps, setConstructionSteps] = useState(null);
  const [postfix, setPostfix] = useState('');
  const [bottomTab, setBottomTab] = useState('table');
  const [highlightedStates, setHighlightedStates] = useState([]);
  const [simTrace, setSimTrace] = useState(null);
  const [simStep, setSimStep] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(false);
  const simIntervalRef = useRef(null);

  // ── Convert regex ──
  const handleConvert = useCallback(() => {
    try {
      setError('');
      setTestResult(null);
      setSimTrace(null);
      setHighlightedStates([]);
      setIsSimPlaying(false);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);

      const result = buildNFA(regex);
      const flatNFA = flattenNFA(result.nfa);
      const dfaData = nfaToDFA(result.nfa);

      setNfaInstance(result.nfa);
      setConstructionSteps(result.steps);
      setPostfix(result.postfix);
      setData({ nfa: flatNFA, dfa: dfaData });
    } catch (err) {
      console.error(err);
      setError('Invalid regular expression. Check syntax and try again.');
      setData(null);
    }
  }, [regex]);

  // ── Quick simulate (boolean) ──
  const handleSimulate = () => {
    if (!nfaInstance) return;
    const result = simulateNFA(nfaInstance, testString);
    setTestResult(result);

    // Also generate step trace
    const traceResult = simulateNFASteps(nfaInstance, testString);
    setSimTrace(traceResult);
    setSimStep(0);
    setHighlightedStates(traceResult.trace[0]?.activeStates || []);
  };

  // ── Step-by-step simulation playback ──
  const playSimulation = () => {
    if (!simTrace) return;
    setIsSimPlaying(true);
    setSimStep(0);
    setHighlightedStates(simTrace.trace[0]?.activeStates || []);

    let step = 0;
    simIntervalRef.current = setInterval(() => {
      step++;
      if (step >= simTrace.trace.length) {
        clearInterval(simIntervalRef.current);
        setIsSimPlaying(false);
        return;
      }
      setSimStep(step);
      setHighlightedStates(simTrace.trace[step]?.activeStates || []);
    }, 800);
  };

  const pauseSimulation = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimPlaying(false);
  };

  const stepForward = () => {
    if (!simTrace) return;
    const next = Math.min(simStep + 1, simTrace.trace.length - 1);
    setSimStep(next);
    setHighlightedStates(simTrace.trace[next]?.activeStates || []);
  };

  // ── Initial convert on mount ──
  useEffect(() => {
    handleConvert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Get transition table data
  const nfaTable = data?.nfa ? getTransitionTable(data.nfa, false) : null;
  const dfaTable = data?.dfa ? getTransitionTable(data.dfa, true) : null;
  const currentTable = view === 'NFA' ? nfaTable : dfaTable;

  return (
    <>
      <Particles />

      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* ═══════ HEADER ═══════ */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: 32, maxWidth: 700 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            marginBottom: 16,
            fontSize: 12,
            fontWeight: 600,
            color: '#a78bfa',
            fontFamily: "'Inter', sans-serif",
          }}>
            <Cpu size={14} /> Theory of Automata & Formal Languages
          </div>

          <h1 className="title-gradient" style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            margin: '0 0 12px',
            lineHeight: 1.1,
          }}>
            Regex Automata Visualizer
          </h1>

          <p style={{
            color: '#64748b',
            fontSize: 15,
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.6,
            fontFamily: "'Inter', sans-serif",
          }}>
            Transform regular expressions into ε-NFA and DFA using
            <span style={{ color: '#a78bfa', fontWeight: 600 }}> Thompson's Construction </span>
            and
            <span style={{ color: '#06b6d4', fontWeight: 600 }}> Subset Construction</span>.
            Simulate strings interactively.
          </p>
        </motion.header>

        {/* ═══════ MAIN LAYOUT ═══════ */}
        <div style={{
          width: '100%',
          maxWidth: 1280,
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 20,
        }}
          className="main-grid"
        >
          {/* ─── LEFT SIDEBAR ─── */}
          <motion.aside
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Regex Input Card */}
            <div className="glass" style={{ padding: 24 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <GitBranch size={14} /> Regular Expression
              </label>

              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                placeholder="e.g. (a|b)*c"
                className="input-field"
                style={{ marginBottom: 12 }}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    color: '#f43f5e',
                    fontSize: 12,
                    marginBottom: 10,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  {error}
                </motion.p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleConvert} className="btn-primary" style={{ flex: 1 }}>
                  <Zap size={16} /> Convert
                </button>
                <button onClick={() => { setRegex(''); setData(null); setError(''); }} className="btn-icon">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Preset Examples */}
            <div className="glass" style={{ padding: 20 }}>
              <h3 style={{
                margin: '0 0 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <Sparkles size={14} /> Quick Examples
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`chip ${regex === p.regex ? 'active' : ''}`}
                    onClick={() => {
                      setRegex(p.regex);
                      setTimeout(() => {
                        // Trigger convert after state update
                      }, 0);
                    }}
                    title={p.description}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Card */}
            <div className="glass" style={{ padding: 20 }}>
              <h3 style={{
                margin: '0 0 6px',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <Play size={14} /> String Simulation
              </h3>
              <p style={{ fontSize: 11, color: '#475569', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
                Test if a string is accepted by the automaton
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  type="text"
                  value={testString}
                  onChange={(e) => { setTestString(e.target.value); setTestResult(null); setSimTrace(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                  placeholder="Enter string…"
                  className="input-field"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    borderColor: testResult === true ? '#10b981' :
                                 testResult === false ? '#f43f5e' :
                                 undefined,
                    boxShadow: testResult === true ? '0 0 0 3px rgba(16, 185, 129, 0.15)' :
                               testResult === false ? '0 0 0 3px rgba(244, 63, 94, 0.15)' :
                               undefined,
                  }}
                />
                <button
                  onClick={handleSimulate}
                  className="btn-primary"
                  style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #059669, #047857)' }}
                  title="Run simulation"
                >
                  <Play size={16} />
                </button>
              </div>

              {/* Simulation controls */}
              {simTrace && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ display: 'flex', gap: 6, marginBottom: 10 }}
                >
                  <button
                    onClick={isSimPlaying ? pauseSimulation : playSimulation}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: 12, padding: '7px 12px' }}
                  >
                    {isSimPlaying ? <Pause size={13} /> : <Play size={13} />}
                    {isSimPlaying ? 'Pause' : 'Animate'}
                  </button>
                  <button
                    onClick={stepForward}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '7px 12px' }}
                    disabled={isSimPlaying}
                  >
                    <SkipForward size={13} /> Step
                  </button>
                </motion.div>
              )}

              {/* Result badge */}
              <AnimatePresence>
                {testResult !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`sim-result ${testResult ? 'accepted' : 'rejected'}`}
                  >
                    {testResult ? '✓ String Accepted' : '✗ String Rejected'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step trace info */}
              {simTrace && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(2, 6, 23, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.08)',
                    fontSize: 11,
                    color: '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Step {simStep + 1} / {simTrace.trace.length}</span>
                    <span style={{ color: '#a78bfa' }}>
                      char: <strong>{simTrace.trace[simStep]?.char || '—'}</strong>
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569' }}>
                    Active states: {'{'}
                    <span style={{ color: '#7c3aed' }}>
                      {simTrace.trace[simStep]?.activeStates.map(s => `q${s}`).join(', ') || '∅'}
                    </span>
                    {'}'}
                  </div>
                  {/* Step progress bar */}
                  <div style={{
                    marginTop: 8,
                    height: 3,
                    borderRadius: 2,
                    background: 'rgba(148, 163, 184, 0.1)',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                      }}
                      animate={{
                        width: `${((simStep + 1) / simTrace.trace.length) * 100}%`
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Operators Reference */}
            <div className="glass" style={{ padding: 20 }}>
              <h3 style={{
                margin: '0 0 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <BookOpen size={14} /> Supported Operators
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
              }}>
                {[
                  { op: '|', name: 'Union' },
                  { op: '*', name: 'Kleene Star' },
                  { op: '+', name: 'Plus (1+)' },
                  { op: '?', name: 'Optional' },
                  { op: '( )', name: 'Grouping' },
                  { op: 'ab', name: 'Concat' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '7px 10px',
                    borderRadius: 8,
                    background: 'rgba(2, 6, 23, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.06)',
                    fontSize: 12,
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <code style={{
                      color: '#a78bfa',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      background: 'none',
                      padding: 0,
                    }}>{item.op}</code>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* ─── RIGHT MAIN AREA ─── */}
          <motion.main
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}
          >
            {/* Top bar: Tabs + Legend + Stats */}
            <div className="glass" style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div className="tab-group">
                <button
                  onClick={() => setView('NFA')}
                  className={`tab-btn ${view === 'NFA' ? 'active' : ''}`}
                >
                  ε-NFA
                </button>
                <button
                  onClick={() => setView('DFA')}
                  className={`tab-btn ${view === 'DFA' ? 'active' : ''}`}
                >
                  DFA
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                  <span className="legend-dot start" /> Start
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                  <span className="legend-dot accept" /> Accept
                </span>
                {data && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-info">
                      {view === 'NFA' ? data.nfa.nodes.length : data.dfa.nodes.length} states
                    </span>
                    <span className="badge badge-info">
                      {view === 'NFA' ? data.nfa.edges.length : data.dfa.edges.length} trans
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Graph visualization */}
            <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 480, position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {data && (
                    <motion.div
                      key={view + JSON.stringify(view === 'NFA' ? data.nfa : data.dfa)}
                      initial={{ opacity: 0, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(8px)' }}
                      transition={{ duration: 0.4 }}
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <Visualizer
                        nodes={view === 'NFA' ? data.nfa.nodes : data.dfa.nodes}
                        edges={view === 'NFA' ? data.nfa.edges : data.dfa.edges}
                        highlightedStates={view === 'NFA' ? highlightedStates : []}
                        isDFA={view === 'DFA'}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!data && !error && (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <Layers size={36} style={{ opacity: 0.3 }} />
                    <span>Enter a regex and click Convert</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom panel: Table / Steps / Algorithm */}
            <div className="glass" style={{ padding: 20 }}>
              {/* Bottom tabs */}
              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                paddingBottom: 12,
              }}>
                {[
                  { key: 'table', label: 'Transition Table', icon: <Table2 size={14} /> },
                  { key: 'steps', label: 'Construction Steps', icon: <Layers size={14} /> },
                  { key: 'algorithm', label: 'Algorithm Info', icon: <Info size={14} /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBottomTab(tab.key)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: bottomTab === tab.key ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                      color: bottomTab === tab.key ? '#a78bfa' : '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Transition Table */}
                {bottomTab === 'table' && currentTable && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TransitionTable
                      tableData={currentTable}
                      title={`${view === 'NFA' ? 'ε-NFA' : 'DFA'} Transition Table (δ)`}
                    />
                  </motion.div>
                )}

                {/* Construction Steps */}
                {bottomTab === 'steps' && constructionSteps && (
                  <motion.div
                    key="steps"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ConstructionSteps steps={constructionSteps} postfix={postfix} />
                  </motion.div>
                )}

                {/* Algorithm Info */}
                {bottomTab === 'algorithm' && (
                  <motion.div
                    key="algorithm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                    }}>
                      <div style={{
                        padding: 20,
                        borderRadius: 12,
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(124, 58, 237, 0.04)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 12,
                        }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <GitBranch size={18} color="white" />
                          </div>
                          <h3 style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#e2e8f0',
                            fontFamily: "'Outfit', sans-serif",
                          }}>
                            Thompson's Construction
                          </h3>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                          Converts a regular expression to an ε-NFA by recursively building
                          sub-automata for each operator (union, concatenation, Kleene star)
                          and combining them with ε-transitions. Guarantees exactly one start
                          and one accept state.
                        </p>
                        <div style={{ marginTop: 14 }}>
                          {['Parse regex to postfix', 'Build base NFAs for symbols', 'Apply operators to combine', 'Mark start and accept states'].map((step, i) => (
                            <div key={i} className="algo-step" style={{ marginBottom: 6 }}>
                              <div className="algo-step-number">{i + 1}</div>
                              <div className="algo-step-content"><p style={{ color: '#94a3b8', fontSize: 12 }}>{step}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        padding: 20,
                        borderRadius: 12,
                        border: '1px solid rgba(6, 182, 212, 0.15)',
                        background: 'rgba(6, 182, 212, 0.04)',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 12,
                        }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #06b6d4, #0e7490)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Cpu size={18} color="white" />
                          </div>
                          <h3 style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#e2e8f0',
                            fontFamily: "'Outfit', sans-serif",
                          }}>
                            Subset Construction
                          </h3>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                          Converts the ε-NFA to DFA using the powerset method. Each DFA state
                          represents a set of NFA states. Uses ε-closure and move operations
                          to compute transitions systematically.
                        </p>
                        <div style={{ marginTop: 14 }}>
                          {['Compute ε-closure of start', 'For each symbol, compute move + ε-closure', 'Create DFA state for each new set', 'Repeat until no new states'].map((step, i) => (
                            <div key={i} className="algo-step" style={{ marginBottom: 6 }}>
                              <div className="algo-step-number" style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}>{i + 1}</div>
                              <div className="algo-step-content"><p style={{ color: '#94a3b8', fontSize: 12 }}>{step}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Formal definitions */}
                    <div style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'rgba(2, 6, 23, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.06)',
                    }}>
                      <h4 style={{
                        margin: '0 0 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        Formal Notation
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 12,
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <div>
                          <div style={{ color: '#475569', marginBottom: 2 }}>NFA</div>
                          <div style={{ color: '#a78bfa' }}>M = (Q, Σ, δ, q₀, F)</div>
                        </div>
                        <div>
                          <div style={{ color: '#475569', marginBottom: 2 }}>DFA</div>
                          <div style={{ color: '#67e8f9' }}>M' = (Q', Σ, δ', q₀', F')</div>
                        </div>
                        <div>
                          <div style={{ color: '#475569', marginBottom: 2 }}>ε-closure</div>
                          <div style={{ color: '#10b981' }}>ε-CLOSURE(s)</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.main>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <footer style={{
          marginTop: 48,
          fontSize: 12,
          color: '#334155',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}>
          Built with React, Cytoscape.js & Framer Motion · TAFL Project
        </footer>
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

export default App;
