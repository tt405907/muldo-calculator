import { useEffect, useRef } from 'react';
import { initVeilleur } from '../lib/veilleurInit';

const VEILLEUR_CSS = `
  .v-shell { padding: 16px; }
  .v-scroll { overflow-x: auto; }
  .v-accounts { display: flex; flex-direction: column; gap: 12px; }

  /* Account panel */
  .v-account-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .v-account-header {
    height: 38px; display: flex; align-items: center;
    justify-content: space-between; gap: 8px;
    padding: 0 12px 0 14px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .v-account-title {
    border: 0; padding: 0; background: transparent;
    color: var(--text); font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .v-account-title:hover { color: var(--gold); }
  .v-header-controls { display: flex; align-items: center; gap: 4px; }
  .v-header-button {
    min-width: 28px; height: 24px;
    border: 1px solid var(--border); border-radius: 4px;
    background: var(--surface); color: var(--text-dim);
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: border-color .15s, color .15s;
  }
  .v-header-button:hover { border-color: var(--border2); color: var(--text); }
  .v-header-button:disabled { opacity: 0.35; cursor: default; }

  /* Enclos grid */
  .v-enclos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
    padding: 10px;
  }

  /* Enclos card */
  .v-enclos-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: background .15s;
  }
  .v-enclos-card.running { background: rgba(52,211,153,.04); border-color: rgba(52,211,153,.2); }
  .v-enclos-card.unused { opacity: 0.4; }
  .v-enclos-card.finished { animation: v-card-done 1s steps(2) infinite; }
  @keyframes v-card-done {
    0%, 100% { background: rgba(201,162,39,.1); border-color: rgba(201,162,39,.3); }
    50% { background: var(--surface2); border-color: var(--border); }
  }

  /* Card header */
  .v-card-header {
    display: flex; justify-content: space-between; align-items: center;
  }
  .v-enclos-num {
    width: 22px; height: 22px; border-radius: 4px;
    background: var(--surface); border: 1px solid var(--border);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: var(--text-dim);
  }
  .v-fuel-step { font-size: 10px; color: var(--text-faint); }

  /* Inputs */
  .v-inputs-row {
    display: flex; align-items: flex-end; gap: 4px;
  }
  .v-input-group { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .v-input-label { font-size: 9px; font-weight: 600; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.5px; }
  .v-value-input {
    width: 100%; height: 28px;
    border: 1px solid var(--border); border-radius: 4px;
    background: var(--surface); color: var(--text);
    text-align: center; font-size: 12px;
    font-family: 'Inter', sans-serif; outline: none;
    transition: border-color .15s;
  }
  .v-value-input:focus { border-color: var(--gold-dim); }
  .v-value-input[disabled] { opacity: 0.4; }
  .v-arrow { font-size: 12px; color: var(--text-faint); padding-bottom: 4px; }

  /* Gauge */
  .v-gauge-wrap { position: relative; }
  .v-fuel-gauge {
    position: relative; width: 100%; height: 20px;
    border-radius: 3px; border: 1px solid var(--border);
    background: var(--surface); overflow: hidden;
  }
  .v-fuel-gauge-inner { position: absolute; inset: 5px; background: var(--bg); border-radius: 1px; }
  .v-fuel-fill {
    position: absolute; left: 5px; right: 5px; top: 5px; bottom: 5px;
    background: var(--green); opacity: 0.75; border-radius: 1px;
    transform: scaleX(var(--fuel-scale, 1)); transform-origin: left center;
  }
  .v-fuel-cut { position: absolute; top: 5px; bottom: 5px; width: 1px; background: var(--border); }
  .v-fuel-slider { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .v-fuel-slider:disabled { cursor: default; }

  /* Tier row */
  .v-tier-row {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px;
  }
  .v-fuel-entry-row { margin-top: 3px; }
  .v-tier-button {
    height: 24px; border: 1px solid var(--border); border-radius: 3px;
    background: var(--surface); display: inline-flex;
    align-items: center; justify-content: center; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .v-tier-button.active { border-color: var(--green); background: rgba(52,211,153,.1); }
  .v-tier-label { color: var(--text-dim); font-weight: 600; font-size: 10px; }
  .v-tier-button.active .v-tier-label { color: var(--green); }
  .v-fuel-entry {
    width: 100%; height: 24px; border: 1px solid var(--border); border-radius: 3px;
    background: var(--surface); color: var(--green); text-align: center;
    font-size: 11px; font-family: 'Inter', sans-serif; outline: none;
    transition: border-color .15s;
  }
  .v-fuel-entry:focus { border-color: var(--green); }

  /* Card footer */
  .v-card-footer { display: flex; gap: 4px; align-items: center; }
  .v-timer-button {
    flex: 1; height: 28px; border: 1px solid var(--border); border-radius: 4px;
    background: var(--surface); color: var(--text);
    display: inline-flex; align-items: center; gap: 5px; padding: 0 8px;
    font-size: 11px; font-family: 'Inter', sans-serif; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .v-timer-button.short  { background: rgba(239,68,68,.1);  border-color: rgba(239,68,68,.3); }
  .v-timer-button.medium { background: rgba(245,158,11,.1); border-color: rgba(245,158,11,.3); }
  .v-timer-button.long   { background: rgba(52,211,153,.06); border-color: rgba(52,211,153,.2); }
  .v-timer-button.done   { animation: v-timer-done 1s steps(2) infinite; }
  @keyframes v-timer-done {
    0%, 100% { background: rgba(201,162,39,.15); border-color: var(--gold-dim); }
    50% { background: var(--surface); border-color: var(--border); }
  }
  .v-inline-icon {
    width: 13px; height: 13px; display: inline-flex;
    align-items: center; justify-content: center; flex: 0 0 auto;
  }
  .v-inline-icon svg { width: 100%; height: 100%; display: block; }
  .v-control-icon { color: var(--green); }
  .v-timer-icon { color: var(--text-faint); }
  .v-timer-value { font-size: 11px; color: var(--text); font-variant-numeric: tabular-nums; }
  .v-control-button {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid var(--border); background: var(--surface);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; transition: border-color .15s, background .15s; flex-shrink: 0;
  }
  .v-control-button.active { border-color: var(--green); background: rgba(52,211,153,.08); }

  /* Context menu */
  .v-context-menu, .context-menu {
    position: fixed; z-index: 1000; min-width: 180px; padding: 4px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); box-shadow: 0 8px 24px rgba(0,0,0,.4);
  }
  .v-context-menu[hidden], .context-menu[hidden] { display: none; }
  .v-context-button {
    width: 100%; border: 0; border-radius: 4px; background: transparent;
    color: var(--text); text-align: left; padding: 7px 10px;
    font-size: 12px; font-family: 'Inter', sans-serif; cursor: pointer;
    transition: background .1s;
  }
  .v-context-button:hover { background: var(--surface2); }
  .v-empty-state {
    border: 1px solid var(--border); border-radius: 8px; padding: 20px;
    background: var(--surface2); color: var(--text-dim); text-align: center; font-size: 13px;
  }
`;

export default function VeilleurPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setTimeout(() => {
      try { initVeilleur(); } catch(e) { console.warn('Veilleur:', e); }
    }, 50);
  }, []);

  const addAccount = () => {
    if (window.veilleurAddAccount) window.veilleurAddAccount();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{VEILLEUR_CSS}</style>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Gérez vos enclos — double-cliquez sur un nom pour le renommer
        </span>
        <button
          onClick={addAccount}
          style={{
            padding: '5px 12px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >+ Ajouter un personnage</button>
      </div>
      <div className="v-shell">
        <div className="v-scroll">
          <main id="veilleur-accounts-root" className="v-accounts" />
        </div>
      </div>
      <div id="veilleur-context-menu" className="context-menu" hidden />
      <footer style={{
        padding: '14px 20px', borderTop: '1px solid var(--border)',
        fontSize: 12, color: 'var(--text-faint)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>Veilleur des Enclos — Imaginé par <strong style={{ color: 'var(--text-dim)' }}>Mr. B...</strong></span>
        <span>Outil de gestion des jauges en temps réel</span>
      </footer>
    </div>
  );
}