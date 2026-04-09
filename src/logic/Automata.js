/**
 * Automata Engine
 * - Thompson's Construction: Regex → ε-NFA
 * - Subset Construction: ε-NFA → DFA
 * - String Simulation with step-by-step trace
 */

// ─── State & NFA primitives ────────────────────────────────────────

class State {
  constructor(id, isAccepting = false) {
    this.id = id;
    this.isAccepting = isAccepting;
    this.transitions = []; // { symbol: string, to: State }
  }

  addTransition(symbol, to) {
    this.transitions.push({ symbol, to });
  }
}

class NFA {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

let stateCounter = 0;
function createState(isAccepting = false) {
  return new State(stateCounter++, isAccepting);
}

// ─── Thompson's Construction primitives ─────────────────────────────

function fromSymbol(symbol) {
  const start = createState();
  const end = createState();
  start.addTransition(symbol, end);
  return new NFA(start, end);
}

function union(nfa1, nfa2) {
  const start = createState();
  const end = createState();
  start.addTransition('ε', nfa1.start);
  start.addTransition('ε', nfa2.start);
  nfa1.end.addTransition('ε', end);
  nfa2.end.addTransition('ε', end);
  return new NFA(start, end);
}

function concat(nfa1, nfa2) {
  nfa1.end.addTransition('ε', nfa2.start);
  return new NFA(nfa1.start, nfa2.end);
}

function closure(nfa) {
  const start = createState();
  const end = createState();
  start.addTransition('ε', nfa.start);
  start.addTransition('ε', end);
  nfa.end.addTransition('ε', nfa.start);
  nfa.end.addTransition('ε', end);
  return new NFA(start, end);
}

function plusClosure(nfa) {
  const start = createState();
  const end = createState();
  start.addTransition('ε', nfa.start);
  nfa.end.addTransition('ε', nfa.start);
  nfa.end.addTransition('ε', end);
  return new NFA(start, end);
}

function optional(nfa) {
  const start = createState();
  const end = createState();
  start.addTransition('ε', nfa.start);
  start.addTransition('ε', end);
  nfa.end.addTransition('ε', end);
  return new NFA(start, end);
}

// ─── Regex preprocessing & postfix conversion ───────────────────────

function getPrecedence(char) {
  switch (char) {
    case '*': case '+': case '?': return 3;
    case '.': return 2;
    case '|': return 1;
    default: return 0;
  }
}

function preprocess(regex) {
  let res = '';
  const operators = ['|', '*', '+', '?', '(', ')'];
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    res += c1;
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1];
      if (
        ((!operators.includes(c1) || c1 === '*' || c1 === '+' || c1 === '?' || c1 === ')') &&
         (!operators.includes(c2) || c2 === '('))
      ) {
        res += '.';
      }
    }
  }
  return res;
}

function toPostfix(regex) {
  const processed = preprocess(regex);
  let output = '';
  const stack = [];

  for (const char of processed) {
    if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output += stack.pop();
      }
      stack.pop();
    } else if (['*', '+', '?', '.', '|'].includes(char)) {
      while (
        stack.length > 0 &&
        getPrecedence(stack[stack.length - 1]) >= getPrecedence(char)
      ) {
        output += stack.pop();
      }
      stack.push(char);
    } else {
      output += char;
    }
  }

  while (stack.length > 0) {
    output += stack.pop();
  }
  return output;
}

// ─── Build NFA with construction steps tracking ─────────────────────

