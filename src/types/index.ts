export interface Profile {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin' | 'super_admin';
  banned: boolean;
  created_at: string;
  last_sign_in_at?: string;
  wallet_balance?: number; // Joined field
  wallets?: Array<{ credits: number }>;
  referral_id?: string;
  referred_by_user_id?: string;
  date_of_birth?: string;
  phone?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  credits: number;
  version: number;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  game_type: string;
  stake_credits: number;
  payout_credits: number;
  result: 'win' | 'loss' | 'pending';
  created_at: string;
  provably_fair?: any;
  profiles?: {
    username: string;
  };
  raw_data?: any;
}

export interface SportsBet {
  id: string;
  user_id: string;
  event_id: string;
  sport_key?: string;
  market_type?: string;
  selection_name: string;
  odds: number;
  stake: number;
  stake_credits?: number;
  potential_payout: number;
  potential_payout_credits?: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  settled_at?: string;
  created_at: string;
  profiles?: { username: string };
  sports_events?: SportsEvent;
}

export interface SportsEvent {
  id: string;
  external_id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  home_score?: number;
  away_score?: number;
  scores?: any;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout' | 'refund';
  amount_credits: number;
  meta?: any;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount_credits: number;
  amount_crypto?: number;
  currency: string;
  target_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  tx_hash?: string;
  rejection_reason?: string;
  admin_id?: string;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    username: string;
  };
}

export interface Deposit {
  id: string;
  user_id: string;
  amount_crypto: number;
  amount_credits: number;
  currency: string;
  address?: string;
  tx_hash?: string;
  confirmations?: number;
  status: 'pending' | 'confirmed' | 'credited';
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface AppSetting {
  key: string;
  value: any;
  description?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AdminStats {
  total_users: number;
  active_users_24h: number;
  total_deposits: number;
  total_withdrawals: number;
  total_wagered: number;
  house_edge_profit: number;
  net_profit: number;
}

export interface UserStats {
  total_wagered?: number;
  total_payout?: number;
  net_profit?: number;
  biggest_win?: number;
  total_deposits?: number;
  total_withdrawals?: number;
  casino_wagered?: number;
  sports_wagered?: number;
}

