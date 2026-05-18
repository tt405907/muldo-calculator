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
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
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
          href="https://discord.gg/NzQdDwR7Xx"
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