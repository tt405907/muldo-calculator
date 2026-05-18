import { GEN1, MULDOS } from '../data/muldos';

// ── HELPERS ─────────────────────────────────────────────────────

export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function calcP(level, opti) {
  return Math.min(1, (30 + level * 2 * 0.15 + (opti ? 10 : 0)) / 100);
}

export function dynClone(pairs, useClone) {
  if (!useClone) return 1.0;
  return 2 - 1 / (Math.max(pairs, 0.01) + 1);
}

// ── TREE BUILDERS ────────────────────────────────────────────────

export function buildSteps(target) {
  const steps = [];
  const vis = new Set();
  function walk(n) {
    if (vis.has(n)) return;
    vis.add(n);
    if (GEN1.includes(n)) return;
    const d = MULDOS[n];
    if (!d) return;
    walk(d.p[0]);
    walk(d.p[1]);
    steps.push({ name: n, gen: d.gen, parents: d.p });
  }
  walk(target);
  return steps;
}

export function countInstances(target) {
  const counts = {};
  function walk(n) {
    if (GEN1.includes(n)) return;
    const d = MULDOS[n];
    if (!d) return;
    counts[n] = (counts[n] || 0) + 1;
    walk(d.p[0]);
    walk(d.p[1]);
  }
  walk(target);
  return counts;
}

export function buildTreeMap(target) {
  const map = {};
  function walk(n, depth = 0) {
    if (GEN1.includes(n)) {
      map[n] = { gen: 1, parents: [], depth };
      return;
    }
    const d = MULDOS[n];
    if (!d) return;
    map[n] = { gen: d.gen, parents: d.p, depth };
    walk(d.p[0], depth + 1);
    walk(d.p[1], depth + 1);
  }
  walk(target);
  return map;
}

// ── GEN1 COST (recursive, independent branches) ─────────────────

export function gen1Cost(name) {
  const zero = Object.fromEntries(GEN1.map(g => [g, 0]));
  if (GEN1.includes(name)) { return { ...zero, [name]: 1 }; }
  const d = MULDOS[name];
  if (!d) return zero;
  const ca = gen1Cost(d.p[0]);
  const cb = gen1Cost(d.p[1]);
  return Object.fromEntries(GEN1.map(g => [g, (ca[g] || 0) + (cb[g] || 0)]));
}

// ── SUPPLY (recursive expected output) ──────────────────────────

export function supply(name, p, useClone, reproMult, mult, advParams) {
  if (GEN1.includes(name)) {
    return (gen1Cost(name)[name] || 0) * mult;
  }
  const d = MULDOS[name];
  if (!d) return 0;

  let ep = p, useCloneLocal = useClone, erm = reproMult;
  if (advParams && advParams[d.gen]) {
    const ag = advParams[d.gen];
    ep = calcP(ag.level, ag.opti);
    useCloneLocal = ag.clone;
    erm = ag.repro ? 2.0 : 1.0;
  }

  const sa = supply(d.p[0], p, useClone, reproMult, mult, advParams);
  const sb = supply(d.p[1], p, useClone, reproMult, mult, advParams);
  const pairs = Math.min(sa, sb);
  const ecm = dynClone(pairs, useCloneLocal);
  return pairs * ecm * ep * erm;
}

// ── MAIN COMPUTE ─────────────────────────────────────────────────

export function compute(target, p, mult, useClone, useRepro, advParams) {
  const steps = buildSteps(target);
  const reproMult = useRepro ? 2.0 : 1.0;

  const totalCost = gen1Cost(target);
  const gen1Needs = Object.fromEntries(
    GEN1.map(n => [n, (totalCost[n] || 0) * mult * 2])
  );
  const totalGen1 = Object.values(gen1Needs).reduce((a, b) => a + b, 0);

  const instances = countInstances(target);

  let maxBabies = 1;
  const enriched = steps.map(step => {
    const [pa, pb] = step.parents;

    let sp = p, scm = 1.0, srm = reproMult;
    if (advParams && advParams[step.gen]) {
      const ag = advParams[step.gen];
      sp = calcP(ag.level, ag.opti);
      srm = ag.repro ? 2.0 : 1.0;
    }

    const shareA = supply(pa, p, useClone, reproMult, mult, advParams);
    const shareB = supply(pb, p, useClone, reproMult, mult, advParams);
    const pairs = Math.min(shareA, shareB);

    const totalPairsForClone = pairs * (instances[step.name] || 1);
    const useCloneStep = advParams && advParams[step.gen]
      ? advParams[step.gen].clone
      : useClone;
    scm = dynClone(totalPairsForClone, useCloneStep);

    const attempts = pairs * scm;
    const babies = attempts * sp * srm;
    if (babies > maxBabies) maxBabies = babies;

    return {
      ...step,
      shareA, shareB, pairs, attempts, babies,
      pUsed: sp, reproUsed: srm, cloneUsed: scm,
      instances: instances[step.name] || 1,
    };
  });

  enriched.forEach(s => {
    s.barPct = Math.min(100, (s.babies / maxBabies) * 100);
  });

  const finalBabies = enriched.length > 0
    ? enriched[enriched.length - 1].babies
    : 0;

  const minGen1 = Object.fromEntries(GEN1.map(n => [n, totalCost[n] || 0]));

  return {
    enriched,
    gen1Needs,
    minGen1,
    totalGen1,
    finalBabies,
    treeMap: buildTreeMap(target),
  };
}

// ── FORMATTING ───────────────────────────────────────────────────

export function fmt(v) {
  if (v === undefined || v === null) return '0';
  if (v >= 100) return Math.round(v).toString();
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function colBabies(v) {
  if (v >= 10) return '#34d399';
  if (v >= 3) return '#C9A227';
  if (v >= 1) return '#f59e0b';
  return '#f87171';
}