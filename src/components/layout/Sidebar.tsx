import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Building2,
  FolderTree,
  Package,
  Boxes,
  Monitor,
  Receipt,
  Clock,
  BarChart3,
  Bell,
  Users,
  Shield,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../contexts/StoreContext';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const storeNavigation = [
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Items', href: '/items', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  { name: 'POS Devices', href: '/pos', icon: Monitor },
  { name: 'Orders', href: '/orders', icon: Receipt },
  { name: 'Shifts', href: '/shifts', icon: Clock },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Alerts', href: '/alerts', icon: Bell },
];

const systemNavigation = [
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Roles', href: '/roles', icon: Shield },
  { name: 'Audit Logs', href: '/audit', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { stores, currentStore, setCurrentStore } = useStore();
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(true);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);

  const isStoreRouteActive = storeNavigation.some(item =>
    location.pathname.startsWith(item.href)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">POS Portal</h1>
            <p className="text-xs text-gray-500">Back Office</p>
          </div>
        </div>
      </div>

      {/* Store Selector */}
      {stores.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Current Store</p>
          <div className="relative">
            <button
              onClick={() => setIsStoreSelectorOpen(!isStoreSelectorOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="truncate">{currentStore?.name || 'Select Store'}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', isStoreSelectorOpen && 'rotate-180')} />
            </button>

            {isStoreSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setCurrentStore(store);
                      setIsStoreSelectorOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="truncate">{store.name}</span>
                    {currentStore?.id === store.id && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        {mainNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}

        {/* Store Menu with Dropdown */}
        <div className="pt-2">
          <button
            onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isStoreRouteActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5" />
              <span>Store Management</span>
            </div>
            {isStoreMenuOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isStoreMenuOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
              {storeNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase mb-2">System</p>
          {systemNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
