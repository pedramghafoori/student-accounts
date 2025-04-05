// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Self-Serve Portal',
  description: 'Automate refunds and rescheduling',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}