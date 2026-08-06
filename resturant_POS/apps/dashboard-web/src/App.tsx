import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Inventory from './pages/Inventory'
import Reservations from './pages/Reservations'
import Analytics from './pages/Analytics'
import Staff from './pages/Staff'
import Settings from './pages/Settings'
import Tables from './pages/Tables'
import Admin from './pages/Admin'
import { useKeyboardShortcuts, commonShortcuts } from './hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'

function AppContent() {
  const location = useLocation();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts([
    ...commonShortcuts,
    { key: '?', action: () => setShowShortcuts(!showShortcuts), description: 'Show shortcuts' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Restaurant POS Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/' ? 'page' : undefined}
                >
                  Dashboard
                </Link>
                <Link
                  to="/analytics"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/analytics' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/analytics' ? 'page' : undefined}
                >
                  Analytics
                </Link>
                <Link
                  to="/tables"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/tables' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/tables' ? 'page' : undefined}
                >
                  Tables
                </Link>
                <Link
                  to="/inventory"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/inventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/inventory' ? 'page' : undefined}
                >
                  Inventory
                </Link>
                <Link
                  to="/reservations"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/reservations' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/reservations' ? 'page' : undefined}
                >
                  Reservations
                </Link>
                <Link
                  to="/staff"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/staff' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/staff' ? 'page' : undefined}
                >
                  Staff
                </Link>
                <Link
                  to="/settings"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/settings' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/settings' ? 'page' : undefined}
                >
                  Settings
                </Link>
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded ${
                    location.pathname === '/admin' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={location.pathname === '/admin' ? 'page' : undefined}
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
        <Routes>
          <Route path="/" element={<div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Restaurant POS Dashboard</h2>
            <p className="text-gray-600">Select a module from the navigation above to get started.</p>
          </div>} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <KeyboardShortcutsHelp
          shortcuts={commonShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App