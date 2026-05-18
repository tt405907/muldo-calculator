import { useState, useMemo } from 'react';
import './index.css';
import { MULDOS_BY_GEN } from './data/muldos';
import { compute, calcP } from './lib/compute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StockCard from './components/StockCard';
import TreeCard from './components/TreeCard';
import CascadeCard from './components/CascadeCard';
import AdvancedParamsCard from './components/AdvancedParamsCard';
import Footer from './components/Footer';
import VeilleurPage from './components/VeilleurPage_';
import DocsPage from './components/DocsPage_';

export default function App() {
  const [activeTab, setActiveTab] = useState('calc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedGen, setSelectedGen] = useState('');
  const [selectedMuldo, setSelectedMuldo] = useState('');
  const [mult, setMult] = useState(1);
  const [level, setLevel] = useState(1);
  const [opti, setOpti] = useState(false);
  const [clone, setClone] = useState(true);
  const [repro, setRepro] = useState(false);
  const [mode, setMode] = useState('simple');
  const [advParams, setAdvParams] = useState({});
  const [advOpen, setAdvOpen] = useState(false);

  const p = calcP(level, opti);

  const result = useMemo(() => {
    if (!selectedMuldo) return null;
    return compute(selectedMuldo, p, mult, clone, repro, mode === 'avance' ? advParams : null);
  }, [selectedMuldo, p, mult, clone, repro, mode, advParams]);

  const handleGenChange = (gen) => { setSelectedGen(gen); setSelectedMuldo(''); };
  const handleMuldoChange = (name) => { setSelectedMuldo(name); setAdvParams({}); };

  const handleAdvChange = (gen, key, value) => {
    setAdvParams(prev => ({
      ...prev,
      [gen]: { level, opti, clone, repro, ...prev[gen], [key]: value }
    }));
  };

  const handleModeChange = (m) => {
    setMode(m);
    if (m === 'avance' && result) {
      const gens = [...new Set(result.enriched.map(s => s.gen))].sort((a,b)=>a-b);
      const init = {};
      gens.forEach(g => { init[g] = advParams[g] ?? { level, opti, clone, repro }; });
      setAdvParams(init);
      setAdvOpen(true);
    } else {
      setAdvOpen(false);
    }
  };

  return (
    <div className="app-wrapper">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuToggle={() => setSidebarOpen(o => !o)}
      />

      <div className="app-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* CALCULATEUR */}
        {activeTab === 'calc' && (
          <>
            <Sidebar
              open={sidebarOpen}
              selectedGen={selectedGen}
              selectedMuldo={selectedMuldo}
              onGenChange={handleGenChange}
              onMuldoChange={handleMuldoChange}
              mult={mult} setMult={setMult}
              level={level} setLevel={setLevel}
              opti={opti} setOpti={setOpti}
              clone={clone} setClone={setClone}
              repro={repro} setRepro={setRepro}
              mode={mode} onModeChange={handleModeChange}
              p={p} result={result}
            />
            <main className="main-scroll" style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!result ? (
                <div className="empty-state">
                  <div className="empty-icon">⚗</div>
                  <p>Sélectionnez un <strong>Muldo cible</strong><br />et ajustez le multiplicateur.</p>
                </div>
              ) : (
                <>
                  <StockCard result={result} />
                  <TreeCard result={result} />
                  {mode === 'avance' && (
                    <AdvancedParamsCard
                      result={result}
                      advParams={advParams}
                      onChange={handleAdvChange}
                      open={advOpen}
                      onToggle={() => setAdvOpen(o => !o)}
                      defaultLevel={level} defaultOpti={opti}
                      defaultClone={clone} defaultRepro={repro}
                    />
                  )}
                  <CascadeCard result={result} p={p} mode={mode} advParams={advParams} />
                </>
              )}
              <Footer />
            </main>
          </>
        )}

        {/* VEILLEUR */}
        {activeTab === 'veilleur' && <VeilleurPage />}

        {/* DOCS */}
        {activeTab === 'docs' && <DocsPage />}
      </div>
    </div>
  );
}