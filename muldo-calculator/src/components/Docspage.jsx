const SECTIONS = [
  {
    title: 'Comment fonctionne le calculateur ?',
    content: `Le calculateur simule la production de Muldos en cascade. Vous sélectionnez un Muldo cible, et il calcule combien de bébés vous pouvez espérer obtenir en partant d'un stock de Gen 1 capturés dans la nature.`,
  },
  {
    title: 'Probabilité par accouplement (p)',
    content: `À chaque accouplement, le bébé a une probabilité p d'être du bon type. Cette probabilité dépend du niveau des parents et des bonus activés.`,
    formula: 'p = 30% + niveau × 2 × 0.15% + Optimakina × 10%',
    note: 'Maximum : 100% (niveau 200 + Optimakina)',
  },
  {
    title: 'Branches indépendantes',
    content: `Chaque parent devient stérile après un accouplement. Un Muldo intermédiaire (ex: Roux) peut apparaître plusieurs fois dans l'arbre — chaque instance a ses propres parents dédiés, son propre stock de Gen 1. Les branches ne se partagent rien.`,
  },
  {
    title: 'Clonage des stériles',
    content: `Le clonage permet de transformer 2 parents stériles en 1 fertile (copie de l'un des deux, au hasard). En appliquant ce principe à l'infini, chaque lot de paires génère une série géométrique de raison ½.`,
    formula: 'cloneMult = 2 − 1 / (paires + 1)',
    note: '×1.5 avec 1 paire → converge vers ×2 avec beaucoup de paires',
  },
  {
    title: 'Capacité Reproducteur',
    content: `La capacité Reproducteur donne +1 bébé supplémentaire à chaque succès d'accouplement. Ce n'est pas une augmentation de la probabilité p — c'est un multiplicateur ×2 sur les bébés produits par succès.`,
    formula: 'bébés = tentatives × p × (Reproducteur ? 2 : 1)',
  },
  {
    title: 'Ratio mâle / femelle',
    content: `Pour former une paire reproductrice (1♂ + 1♀), il faut capturer en moyenne 2 Muldos dans la nature (le sexe est aléatoire à 50/50). Le calculateur affiche donc le nombre de Muldos à capturer, pas le nombre de paires.`,
    formula: 'captures Gen 1 = paires nécessaires × 2',
  },
  {
    title: 'Les Muldos Gen 1',
    content: `Les Gen 1 (Orchidée, Ébène, Indigo, Pourpre, Doré) sont les seuls Muldos capturables directement dans la nature. Tous les autres Muldos sont obtenus par breeding à partir de ces 5 espèces de base.`,
  },
  {
    title: 'Mode avancé',
    content: `Le mode avancé permet de définir un niveau, un état Optimakina, Clonage et Reproducteur différents pour chaque génération de parents. Utile si vos Gen 3 ont un niveau différent de vos Gen 6, par exemple.`,
  },
];

export default function DocsPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Documentation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Tout ce que vous devez savoir sur les calculs utilisés par le calculateur.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px 20px',
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: s.formula ? 10 : 0 }}>
              {s.content}
            </p>
            {s.formula && (
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 14px',
                fontFamily: 'monospace',
                fontSize: 13,
                color: 'var(--gold)',
                marginBottom: s.note ? 6 : 0,
              }}>
                {s.formula}
              </div>
            )}
            {s.note && (
              <p style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 4 }}>
                {s.note}
              </p>
            )}
          </div>
        ))}
      </div>

      <footer style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--text-faint)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Réalisé par <a href="https://www.youtube.com/@Chikkinsama" target="_blank" rel="noopener" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Chikkin Sama</a></span>
        <span>Mis à jour le 18 mars 2026</span>
      </footer>
    </div>
  );
}