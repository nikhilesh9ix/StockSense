import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Plus, Sparkles } from 'lucide-react';

const actions = [
  { label: 'Receive stock', icon: ArrowDownToLine },
  { label: 'Create delivery', icon: ArrowUpFromLine },
  { label: 'Transfer stock', icon: ArrowLeftRight },
];

export default function QuickActions({ onNewOperation }) {
  return (
    <section className="panel quick-panel">
      <div className="quick-glow" />
      <div className="panel-header">
        <div>
          <h2>Quick actions</h2>
          <p>Keep your workflow moving.</p>
        </div>
        <Sparkles size={18} className="sparkle" />
      </div>
      <div className="quick-actions">
        {actions.map(({ label, icon: Icon }) => (
          <button key={label} onClick={onNewOperation}>
            <Icon size={16} />
            <span>{label}</span>
            <Plus size={14} />
          </button>
        ))}
      </div>
    </section>
  );
}
