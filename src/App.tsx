import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import { UIProvider } from '@/context/UIContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';

// Modals
import { AuthModal } from '@/components/auth/AuthModal';
import { WalletModal } from '@/components/wallet/WalletModal';
import { StatisticsModal } from '@/components/profile/StatisticsModal';
import { ProvablyFairModal } from '@/components/fairness/ProvablyFairModal';
import { VaultModal } from '@/components/vault/VaultModal';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import AdminLayout from '@/components/admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import DiceGame from './pages/DiceGame';
import CoinFlip from './pages/CoinFlip';
import MinesGame from './pages/MinesGame';
import PlinkoGame from './pages/PlinkoGame';
import CrashGame from './pages/CrashGame';
import BlackjackGame from './pages/BlackjackGame';
import VIPClub from './pages/VIPClub';
import Promotions from './pages/Promotions';
import Affiliate from './pages/Affiliate';
import HelpCenter from './pages/HelpCenter';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import ResponsibleGambling from './pages/legal/ResponsibleGambling';
import Blog from './pages/community/Blog';
import Forum from './pages/community/Forum';
import SportsPage from './pages/Sports';
import AuthPage from './pages/Auth';

// User Pages
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import Transactions from './pages/Transactions';
import MyBets from './pages/MyBets';
import RecentBets from './pages/RecentBets';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManager from './pages/admin/UsersManager';
import WithdrawalsCenter from './pages/admin/WithdrawalsCenter';
import Deposits from './pages/admin/Deposits';
import CasinoBets from './pages/admin/CasinoBets';
import SportsBets from './pages/admin/SportsBets';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminAffiliates from '@/pages/admin/Affiliates';
import AdminNotifications from '@/pages/admin/Notifications';
import GlobalSettings from '@/pages/admin/GlobalSettings';
import WalletSettings from './pages/admin/WalletSettings';

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <UIProvider>
          <Router>
            <Routes>
              {/* Public & User Routes (Wrapped in MainLayout with Sidebar) */}
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/sports" element={<MainLayout><SportsPage /></MainLayout>} />
              <Route path="/vip-club" element={<MainLayout><VIPClub /></MainLayout>} />
              <Route path="/promotions" element={<MainLayout><Promotions /></MainLayout>} />
              <Route path="/affiliate" element={<MainLayout><Affiliate /></MainLayout>} />
              <Route path="/help" element={<MainLayout><HelpCenter /></MainLayout>} />

              {/* Games */}
              <Route path="/game/dice" element={<MainLayout><DiceGame /></MainLayout>} />
              <Route path="/game/coinflip" element={<MainLayout><CoinFlip /></MainLayout>} />
              <Route path="/game/mines" element={<MainLayout><MinesGame /></MainLayout>} />
              <Route path="/game/plinko" element={<MainLayout><PlinkoGame /></MainLayout>} />

              <Route path="/game/crash" element={<MainLayout><CrashGame /></MainLayout>} />
              <Route path="/game/blackjack" element={<MainLayout><BlackjackGame /></MainLayout>} />

              {/* Legal */}
              <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
              <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
              <Route path="/responsible-gambling" element={<MainLayout><ResponsibleGambling /></MainLayout>} />

              {/* Community */}
              <Route path="/blog" element={<MainLayout><Blog /></MainLayout>} />
              <Route path="/forum" element={<MainLayout><Forum /></MainLayout>} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout><Dashboard /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <MainLayout><WalletPage /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <MainLayout><Transactions /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/my-bets" element={
                <ProtectedRoute>
                  <MainLayout><MyBets /></MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/recent-bets" element={
                <MainLayout><RecentBets /></MainLayout>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout><Settings /></MainLayout>
                </ProtectedRoute>
              } />

              {/* Admin Routes (Separate Layout - Full Screen) */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UsersManager />} />
                <Route path="withdrawals" element={<WithdrawalsCenter />} />
                <Route path="deposits" element={<Deposits />} />
                <Route path="bets/casino" element={<CasinoBets />} />
                <Route path="bets/sports" element={<SportsBets />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="affiliates" element={<AdminAffiliates />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<GlobalSettings />} />
                <Route path="wallet" element={<WalletSettings />} />
              </Route>

            </Routes>

            {/* Global Modals */}
            <AuthModal />
            <WalletModal />
            <StatisticsModal />
            <ProvablyFairModal />
            <VaultModal />
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="dark"
              duration={2000}
              toastOptions={{
                style: { background: '#1a2c38', border: '1px solid #2f4553', color: 'white' },
                className: 'my-toast-class',
              }}
            />
          </Router>
        </UIProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
