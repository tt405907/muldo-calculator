import { XP_TABLE } from '../data/xpTable';

export function xpToLevel(level) {
  if (level <= 1) return 0;
  return XP_TABLE[Math.min(level - 2, XP_TABLE.length - 1)];
}

export function timeToLevel(level, tier) {
  if (level <= 1) return 0;
  return xpToLevel(level) / (tier * 60);
}

export function computeTime(totalMuldos, tier, enclos, targetLevel) {
  const jaugeTime = 333; // minutes, fixed (0-20000 pts always tier1 range)
  const baffPtsPerMin = tier * 60;
  const baffTime = 2667 / baffPtsPerMin; // avg baffeur/caresseur
  const mangTime = timeToLevel(targetLevel, tier);
  const phase2 = Math.max(baffTime, mangTime);
  const timePerMuldo = jaugeTime + phase2;

  const perBatch = enclos * 10;
  const batches = Math.ceil(totalMuldos / perBatch);
  const totalTime = batches * timePerMuldo;

  const jaugeFuelTotal = 20000 * 2 * totalMuldos;
  const baffFuelTotal = 2667 * totalMuldos;
  const mangFuelTotal = mangTime * tier * 60 * totalMuldos;

  return {
    timePerMuldo,
    jaugeTime,
    baffTime,
    mangTime,
    phase2,
    totalTime,
    batches,
    perBatch,
    jaugeFuelTotal,
    baffFuelTotal,
    mangFuelTotal,
  };
}

export function formatTime(minutes) {
  if (minutes < 1) return '<1min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatDays(minutes) {
  const days = Math.floor(minutes / 1440);
  const rem = minutes % 1440;
  const h = Math.floor(rem / 60);
  const m = Math.round(rem % 60);
  if (days > 0) return `${days}j ${h}h${m > 0 ? ` ${m}min` : ''}`;
  return formatTime(minutes);
}