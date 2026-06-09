import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Shredded — get there together",
  description:
    "A group weight-loss accountability app for small friend groups. Cheer each other on, log check-ins, hit your goals.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-6 pb-24">{children}</main>
      </body>
    </html>
  );
}
