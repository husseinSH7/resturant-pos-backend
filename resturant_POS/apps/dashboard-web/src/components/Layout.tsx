import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Table2,
  UtensilsCrossed,
  Users,
  CalendarClock,
  Megaphone,
  ClipboardList,
  Package,
  BarChart3,
  Smartphone,
  Settings,
  ChefHat,
} from 'lucide-react'

const navSections = [
  {
    title: 'Operations',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/tables', label: 'Tables', icon: Table2 },
      { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
      { to: '/kitchen', label: 'Kitchen', icon: ChefHat },
    ],
  },
  {
    title: 'Customers',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/reservations', label: 'Reservations', icon: CalendarClock },
      { to: '/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
  {
    title: 'Staff & Inventory',
    items: [
      { to: '/staff', label: 'Staff', icon: ClipboardList },
      { to: '/inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    title: 'Insights & System',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/devices', label: 'Devices', icon: Smartphone },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-orange-600">Restaurant POS</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}