import "./globals.css";

export const metadata = {
  title: "Flaschen Konfigurator",
  description: "Personalisieren Sie Ihre Weinflasche",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="h-full bg-gray-100 text-gray-800 antialiased">{children}</body>
    </html>
  );
}