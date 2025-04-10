// app/layout.js
import '../app/globals.css';
import React from "react";
import FooterMenu from "../components/FooterMenu";
import AppProvider from "./context/appcontext";

export const metadata = {
  title: 'Self-Serve Portal',
  description: 'Automate refunds and rescheduling',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
      <AppProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <FooterMenu />
        </div>
      </AppProvider>
      </body>
    </html>
  );
}