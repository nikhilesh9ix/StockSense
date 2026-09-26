export default function KpiCard({ label, value, detail, note, icon: Icon, tone, alert }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="kpi-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <p>
          <b className={alert ? 'alert-text' : ''}>{detail}</b> {note}
        </p>
      </div>
      <div className="mini-chart">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
