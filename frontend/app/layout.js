import "./globals.css";

export const metadata = {
  title: "KVC",
  description: "Panel de administración KVC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
