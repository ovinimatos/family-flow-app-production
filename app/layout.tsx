import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';
import { TransactionsProvider } from './context/TransactionsContext'; // <--- Importe isso

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FamilyFlow',
  description: 'Gestão Financeira Familiar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <TransactionsProvider> {/* Adicione aqui dentro do Auth */}
            {children}
          </TransactionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}