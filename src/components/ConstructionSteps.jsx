import React from 'react';
import { motion } from 'framer-motion';

const ConstructionSteps = ({ steps, postfix }) => {
  if (!steps || steps.length === 0) return null;

  const getStepColor = (type) => {
    if (type === 'Symbol') return '#06b6d4';
    if (type.includes('Union')) return '#f59e0b';
    if (type.includes('Concatenation')) return '#10b981';
    if (type.includes('Kleene') || type.includes('Plus') || type.includes('Optional')) return '#f43f5e';
    return '#7c3aed';
  };

  const getStepIcon = (type) => {
    if (type === 'Symbol') return 'α';
    if (type.includes('Union')) return '∪';
    if (type.includes('Concatenation')) return '·';
    if (type.includes('Kleene')) return '*';
    if (type.includes('Plus')) return '+';
    if (type.includes('Optional')) return '?';
    return '→';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Postfix expression */}
      <div style={{
        marginBottom: 16,
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(124, 58, 237, 0.06)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>Postfix: </span>
        <span style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 14,
          color: '#a78bfa',
          fontWeight: 600,
        }}>
          {postfix}
        </span>
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="algo-step"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: getStepColor(step.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {getStepIcon(step.type)}
            </div>
            <div className="algo-step-content">
              <h4 style={{ color: getStepColor(step.type) }}>{step.type}</h4>
              <p>{step.description}</p>
              {step.statesCreated > 0 && (
                <span style={{
                  fontSize: 10,
                  color: '#475569',
                  marginTop: 2,
                  display: 'inline-block',
                }}>+{step.statesCreated} states created</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConstructionSteps;
