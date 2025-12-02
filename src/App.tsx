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

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import AdminLayout from '@/components/admin/AdminLayout';

// Public Pages
import Hero from './components/home/Hero';
import GameGrid from './components/home/GameGrid';
import DiceGame from './pages/DiceGame';
import CoinFlip from './pages/CoinFlip';
import MinesGame from './pages/MinesGame';
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

// User Pages
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManager from './pages/admin/UsersManager';
import WithdrawalsCenter from './pages/admin/WithdrawalsCenter';
import ActivityLogs from './pages/admin/ActivityLogs';
import GlobalSettings from './pages/admin/GlobalSettings';

// Home Page Component
const Home = () => (
  <main>
    <Hero />
    <GameGrid />
  </main>
);

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <UIProvider>
          <Router>
            <Routes>
              {/* Public & User Routes (Wrapped in MainLayout with Sidebar) */}
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/sports" element={<MainLayout><SportsPage /></MainLayout>} />
              <Route path="/vip-club" element={<MainLayout><VIPClub /></MainLayout>} />
              <Route path="/promotions" element={<MainLayout><Promotions /></MainLayout>} />
              <Route path="/affiliate" element={<MainLayout><Affiliate /></MainLayout>} />
              <Route path="/help" element={<MainLayout><HelpCenter /></MainLayout>} />
              
              {/* Games */}
              <Route path="/game/dice" element={<MainLayout><DiceGame /></MainLayout>} />
              <Route path="/game/coinflip" element={<MainLayout><CoinFlip /></MainLayout>} />
              <Route path="/game/mines" element={<MainLayout><MinesGame /></MainLayout>} />
              
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

              {/* Admin Routes (Separate Layout - Full Screen) */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersManager />} />
                <Route path="withdrawals" element={<WithdrawalsCenter />} />
                <Route path="activity" element={<ActivityLogs />} />
                <Route path="settings" element={<GlobalSettings />} />
              </Route>

            </Routes>
            
            {/* Global Modals */}
            <AuthModal />
            <WalletModal />
            <Toaster position="top-right" theme="dark" />
          </Router>
        </UIProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
