export interface Profile {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin' | 'super_admin';
  banned: boolean;
  created_at: string;
  last_sign_in_at?: string;
  wallet_balance?: number; // Joined field
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
  result: 'win' | 'loss';
  created_at: string;
  profiles?: {
    username: string;
  };
  raw_data?: any;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout';
  amount_credits: number;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount_credits: number;
  currency: string;
  target_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  tx_hash?: string;
  rejection_reason?: string;
  created_at: string;
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
  status: 'pending' | 'confirmed';
  tx_hash?: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
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
