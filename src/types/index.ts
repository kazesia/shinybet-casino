export interface Profile {
  id: string;
  username: string;
  email?: string; // Added for admin view
  role: 'user' | 'admin' | 'super_admin';
  banned: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  credits: number;
  version: number;
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
  raw_data?: any; // For expandable view
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
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
}