export function buildNFA(regex) {
  stateCounter = 0;
  const postfix = toPostfix(regex);
  const stack = [];
  const steps = [];

  for (const char of postfix) {
    if (char === '*') {
      const nfa = stack.pop();
      const result = closure(nfa);
      stack.push(result);
      steps.push({
        type: 'Kleene Star (*)',
        description: `Applied Kleene star closure`,
        statesCreated: 2,
        symbol: '*'
      });
    } else if (char === '+') {
      const nfa = stack.pop();
      const result = plusClosure(nfa);
      stack.push(result);
      steps.push({
        type: 'Plus Closure (+)',
        description: `Applied plus closure (one or more)`,
        statesCreated: 2,
        symbol: '+'
      });
    } else if (char === '?') {
      const nfa = stack.pop();
      const result = optional(nfa);
      stack.push(result);
      steps.push({
        type: 'Optional (?)',
        description: `Applied optional (zero or one)`,
        statesCreated: 2,
        symbol: '?'
      });
    } else if (char === '|') {
      const nfa2 = stack.pop();
      const nfa1 = stack.pop();
      stack.push(union(nfa1, nfa2));
      steps.push({
        type: 'Union (|)',
        description: `Combined two NFAs with union (alternation)`,
        statesCreated: 2,
        symbol: '|'
      });
    } else if (char === '.') {
      const nfa2 = stack.pop();
      const nfa1 = stack.pop();
      stack.push(concat(nfa1, nfa2));
      steps.push({
        type: 'Concatenation (·)',
        description: `Concatenated two NFAs sequentially`,
        statesCreated: 0,
        symbol: '·'
      });
    } else {
      const displayChar = char === 'e' ? 'ε' : char;
      stack.push(fromSymbol(displayChar));
      steps.push({
        type: 'Symbol',
        description: `Created base NFA for symbol '${displayChar}'`,
        statesCreated: 2,
        symbol: displayChar
      });
    }
  }

  const finalNFA = stack.pop();
  if (!finalNFA) throw new Error('Invalid regex');
  finalNFA.end.isAccepting = true;
  return { nfa: finalNFA, steps, postfix };
}

// ─── Flatten NFA to node/edge graph data ────────────────────────────

export function flattenNFA(nfa) {
  const nodes = new Map();
  const edges = [];
  const visited = new Set();

  function traverse(state) {
    if (visited.has(state.id)) return;
    visited.add(state.id);

    nodes.set(state.id, {
      id: state.id,
      isStart: state === nfa.start,
      isEnd: state.isAccepting
    });

    for (const trans of state.transitions) {
      edges.push({
        source: state.id,
        target: trans.to.id,
        label: trans.symbol
      });
      traverse(trans.to);
    }
  }

  traverse(nfa.start);
  return { nodes: Array.from(nodes.values()), edges };
}

// ─── Epsilon closure & move helpers ─────────────────────────────────

function getEpsilonClosure(states) {
  const closureSet = new Set(states);
  const stack = Array.from(states);

  while (stack.length > 0) {
    const s = stack.pop();
    for (const trans of s.transitions) {
      if (trans.symbol === 'ε' && !closureSet.has(trans.to)) {
        closureSet.add(trans.to);
        stack.push(trans.to);
      }
    }
  }
  return closureSet;
}

function move(states, symbol) {
  const result = new Set();
  for (const s of states) {
    for (const trans of s.transitions) {
      if (trans.symbol === symbol) {
        result.add(trans.to);
      }
    }
  }
  return result;
}

// ─── Simulate NFA (boolean result) ──────────────────────────────────

export function simulateNFA(nfa, input) {
  let currentStates = getEpsilonClosure([nfa.start]);

  for (const char of input) {
    const nextStates = move(currentStates, char);
    currentStates = getEpsilonClosure(Array.from(nextStates));
    if (currentStates.size === 0) return false;
  }

  return Array.from(currentStates).some(s => s.isAccepting);
}

// ─── Simulate NFA with step-by-step trace ───────────────────────────

export function simulateNFASteps(nfa, input) {
  const trace = [];
  let currentStates = getEpsilonClosure([nfa.start]);

  trace.push({
    step: 0,
    char: 'START',
    activeStates: Array.from(currentStates).map(s => s.id),
    isAccepting: Array.from(currentStates).some(s => s.isAccepting)
  });

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const afterMove = move(currentStates, char);
    currentStates = getEpsilonClosure(Array.from(afterMove));

    trace.push({
      step: i + 1,
      char,
      activeStates: Array.from(currentStates).map(s => s.id),
      isAccepting: Array.from(currentStates).some(s => s.isAccepting)
    });

    if (currentStates.size === 0) break;
  }

  const accepted = Array.from(currentStates).some(s => s.isAccepting);
  return { accepted, trace };
}

