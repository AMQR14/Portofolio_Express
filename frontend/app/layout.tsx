import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";
import PageTransition from "./components/PageTransition";
import LenisProvider from "./components/LenisProvider";
import ScrollReveal from "./components/ScrollReveal";

export const metadata: Metadata = {
  title: "Andi Muhammad Qismat Rajjab • Full-Stack Developer",
  description:
    "Helping brands thrive in the digital world. Delivering tailor-made digital designs and building interactive websites from scratch. © Code by Andi Muhammad Qismat Rajjab",
  icons: {
    icon: "/api/favicon",
    shortcut: "/api/favicon",
    apple: "/api/favicon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="auto">
      <body>
        <Preloader />
        <LenisProvider>
          <PageTransition>
            <ScrollReveal />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </PageTransition>
        </LenisProvider>
      </body>
    </html>
  );
}
