import Sidebar from "./Sidebar";

export default function Layout({ children, accounts = [], onSelectAccount }) {
  return (
    <div className="flex">
      <Sidebar accounts={accounts || []} onSelectAccount={onSelectAccount} />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}