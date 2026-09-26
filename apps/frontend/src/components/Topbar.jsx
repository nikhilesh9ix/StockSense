import { useState } from 'react';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';

export default function Topbar({ active, query, setQuery }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="breadcrumbs">
        <span>Workspace</span>
        <ChevronDown size={14} />
        <strong>{active}</strong>
      </div>
      <div className="top-actions">
        <div className="search-wrap top-search">
          <Search size={17} />
          <input
            placeholder="Search anything"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </div>
        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={19} />
          <i />
        </button>
        <div className="user-chip">
          <div className="avatar">IM</div>
          <span>Inventory manager</span>
          <ChevronDown size={14} />
        </div>
      </div>
      {showNotifications && (
        <div className="notification-pop">
          <strong>Notifications</strong>
          <p>
            <span className="dot coral-dot" />
            Cement Bags are below reorder point.
          </p>
          <p>
            <span className="dot green-dot" />
            Receipt WH/IN/00042 is ready to validate.
          </p>
        </div>
      )}
    </header>
  );
}
