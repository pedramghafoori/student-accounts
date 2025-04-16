// app/layout.js
import './globals.css';
import AppProvider from './context/appcontext';
import { AccountProvider } from './context/AccountContext';
import FooterMenu from '../components/FooterMenu';

export const metadata = {
  title: 'Student Portal',
  description: 'Student Portal for Course Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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