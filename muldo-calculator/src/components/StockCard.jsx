import { GEN1 } from '../data/muldos';

const COLORS = {
  'orchidée': '#A78BFA',
  'ébène':    '#9CA3AF',
  'indigo':   '#60A5FA',
  'pourpre':  '#F472B6',
  'doré':     '#C9A227',
};

export default function StockCard({ result }) {
  const { gen1Needs, minGen1 } = result;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">Stock Gen 1 à capturer</span>
      </div>
      <div className="stock-grid">
        {GEN1.map(name => {
          const qty = gen1Needs[name] || 0;
          const active = qty > 0;
          return (
            <div key={name} className="stock-item" style={active ? { borderColor: COLORS[name] } : {}}>
              <div className="stock-item-name" style={active ? { color: COLORS[name] } : {}}>
                {name}
              </div>
              <div className="stock-item-val" style={{ color: active ? COLORS[name] : 'var(--text-faint)' }}>
                {qty}
              </div>
              {active && <div className="stock-item-min">min. {minGen1[name]} paires</div>}
            </div>
          );
        })}
      </div>
      <div className="stock-footer">
        <span>Total Muldos Gen 1 à capturer (ratio ♂♀)</span>
        <strong>{result.totalGen1}</strong>
      </div>
    </div>
  );
}