export default function Header({ activeTab, onTabChange, onMenuToggle }) {
  return (
    <header className="app-header">
      <a href="/" className="header-brand">
        <div className="header-brand-dot" />
        <span className="header-brand-name">Chikkin's Hub</span>
      </a>

      <nav className="header-nav">
        {[
          { id: 'calc',     label: 'Calculateur' },
          { id: 'veilleur', label: 'Veilleur des Enclos' },
          { id: 'docs',     label: 'Documentation' },
          { id: 'outils',   label: 'Outils élevage', beta: true },
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.beta && (
              <span style={{
                marginLeft: 5, fontSize: 9, fontWeight: 700,
                padding: '1px 5px', borderRadius: 3,
                background: 'rgba(234,91,39,.15)',
                color: '#EA5B27', letterSpacing: '0.5px',
                verticalAlign: 'middle',
              }}>dev</span>
            )}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <a
          href="https://www.youtube.com/@Chikkinsama"
          target="_blank"
          rel="noopener"
          className="header-icon-btn"
          title="YouTube"
        >
          ▶
        </a>
        <a
          href="https://discord.gg/svv6MAaW"
          target="_blank"
          rel="noopener"
          className="header-icon-btn"
          title="Discord"
        >
          💬
        </a>
        <button
          className="header-icon-btn mobile-menu-btn"
          onClick={onMenuToggle}
          title="Menu"
          style={{ display: 'none' }}
        >
          ☰
        </button>
      </div>
    </header>
  );
}