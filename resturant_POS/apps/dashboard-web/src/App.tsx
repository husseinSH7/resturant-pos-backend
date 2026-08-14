import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Analytics from './pages/Analytics'
import Staff from './pages/Staff'
import Tables from './pages/Tables'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import Marketing from './pages/Marketing'
import Devices from './pages/Devices'
import Inventory from './pages/Inventory'
import Reservations from './pages/Reservations'
import Login from './pages/Login'               // 👈 import the Login page
import { useTheme } from './hooks/useTheme'

function App() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  // If on login page, render only the login form (no nav, no sidebar)
  if (location.pathname === '/login') {
    return <Login />
  }

  // Otherwise, render the full dashboard layout with navigation
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => document.getElementById('mobile-menu')?.classList.toggle('hidden')}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant POS Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/" current={location.pathname === '/'}>Analytics</NavLink>
                <NavLink to="/staff" current={location.pathname === '/staff'}>Staff</NavLink>
                <NavLink to="/tables" current={location.pathname === '/tables'}>Tables</NavLink>
                <NavLink to="/customers" current={location.pathname === '/customers'}>Customers</NavLink>
                <NavLink to="/marketing" current={location.pathname === '/marketing'}>Marketing</NavLink>
                <NavLink to="/devices" current={location.pathname === '/devices'}>Devices</NavLink>
                <NavLink to="/inventory" current={location.pathname === '/inventory'}>Inventory</NavLink>
                <NavLink to="/reservations" current={location.pathname === '/reservations'}>Reservations</NavLink>
                <NavLink to="/settings" current={location.pathname === '/settings'}>Settings</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div id="mobile-menu" className="hidden lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 space-y-2">
          <Link to="/" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Analytics</Link>
          <Link to="/staff" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Staff</Link>
          <Link to="/tables" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Tables</Link>
          <Link to="/customers" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Customers</Link>
          <Link to="/marketing" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Marketing</Link>
          <Link to="/devices" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Devices</Link>
          <Link to="/inventory" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Inventory</Link>
          <Link to="/reservations" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Reservations</Link>
          <Link to="/settings" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Analytics />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

// Helper NavLink component
function NavLink({ to, current, children }: { to: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
        current
          ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {children}
    </Link>
  )
}

export default App