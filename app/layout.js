// app/layout.js
import './globals.css';
import AppProvider from './context/appcontext';
import { AccountProvider } from './context/AccountContext';
import FooterMenu from '../components/FooterMenu';

export const metadata = {
  title: 'Student Portal',
  description: 'Student Portal for Course Management',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: 'no'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <AccountProvider>
          <AppProvider>
            <div className="ios-page-transition">
              {children}
            </div>
            <FooterMenu />
          </AppProvider>
        </AccountProvider>
      </body>
    </html>
  );
}