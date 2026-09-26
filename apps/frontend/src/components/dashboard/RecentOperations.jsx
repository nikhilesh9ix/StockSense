import { useMemo } from 'react';
import { MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react';
import { operations, operationStatuses } from '../../data/mockData.js';

export default function RecentOperations({ query, setQuery, statusFilter, setStatusFilter }) {
  const filteredOps = useMemo(
    () =>
      operations.filter((operation) => {
        const matchesQuery =
          `${operation.id} ${operation.type} ${operation.partner} ${operation.items}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'All statuses' || operation.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [query, statusFilter]
  );

  return (
    <section className="panel operations-panel">
      <div className="panel-header">
        <div>
          <h2>Recent operations</h2>
          <p>Track the latest movement in your inventory.</p>
        </div>
        <button className="text-button">
          View all <span>↗</span>
        </button>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input
            placeholder="Search operations..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All statuses</option>
          {operationStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <button className="icon-button subtle">
          <SlidersHorizontal size={17} />
        </button>
      </div>
      <div className="ops-table">
        <div className="table-head">
          <span>REFERENCE</span>
          <span>TYPE</span>
          <span>PARTNER / LOCATION</span>
          <span>STATUS</span>
          <span>DATE</span>
          <span />
        </div>
        {filteredOps.map((operation) => (
          <div className="table-row" key={operation.id}>
            <strong className="reference">{operation.id}</strong>
            <span className={`type-icon ${operation.tone}`}>
              <operation.icon size={15} />
              {operation.type}
            </span>
            <div className="partner-cell">
              <strong>{operation.partner}</strong>
              <span>{operation.items}</span>
            </div>
            <span className={`status ${operation.status.toLowerCase()}`}>
              <i />
              {operation.status}
            </span>
            <span className="date-cell">{operation.date}</span>
            <button className="more-button">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>
      {filteredOps.length === 0 && (
        <div className="empty-state">No operations match these filters.</div>
      )}
    </section>
  );
}
