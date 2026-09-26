import { useState } from 'react';
import NewOperationModal from './components/NewOperationModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SectionPage from './pages/SectionPage.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [active, setActive] = useState('Overview');
  const [warehouse, setWarehouse] = useState('All warehouses');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [showNew, setShowNew] = useState(false);

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  const openNewOperation = () => setShowNew(true);

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-content">
        <Topbar active={active} query={query} setQuery={setQuery} />
        {active === 'Overview' ? (
          <DashboardPage
            warehouse={warehouse}
            setWarehouse={setWarehouse}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onNewOperation={openNewOperation}
          />
        ) : (
          <SectionPage
            active={active}
            query={query}
            setQuery={setQuery}
            onNewOperation={openNewOperation}
          />
        )}
      </main>
      {showNew && <NewOperationModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
