import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import { TransactionCard } from '@/components/wallet/TransactionCard';

type TransactionType = 'deposits' | 'withdrawals' | 'bonuses' | 'raffles' | 'races' | 'other';

interface TransactionItem {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  tx_hash?: string;
}

const TABS: { id: TransactionType; label: string }[] = [
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'bonuses', label: 'Bonuses' },
  { id: 'raffles', label: 'Raffles' },
  { id: 'races', label: 'Races' },
  { id: 'other', label: 'Other' },
];

export default function Transactions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TransactionType>('deposits');
  const [data, setData] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isMobile } = useViewport();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, activeTab]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query;

      // Map tabs to database tables/queries
      if (activeTab === 'deposits') {
        const { data: deposits } = await supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        setData(deposits?.map(d => ({
          id: d.id,
          created_at: d.created_at,
          amount: d.amount_credits,
          currency: d.currency,
          status: d.status,
          type: 'Deposit',
          tx_hash: d.tx_hash
        })) || []);
      }
      else if (activeTab === 'withdrawals') {
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        setData(withdrawals?.map(w => ({
          id: w.id,
          created_at: w.created_at,
          amount: w.amount_credits,
          currency: w.currency,
          status: w.status,
          type: 'Withdrawal',
          tx_hash: w.tx_hash // Assuming withdrawals table has tx_hash
        })) || []);
      }
      else {
        // For other tabs, we'll simulate empty or mock data since tables might not exist yet
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#213743] rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-15 1.5h15V6H4.5V4.5zm0 15V7.5h15v12h-15z" />
            <path d="M7.5 10.5h9v1.5h-9v-1.5zm0 4.5h6v1.5h-6V15z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Sidebar Tabs */}
        <div className="md:col-span-3 flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-left px-4 py-3 rounded-md text-sm font-bold transition-colors",
                activeTab === tab.id
                  ? "bg-[#213743] text-white shadow-sm"
                  : "text-[#b1bad3] hover:bg-[#1a2c38] hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="md:col-span-9">
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#b1bad3]" />
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-[#b1bad3] bg-[#1a2c38] rounded-lg border border-[#2f4553]">
                  <div className="flex flex-col items-center gap-2">
                    <span className="opacity-50 text-4xl">📝</span>
                    <span>No transactions found.</span>
                  </div>
                </div>
              ) : (
                data.map((item) => (
                  <TransactionCard key={item.id} item={item} />
                ))
              )}
            </div>
          ) : (
            <Card className="bg-[#1a2c38] border-none shadow-xl overflow-hidden min-h-[600px] flex flex-col">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#b1bad3] bg-[#0f212e] uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">View</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f4553]">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#b1bad3]" />
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#b1bad3]">
                          <div className="flex flex-col items-center gap-2">
                            <span className="opacity-50 text-4xl">📝</span>
                            <span>No transactions found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="hover:bg-[#213743] transition-colors group">
                          <td className="px-6 py-4 text-[#b1bad3] font-medium">
                            {new Date(item.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "capitalize border-0 font-bold",
                              item.status === 'confirmed' || item.status === 'paid' ? "text-green-500 bg-green-500/10" :
                                item.status === 'pending' ? "text-yellow-500 bg-yellow-500/10" :
                                  "text-red-500 bg-red-500/10"
                            )}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-white font-bold cursor-pointer hover:text-[#1475e1] transition-colors">
                              Transaction <ExternalLink className="w-3 h-3" />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-white font-mono font-bold">${item.amount.toFixed(2)}</span>
                              {/* Coin Icon */}
                              <div className="w-5 h-5 rounded-full bg-[#345d9d] flex items-center justify-center text-white text-[10px] font-bold">
                                Ł
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination */}
              <div className="bg-[#0f212e] p-4 flex items-center justify-between border-t border-[#2f4553]">
                <div className="text-xs text-[#b1bad3] font-medium">
                  {data.length} results
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" className="bg-[#213743] border-none text-white hover:bg-[#2f4553] h-9 px-4 font-bold">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" disabled className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button variant="ghost" size="sm" disabled className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
