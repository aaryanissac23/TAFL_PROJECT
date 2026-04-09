import React from 'react';
import { motion } from 'framer-motion';

const TransitionTable = ({ tableData, title }) => {
  if (!tableData || !tableData.rows || tableData.rows.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ overflowX: 'auto', maxHeight: 320 }}
    >
      {title && (
        <h4 style={{
          margin: '0 0 12px',
          fontSize: 13,
          fontWeight: 600,
          color: '#94a3b8',
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            width: 5,
            height: 16,
            borderRadius: 2,
            background: 'linear-gradient(180deg, #7c3aed, #06b6d4)',
          }} />
          {title}
        </h4>
      )}
      <table className="transition-table">
        <thead>
          <tr>
            {tableData.headers.map((h, i) => (
              <th key={i}>{h === 'ε' ? 'ε' : h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIdx) => (
            <motion.tr
              key={rowIdx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIdx * 0.04, duration: 0.3 }}
            >
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.isStart && (
                    <span style={{
                      fontSize: 10,
                      color: '#a78bfa',
                    }}>→</span>
                  )}
                  <span className={row.isStart ? 'state-start' : row.isEnd ? 'state-accept' : ''}>
                    {row.state}
                  </span>
                  {row.isEnd && (
                    <span style={{
                      fontSize: 9,
                      color: '#10b981',
                    }}>★</span>
                  )}
                </span>
              </td>
              {tableData.symbols.map((sym, symIdx) => (
                <td key={symIdx} style={{
                  color: row[sym] === '∅' ? '#334155' : '#94a3b8'
                }}>
                  {row[sym]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default TransitionTable;
