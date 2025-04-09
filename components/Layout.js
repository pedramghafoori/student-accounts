import Sidebar from "./Sidebar";

export default function Layout({ children, accounts = [], onSelectAccount }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar: fixed width, never shrinks */}
      <div className="w-64 flex-shrink-0 bg-white shadow p-4">
        <Sidebar accounts={accounts} onSelectAccount={onSelectAccount} />
      </div>
      {/* Main Content: expands to fill remaining space */}
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}