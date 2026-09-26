import { Filter, LayoutGrid, Plus, Search, Tags } from 'lucide-react';

// Placeholder view for sections that are not built yet.
export default function SectionPage({ active, query, setQuery, onNewOperation }) {
  const isProducts = active === 'Products';
  const title = isProducts ? 'Product catalogue' : active;
  const subtitle = isProducts
    ? 'Manage products, stock availability, and reorder rules.'
    : `Manage ${active.toLowerCase()} across your warehouses.`;

  return (
    <div className="page-wrap inner-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OPERATIONS / {active.toUpperCase()}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="primary-button" onClick={onNewOperation}>
          <Plus size={17} />
          Create {isProducts ? 'product' : 'operation'}
        </button>
      </div>
      <div className="section-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input
            placeholder={`Search ${active.toLowerCase()}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button className="secondary-button">
          <Filter size={16} />
          Filter
        </button>
        <button className="secondary-button">
          <Tags size={16} />
          Categories
        </button>
      </div>
      <section className="panel placeholder-panel">
        <div className="big-icon">
          <LayoutGrid size={26} />
        </div>
        <h2>{isProducts ? 'Your inventory, in one clear view.' : `Nothing is out of place.`}</h2>
        <p>
          {isProducts
            ? 'Your product records will appear here as you add them.'
            : 'Create your first operation to start tracking movement.'}
        </p>
        <button className="primary-button" onClick={onNewOperation}>
          <Plus size={17} />
          Get started
        </button>
      </section>
    </div>
  );
}
