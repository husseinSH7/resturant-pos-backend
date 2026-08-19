import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Menu from './pages/Menu'
import Tables from './pages/Tables'
import Customers from './pages/Customers'
import Reservations from './pages/Reservations'
import Staff from './pages/Staff'
import Inventory from './pages/Inventory'
import Marketing from './pages/Marketing'
import Analytics from './pages/Analytics'
import Devices from './pages/Devices'
import Settings from './pages/Settings'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('owner_token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Admin />} />
          <Route path="tables" element={<Tables />} />
          <Route path="menu" element={<Menu />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="staff" element={<Staff />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="devices" element={<Devices />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}