// components/Sidebar.js
export default function Sidebar() {
    return (
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
        <nav className="space-y-2">
          <a
            href="/dashboard"
            className="block rounded px-3 py-2 hover:bg-gray-100 transition"
          >
            Dashboard
          </a>
          <a
            href="/courses"
            className="block rounded px-3 py-2 hover:bg-gray-100 transition"
          >
            Courses
          </a>
          {/* Add more nav links */}
        </nav>
      </div>
    );
  }