import { Box, MoreHorizontal } from 'lucide-react';
import { stock } from '../../data/mockData.js';

export default function StockHealth() {
  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h2>Stock health</h2>
          <p>Top items by current quantity.</p>
        </div>
        <button className="more-button">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="stock-list">
        {stock.map((item) => (
          <div className="stock-item" key={item.sku}>
            <div className={`product-thumb ${item.color}`}>
              <Box size={18} />
            </div>
            <div className="stock-name">
              <strong>{item.name}</strong>
              <span>{item.location}</span>
            </div>
            <div className="stock-qty">
              <strong>{item.qty}</strong>
              <span>{item.unit}</span>
            </div>
            <div className={`stock-bar ${item.qty < item.threshold ? 'low' : ''}`}>
              <i style={{ width: `${Math.min(100, (item.qty / item.threshold) * 65)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <button className="panel-link">
        View all products <span>↗</span>
      </button>
    </section>
  );
}
