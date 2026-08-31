import "./globals.css";
import Nav from "./nav";

export const metadata = {
  title: "Meagan's Teaching Dashboard",
  description: "Gradebook and classroom tools",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
