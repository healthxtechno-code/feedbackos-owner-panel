import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main style={{
        marginLeft: 240,
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
        className="max-lg:!ml-0"
      >
        <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
      </main>
    </div>
  );
}
