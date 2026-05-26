import { useState, useMemo } from 'react';
import { OUTILS_DATA } from '../data/outils';

const TIER_COLORS = {
  1: { bg: 'rgba(96,165,250,.1)',  text: '#60a5fa' },
  2: { bg: 'rgba(167,139,250,.1)', text: '#a78bfa' },
  3: { bg: 'rgba(52,211,153,.1)',  text: '#34d399' },
  4: { bg: 'rgba(251,191,36,.1)',  text: '#fbbf24' },
};

export default function OutilsPage() {
  const [prices, setPrices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chikkin-outils-prices') || '{}');
    } catch(e) { return {}; }
  });
  const [filterType, setFilterType] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const updatePrice = (id, field, value) => {
    setPrices(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: value } };
      try { localStorage.setItem('chikkin-outils-prices', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const displayed = useMemo(() => {
    return OUTILS_DATA
      .filter(item => filterType === 'all' || item.type === filterType)
      .filter(item => filterTier === 'all' || item.tier === parseInt(filterTier))
      .map(item => {
        const p = prices[item.id] || {};
        const craft = parseFloat(String(p.priceCraft || '').replace(/\s/g, '')) || null;
        const hdv   = parseFloat(String(p.priceHdv   || '').replace(/\s/g, '')) || null;
        const best  = craft && hdv ? Math.min(craft, hdv) : craft || hdv;
        const ratio = best ? best / item.qty : null; // kamas per point, lower = better
        return { ...item, priceCraft: p.priceCraft || '', priceHdv: p.priceHdv || '', best, ratio };
      })
      .sort((a, b) => {
        if (!sortBy) return 0;
        const va = a[sortBy] ?? (sortDir === 'asc' ? Infinity : -Infinity);
        const vb = b[sortBy] ?? (sortDir === 'asc' ? Infinity : -Infinity);
        return sortDir === 'asc' ? va - vb : vb - va;
      });
  }, [prices, filterType, filterTier, sortBy, sortDir]);

  // Best ratio per type for star
  const bestByType = useMemo(() => {
    const map = {};
    OUTILS_DATA.forEach(item => {
      const p = prices[item.id] || {};
      const craft = parseFloat(String(p.priceCraft || '').replace(/\s/g, '')) || null;
      const hdv   = parseFloat(String(p.priceHdv   || '').replace(/\s/g, '')) || null;
      const best  = craft && hdv ? Math.min(craft, hdv) : craft || hdv;
      const ratio = best ? best / item.qty : null; // kamas per point, lower = better
      if (ratio && (!map[item.type] || ratio < map[item.type].ratio)) {
        map[item.type] = { id: item.id, ratio };
      }
    });
    return map;
  }, [prices]);

  const types = [...new Set(OUTILS_DATA.map(i => i.type))];

  const ThBtn = ({ col, label }) => (
    <th onClick={() => handleSort(col)} style={{
      padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
      color: sortBy === col ? 'var(--gold)' : 'var(--text-faint)',
      letterSpacing: '0.6px', textTransform: 'uppercase',
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border)',
    }}>
      {label}{sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  const Th = ({ label }) => (
    <th style={{
      padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
      color: 'var(--text-faint)', letterSpacing: '0.6px', textTransform: 'uppercase',
      whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
    }}>{label}</th>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          Outils d'élevage — Rentabilité
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Entrez les prix HDV et/ou craft pour calculer la rentabilité en kamas par point.
          Plus le ratio k/pt est bas, plus l'item est rentable. Le meilleur prix est retenu automatiquement.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 4 }}>Type :</span>
        {[['all', 'Tous'], ...types.map(t => [t, OUTILS_DATA.find(i => i.type === t).label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilterType(key)} style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
            background: filterType === key ? 'rgba(201,162,39,.15)' : 'var(--surface2)',
            color: filterType === key ? 'var(--gold)' : 'var(--text-dim)',
            borderColor: filterType === key ? 'var(--gold-dim)' : 'var(--border)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>{label}</button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8, marginRight: 4 }}>Tier :</span>
        {[['all','Tous'],['1','T1'],['2','T2'],['3','T3'],['4','T4']].map(([key, label]) => (
          <button key={key} onClick={() => setFilterTier(key)} style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
            background: filterTier === key ? 'rgba(201,162,39,.15)' : 'var(--surface2)',
            color: filterTier === key ? 'var(--gold)' : 'var(--text-dim)',
            borderColor: filterTier === key ? 'var(--gold-dim)' : 'var(--border)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: 'var(--surface2)' }}>
            <tr>
              <Th label="Outil" />
              <Th label="Effet" />
              <ThBtn col="tier"  label="Tier" />
              <ThBtn col="level" label="Niv." />
              <ThBtn col="qty"   label="Qté apportée" />
              <Th label="Prix craft (k)" />
              <Th label="Prix HDV (k)" />
              <ThBtn col="best"  label="Meilleur prix" />
              <ThBtn col="ratio" label="k / pt" />
            </tr>
          </thead>
          <tbody>
            {displayed.map((item, i) => {
              const isTop = bestByType[item.type]?.id === item.id;
              const tc = TIER_COLORS[item.tier];
              const prevItem = displayed[i - 1];
              const groupBreak = i > 0 && prevItem.type !== item.type;

              return (
                <tr key={item.id} style={{
                  borderTop: groupBreak ? '2px solid var(--border)' : '1px solid rgba(58,46,30,.2)',
                  background: isTop && item.ratio ? 'rgba(52,211,153,.03)' : 'transparent',
                }}>
                  <td style={{ padding: '7px 12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                      background: item.color + '22', color: item.color }}>
                      {item.effect}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                      background: tc.bg, color: tc.text }}>
                      T{item.tier}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                    {item.level}
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                    {item.qty.toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '4px 12px' }}>
                    <input type="number" min="0" placeholder="—" value={item.priceCraft}
                      onChange={e => updatePrice(item.id, 'priceCraft', e.target.value)}
                      style={{ width: 72, height: 26, background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 4, color: 'var(--text)', textAlign: 'center', fontSize: 12,
                        fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                  </td>
                  <td style={{ padding: '4px 12px' }}>
                    <input type="number" min="0" placeholder="—" value={item.priceHdv}
                      onChange={e => updatePrice(item.id, 'priceHdv', e.target.value)}
                      style={{ width: 72, height: 26, background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 4, color: 'var(--text)', textAlign: 'center', fontSize: 12,
                        fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                  </td>
                  <td style={{ padding: '7px 12px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                    {item.best ? item.best.toLocaleString('fr-FR') + ' k' : '—'}
                  </td>
                  <td style={{ padding: '7px 12px' }}>
                    {item.ratio != null ? (
                      <span style={{ fontWeight: 600, color: isTop ? 'var(--green)' : 'var(--text)' }}>
                        {item.ratio < 1 ? item.ratio.toFixed(3) : item.ratio.toFixed(2)}
                        {isTop && <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--green)' }}>★</span>}
                      </span>
                    ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
        ★ = meilleure rentabilité du type (k/pt le plus bas). Prix en milliers de kamas. Rentabilité = meilleur prix ÷ quantité apportée.
      </p>
    </div>
  );
}