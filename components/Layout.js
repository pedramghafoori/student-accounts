// Layout.js
import Sidebar from "./Sidebar";

export default function Layout({ children, accounts = [], onSelectAccount }) {
  return (
    // Occupies full window (width & height).
    <div className="h-screen w-screen overflow-hidden">
      {/* Internal flex container also stretches to full height. */}
      <div className="flex h-full">
        {/* Sidebar takes up height 100% */}
        <Sidebar accounts={accounts} onSelectAccount={onSelectAccount} />
        
        {/* Main content (Dashboard) grows to fill remaining space. */}
        {/* 100% height so it never shrinks, and overflow-y-auto for scrolling. */}
        <main className="flex-1 h-full bg-gray-50 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}