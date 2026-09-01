import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "MyPortfolio – Portofolio Dinamis",
  description: "Website portofolio dinamis dibuat dengan Next.js dan Express.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        <main>{children}</main>
        <footer className="footer">
          <p>© 2026 MyPortfolio. Dibuat dengan ❤️ menggunakan Next.js & Express.js</p>
        </footer>
      </body>
    </html>
  );
}