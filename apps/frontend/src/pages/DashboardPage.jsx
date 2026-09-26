import { ChevronDown, Filter, Plus, Store } from 'lucide-react';
import KpiCard from '../components/KpiCard.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import RecentOperations from '../components/dashboard/RecentOperations.jsx';
import StockHealth from '../components/dashboard/StockHealth.jsx';
import { kpis, warehouses } from '../data/mockData.js';

export default function DashboardPage({
  warehouse,
  setWarehouse,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onNewOperation,
}) {
  return (
    <div className="page-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            LIVE INVENTORY
          </div>
          <h1>
            Inventory overview <span>✦</span>
          </h1>
          <p>Here is what is happening across your inventory today.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button">
            <Filter size={16} />
            Filters
          </button>
          <button className="primary-button" onClick={onNewOperation}>
            <Plus size={17} />
            New operation
          </button>
        </div>
      </div>
      <div className="context-bar">
        <div className="context-item">
          <Store size={16} />
          <span>Viewing stock in</span>
          <select value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>
            {warehouses.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="date-range">
          <span className="calendar-mark">◷</span> Sep 20 — Sep 26, 2026 <ChevronDown size={14} />
        </div>
      </div>
      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>
      <div className="content-grid">
        <RecentOperations
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <section className="side-column">
          <StockHealth />
          <QuickActions onNewOperation={onNewOperation} />
        </section>
      </div>
    </div>
  );
}
