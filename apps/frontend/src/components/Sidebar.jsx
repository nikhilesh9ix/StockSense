import { ChevronDown, CircleHelp, MoreHorizontal, Settings, Warehouse } from 'lucide-react';
import { navGroups } from '../data/mockData.js';
import BrandMark from './BrandMark.jsx';

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
        <span>stocksense</span>
        <small>PRO</small>
      </div>
      <div className="warehouse-switch">
        <div className="warehouse-icon">
          <Warehouse size={16} />
        </div>
        <div>
          <span>Current warehouse</span>
          <strong>Main Warehouse</strong>
        </div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <label>{group.label}</label>
            {group.links.map((link) => (
              <button
                key={link.label}
                className={active === link.label ? 'nav-item active' : 'nav-item'}
                onClick={() => setActive(link.label)}
              >
                <link.icon size={17} />
                <span>{link.label}</span>
                {link.count && <em>{link.count}</em>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => setActive('Settings')}>
          <Settings size={17} />
          <span>Warehouse settings</span>
        </button>
        <div className="help-box">
          <div className="help-icon">
            <CircleHelp size={16} />
          </div>
          <div>
            <strong>Need a hand?</strong>
            <span>Visit the help center</span>
          </div>
        </div>
        <div className="profile-row">
          <div className="avatar">IM</div>
          <div>
            <strong>Inventory manager</strong>
            <span>Workspace account</span>
          </div>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}
