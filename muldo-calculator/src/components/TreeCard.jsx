const GEN_COLORS = {
  1:  { border: '#085041', text: '#9FE1CB' },
  2:  { border: '#0C447C', text: '#B5D4F4' },
  3:  { border: '#633806', text: '#FAC775' },
  4:  { border: '#72243E', text: '#F4C0D1' },
  5:  { border: '#3C3489', text: '#CECBF6' },
  6:  { border: '#27500A', text: '#C0DD97' },
  7:  { border: '#791F1F', text: '#F7C1C1' },
  8:  { border: '#712B13', text: '#F0997B' },
  9:  { border: '#444441', text: '#D3D1C7' },
  10: { border: '#412402', text: '#FAC775' },
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export default function TreeCard({ result }) {
  const { treeMap } = result;
  const byGen = {};
  Object.entries(treeMap).forEach(([name, data]) => {
    if (!byGen[data.gen]) byGen[data.gen] = [];
    byGen[data.gen].push({ name, ...data });
  });
  const gens = Object.keys(byGen).map(Number).sort((a, b) => a - b);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">Arbre de production</span>
      </div>
      <div className="tree">
        {gens.map(gen => {
          const colors = GEN_COLORS[gen] || { border: '#3A2E1E', text: '#E8DCC8' };
          return (
            <div key={gen}>
              <div className="tree-gen-label">Génération {gen}</div>
              <div className="tree-nodes">
                {byGen[gen].map(node => (
                  <div key={node.name} className="tree-node" style={{ borderColor: colors.border, color: colors.text }}>
                    <div>{cap(node.name)}</div>
                    {node.parents.length > 0 && (
                      <div className="tree-node-parents">{node.parents.map(cap).join(' + ')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}