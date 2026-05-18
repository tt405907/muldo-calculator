import { GEN1 } from '../data/muldos';
import { fmt, colBabies, calcP } from '../lib/compute';

const GEN_BADGE = {
  1:  { bg: '#085041', text: '#9FE1CB' },
  2:  { bg: '#0C447C', text: '#B5D4F4' },
  3:  { bg: '#633806', text: '#FAC775' },
  4:  { bg: '#72243E', text: '#F4C0D1' },
  5:  { bg: '#3C3489', text: '#CECBF6' },
  6:  { bg: '#27500A', text: '#C0DD97' },
  7:  { bg: '#791F1F', text: '#F7C1C1' },
  8:  { bg: '#712B13', text: '#F0997B' },
  9:  { bg: '#444441', text: '#D3D1C7' },
  10: { bg: '#412402', text: '#FAC775' },
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export default function CascadeCard({ result, p, mode, advParams }) {
  const { enriched, finalBabies } = result;

  const finalMsg = finalBabies >= 2
    ? 'Excellents résultats — plusieurs bébés attendus.'
    : finalBabies >= 1
    ? 'Environ 1 chance sur 2 d\'en avoir au moins 1.'
    : 'Risque élevé — augmentez le multiplicateur.';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">Cascade — bébés produits à chaque étape</span>
      </div>
      <div className="cascade">
        {enriched.map((step, i) => {
          const isFinal = i === enriched.length - 1;
          const c = colBabies(step.babies);
          const badge = GEN_BADGE[step.gen] || { bg: '#1E1710', text: '#E8DCC8' };
          const ep = mode === 'avance' && advParams[step.gen]
            ? calcP(advParams[step.gen].level, advParams[step.gen].opti)
            : step.pUsed;

          return (
            <div key={step.name}>
              <div className={`cascade-step ${isFinal ? 'final' : ''}`}>
                <div>
                  <span className="cascade-gen-badge" style={{ background: badge.bg, color: badge.text }}>
                    Gen {step.gen}
                  </span>
                  <div className="cascade-name" style={{ color: badge.text }}>{cap(step.name)}</div>
                  {step.instances > 1 && (
                    <div className="cascade-instances">× {step.instances} groupes indépendants</div>
                  )}
                  <div className="cascade-parents">
                    {step.parents.map((pa, j) => (
                      <span key={pa}>
                        <span style={{ color: GEN1.includes(pa) ? '#f59e0b' : 'var(--text-dim)' }}>
                          {cap(pa)}
                        </span>
                        {j < step.parents.length - 1 && ' + '}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="cascade-babies-val" style={{ color: c }}>{fmt(step.babies)}</div>
                  <div className="cascade-babies-unit">bébés attendus</div>
                  <div className="cascade-bar-outer">
                    <div className="cascade-bar-inner" style={{ width: `${step.barPct.toFixed(1)}%`, background: c }} />
                  </div>
                  <div className="cascade-bar-label">
                    <span>
                      {fmt(step.pairs)} paires ×{' '}
                      <span style={{ color: 'var(--gold-dim)' }}>×{step.cloneUsed.toFixed(2)}</span>
                      {' '}= <span style={{ color: 'var(--gold)' }}>{fmt(step.attempts)}</span> tent.
                    </span>
                    <span>× {(ep * 100).toFixed(1)}% = <span style={{ color: c }}>{fmt(step.babies)}</span></span>
                  </div>
                </div>

                <div className="cascade-att-col">
                  <div className="cascade-att-val">{fmt(step.attempts)}</div>
                  <div className="cascade-att-lbl">tentatives</div>
                </div>
              </div>

              {!isFinal && (
                <div className="cascade-arrow">
                  {fmt(step.babies)} {cap(step.name)} → étape suivante
                </div>
              )}
            </div>
          );
        })}

        <div className="cascade-result">
          <div className="cascade-result-label">
            {enriched.length > 0 ? cap(enriched[enriched.length - 1].name) : ''} attendus
          </div>
          <div className="cascade-result-val" style={{ color: colBabies(finalBabies) }}>
            {fmt(finalBabies)}
          </div>
          <div className="cascade-result-msg">{finalMsg}</div>
        </div>

        <div className="cascade-note">
          Branches indépendantes — chaque parent devient stérile après usage.
          Les parents <span style={{ color: '#f59e0b' }}>en orange</span> sont des captures Gen 1 directes.
          Le multiplicateur de clonage est dynamique : <strong style={{ color: 'var(--text)' }}>2 − 1/(paires+1)</strong>, converge vers ×2.
        </div>
      </div>
    </div>
  );
}