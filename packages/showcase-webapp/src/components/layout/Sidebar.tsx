
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'workspace', label: 'Workspace', icon: '🏗️' },
    { id: 'node', label: 'Node', icon: '🖥️' },
    { id: 'wallet', label: 'Wallet', icon: '💼' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'contracts', label: 'Contracts', icon: '📋' },
    { id: 'logs', label: 'Logs', icon: '📝' },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-sm border-r border-gray-200 transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <nav className="h-full p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                {isOpen && (
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}