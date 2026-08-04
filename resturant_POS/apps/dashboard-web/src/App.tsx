import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Inventory from './pages/Inventory'
import Reservations from './pages/Reservations'

function App() {
  const location = useLocation();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Restaurant POS Dashboard</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      location.pathname === '/' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/inventory"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      location.pathname === '/inventory' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Inventory
                  </Link>
                  <Link
                    to="/reservations"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      location.pathname === '/reservations' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reservations
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Restaurant POS Dashboard</h2>
              <p className="text-gray-600">Select a module from the navigation above to get started.</p>
            </div>} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reservations" element={<Reservations />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App