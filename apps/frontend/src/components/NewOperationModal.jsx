import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Check,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const operationTypes = [
  { type: 'Receipt', icon: ArrowDownToLine },
  { type: 'Delivery', icon: ArrowUpFromLine },
  { type: 'Transfer', icon: ArrowLeftRight },
  { type: 'Adjustment', icon: SlidersHorizontal },
];

export default function NewOperationModal({ onClose }) {
  const [type, setType] = useState('Receipt');

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">NEW WORKFLOW</span>
            <h2>Create an operation</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <label>Operation type</label>
        <div className="operation-types">
          {operationTypes.map(({ type: item, icon: Icon }) => (
            <button
              className={type === item ? 'selected' : ''}
              onClick={() => setType(item)}
              key={item}
            >
              <Icon size={17} />
              {item}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <label>
            Reference
            <input placeholder="Auto-generated" disabled />
          </label>
          <label>
            {type === 'Transfer' ? 'Destination' : 'Partner'}
            <input placeholder={type === 'Transfer' ? 'Select location' : 'Search partner'} />
          </label>
          <label className="wide">
            Notes
            <textarea placeholder="Add a note for your team..." />
          </label>
        </div>
        <div className="modal-foot">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={onClose}>
            <Check size={17} />
            Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}
