import { MULDOS_BY_GEN } from '../data/muldos';
import { fmt, colBabies } from '../lib/compute';

const PRESETS = [1, 2, 5, 10, 50];

export default function Sidebar({
  open, selectedGen, selectedMuldo, onGenChange, onMuldoChange,
  mult, setMult, level, setLevel,
  opti, setOpti, clone, setClone, repro, setRepro,
  mode, onModeChange, p, result,
}) {
  const gens = Object.keys(MULDOS_BY_GEN).map(Number).sort((a, b) => a - b);
  const muldos = selectedGen ? (MULDOS_BY_GEN[selectedGen] || []).sort() : [];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>

      {/* TARGET */}
      <div className="sidebar-section">
        <div className="sec-label">Muldo cible</div>
        <div className="field">
          <label className="field-label">Génération</label>
          <select value={selectedGen} onChange={e => onGenChange(e.target.value)}>
            <option value="">Choisir une génération</option>
            {gens.map(g => <option key={g} value={g}>Génération {g}</option>)}
          </select>
        </div>
        {selectedGen && (
          <div className="field">
            <label className="field-label">Muldo</label>
            <select value={selectedMuldo} onChange={e => onMuldoChange(e.target.value)}>
              <option value="">Choisir un Muldo</option>
              {muldos.map(m => <option key={m} value={m}>{cap(m)}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* MULT */}
      <div className="sidebar-section">
        <div className="sec-label">Multiplicateur</div>
        <div className="mult-wrap">
          <input
            type="number"
            className="mult-input-field"
            min="1"
            value={mult}
            onChange={e => setMult(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <div className="mult-presets">
            {PRESETS.map(v => (
              <button
                key={v}
                className={`preset-btn ${mult === v ? 'active' : ''}`}
                onClick={() => setMult(v)}
              >×{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT BADGES */}
      {result && (
        <div className="sidebar-section">
          <div className="result-badges">
            <div className="result-badge">
              <div className="result-badge-label">Bébés attendus</div>
              <div className="result-badge-val" style={{ color: colBabies(result.finalBabies) }}>
                {fmt(result.finalBabies)}
              </div>
            </div>
            <div className="result-badge">
              <div className="result-badge-label">Gen 1 (♂+♀)</div>
              <div className="result-badge-val">{result.totalGen1}</div>
            </div>
          </div>
        </div>
      )}

      {/* PARAMS */}
      <div className="sidebar-section">
        <div className="sec-label">Paramètres</div>
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'simple' ? 'active' : ''}`} onClick={() => onModeChange('simple')}>
            Simple
          </button>
          <button className={`mode-btn ${mode === 'avance' ? 'active' : ''}`} onClick={() => onModeChange('avance')}>
            Avancé
          </button>
        </div>

        {mode === 'simple' ? (
          <>
            <div className="slider-row">
              <div className="slider-header">
                <span>Niveau des parents</span>
                <strong>{level}</strong>
              </div>
              <input type="range" min="1" max="200" value={level} onChange={e => setLevel(+e.target.value)} />
              <div className="slider-marks"><span>1</span><span>100</span><span>200</span></div>
            </div>

            {[
              { label: 'Clonage des stériles', sub: '×1.5→×2 tentatives', val: clone, set: setClone },
              { label: 'Optimakina',            sub: '+10% / accouplement', val: opti,  set: setOpti  },
              { label: 'Reproducteur',          sub: '+1 bébé par succès',  val: repro, set: setRepro },
            ].map(({ label, sub, val, set }) => (
              <div className="toggle-row" key={label}>
                <div className="toggle-info">
                  <span>{label}</span>
                  <small>{sub}</small>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                  <span className="switch-track" />
                </label>
              </div>
            ))}

            <div className="p-row">
              <span className="p-row-label">Prob. / accouplement</span>
              <span className="p-row-val">{(p * 100).toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <div className="adv-hint">Paramètres définis dans le tableau ci-dessous</div>
        )}
      </div>
    </aside>
  );
}