// ─── NFA → DFA Subset Construction ─────────────────────────────────

export function nfaToDFA(nfa) {
  const alphabet = new Set();
  const allStates = new Set();

  function collect(s) {
    if (allStates.has(s)) return;
    allStates.add(s);
    for (const t of s.transitions) {
      if (t.symbol !== 'ε') alphabet.add(t.symbol);
      collect(t.to);
    }
  }
  collect(nfa.start);

  const dfaStates = [];
  const dfaTransitions = [];
  const stateQueue = [];

  const startClosure = getEpsilonClosure([nfa.start]);
  dfaStates.push(startClosure);
  stateQueue.push(startClosure);

  const dfaStateMap = new Map();
  const getId = (set) => Array.from(set).map(s => s.id).sort((a, b) => a - b).join(',');
  dfaStateMap.set(getId(startClosure), 0);

  let currentId = 0;

  while (stateQueue.length > 0) {
    const currentSet = stateQueue.shift();
    const uId = dfaStateMap.get(getId(currentSet));

    for (const symbol of alphabet) {
      const nextSet = getEpsilonClosure(Array.from(move(currentSet, symbol)));
      if (nextSet.size === 0) continue;

      const nextSetId = getId(nextSet);
      if (!dfaStateMap.has(nextSetId)) {
        currentId++;
        dfaStateMap.set(nextSetId, currentId);
        dfaStates.push(nextSet);
        stateQueue.push(nextSet);
      }

      dfaTransitions.push({
        source: uId,
        target: dfaStateMap.get(nextSetId),
        label: symbol
      });
    }
  }

  const nodes = dfaStates.map((set, idx) => ({
    id: idx,
    isStart: idx === 0,
    isEnd: Array.from(set).some(s => s.isAccepting),
    nfaStates: Array.from(set).map(s => s.id).sort((a, b) => a - b)
  }));

  return { nodes, edges: dfaTransitions, alphabet: Array.from(alphabet).sort() };
}

// ─── Get transition table data ──────────────────────────────────────

export function getTransitionTable(flatData, isDFA = false) {
  const { nodes, edges } = flatData;
  const symbols = [...new Set(edges.map(e => e.label))].sort();
  
  const table = nodes.map(node => {
    const row = { state: `q${node.id}`, isStart: node.isStart, isEnd: node.isEnd };
    for (const sym of symbols) {
      const targets = edges
        .filter(e => e.source === node.id && e.label === sym)
        .map(e => `q${e.target}`);
      row[sym] = targets.length > 0 ? (isDFA ? targets[0] : `{${targets.join(', ')}}`) : '∅';
    }
    return row;
  });

  return { headers: ['State', ...symbols], rows: table, symbols };
}

// ─── Preset regex examples ──────────────────────────────────────────

export const PRESETS = [
  { label: '(a|b)*abb', regex: '(a|b)*abb', description: 'Strings ending in "abb"' },
  { label: 'a*b*', regex: 'a*b*', description: 'Zero or more a\'s followed by b\'s' },
  { label: '(ab|cd)*', regex: '(ab|cd)*', description: 'Alternating ab or cd' },
  { label: 'a(a|b)*b', regex: 'a(a|b)*b', description: 'Starts with a, ends with b' },
  { label: '(a|b)(a|b)', regex: '(a|b)(a|b)', description: 'Exactly two chars from {a,b}' },
  { label: 'ab*a', regex: 'ab*a', description: 'a, zero or more b\'s, then a' },
  { label: '(0|1)*01', regex: '(0|1)*01', description: 'Binary strings ending in 01' },
  { label: 'a|b|c', regex: 'a|b|c', description: 'Single character a, b, or c' },
];
