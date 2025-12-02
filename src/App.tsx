import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Hero from './components/home/Hero';
import GameGrid from './components/home/GameGrid';
import DiceGame from './pages/DiceGame';
import CoinFlip from './pages/CoinFlip';
import AuthPage from './pages/Auth';

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

// Wrapper for public/user layout to include Navbar/Footer
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#F7D979] selection:text-black">
    <Navbar />
    {children}
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <Routes>
            {/* Public & User Routes (With Navbar/Footer) */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/auth" element={<MainLayout><AuthPage /></MainLayout>} />
            <Route path="/game/dice" element={<MainLayout><DiceGame /></MainLayout>} />
            <Route path="/game/coinflip" element={<MainLayout><CoinFlip /></MainLayout>} />
            
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

            {/* Admin Routes (Separate Layout) */}
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
          <Toaster position="top-right" theme="dark" />
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
