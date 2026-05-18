import { calcP } from '../lib/compute';

export default function AdvancedParamsCard({
  result, advParams, onChange, open, onToggle,
  defaultLevel, defaultOpti, defaultClone, defaultRepro,
}) {
  const gens = [...new Set(result.enriched.map(s => s.gen))].sort((a, b) => a - b);

  return (
    <div className="card">
      <div className="adv-header" onClick={onToggle}>
        <span className="adv-header-title">Paramètres avancés — par génération</span>
        <span className="adv-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <>
          <div className="adv-grid-header">
            <div style={{ textAlign: 'left' }}>Génération</div>
            <div>Niveau</div>
            <div>Optimakina</div>
            <div>Clonage</div>
            <div>Reproducteur</div>
          </div>
          {gens.map(g => {
            const ap = advParams[g] ?? { level: defaultLevel, opti: defaultOpti, clone: defaultClone, repro: defaultRepro };
            return (
              <div key={g} className="adv-gen-row">
                <div>
                  <div className="adv-gen-name">Gen {g}</div>
                  <div className="adv-gen-p">p = {(calcP(ap.level, ap.opti) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <input type="number" className="adv-num-input" min="1" max="200" value={ap.level}
                    onChange={e => onChange(g, 'level', parseInt(e.target.value) || 1)} />
                </div>
                {[['opti','⚗'],['clone','✂'],['repro','♻']].map(([key, icon]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <button className={`adv-toggle-btn ${ap[key] ? 'on' : ''}`}
                      onClick={() => onChange(g, key, !ap[key])}>
                      {icon}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}