import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1 className="page-title">Welcome back, Megan 🌸</h1>
      <p className="page-sub">
        Everything for your classroom, all in one place.
      </p>
      <div className="tool-grid">
        <Link href="/gradebook" className="tool-card">
          <span className="emoji">📖</span>
          <h3>Gradebook</h3>
          <p>
            Track assignments and marks for each class. Upload a student list
            to build your roster automatically.
          </p>
        </Link>
        <Link href="/documents" className="tool-card">
          <span className="emoji">📁</span>
          <h3>Documents</h3>
          <p>
            All your tracking sheets and templates in one place — open or
            download them from any device.
          </p>
        </Link>
        <div className="tool-card soon">
          <span className="emoji">🗓️</span>
          <h3>Lesson Planner</h3>
          <p>Plan your weeks and units. Coming soon.</p>
        </div>
        <div className="tool-card soon">
          <span className="emoji">🪑</span>
          <h3>Seating Charts</h3>
          <p>Arrange your classroom with a click. Coming soon.</p>
        </div>
        <div className="tool-card soon">
          <span className="emoji">✨</span>
          <h3>More to come</h3>
          <p>New tools will appear here as we add them.</p>
        </div>
      </div>
    </>
  );
}
