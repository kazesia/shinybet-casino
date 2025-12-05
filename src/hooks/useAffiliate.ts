import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface AffiliateStats {
    totalReferrals: number;
    totalWagered: Record<string, number>;
    lifetimeCommission: Record<string, number>;
    availableCommission: Record<string, number>;
    withdrawnCommission: Record<string, number>;
}

export interface ReferredUser {
    id: string;
    username: string;
    created_at: string;
    first_deposit: number;
    total_deposits: number;
    total_wagered: number;
    vip_level: string;
}

export interface AffiliateCampaign {
    id: string;
    name: string;
    referral_code: string;
    hits: number;
    referred_users: number;
    ftd: number;
    total_deposits: number;
    commission: number;
    created_at: string;
}

export function useAffiliate() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [campaigns, setCampaigns] = useState<AffiliateCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAffiliateData();
        }
    }, [user]);

    const fetchAffiliateData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch affiliate stats
            await Promise.all([
                fetchStats(),
                fetchReferredUsers(),
                fetchCampaigns()
            ]);
        } catch (error) {
            console.error('Error fetching affiliate data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!user) return;

        // Get total referrals
        const { count: totalReferrals } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by_user_id', user.id);

        // Get commission data
        const { data: earnings } = await supabase
            .from('affiliate_earnings')
            .select('currency, amount')
            .eq('user_id', user.id);

        // Get transfer data
        const { data: transfers } = await supabase
            .from('affiliate_commission_transfers')
            .select('currency, amount, status')
            .eq('user_id', user.id);

        // Calculate totals by currency
        const lifetimeCommission: Record<string, number> = {};
        const withdrawnCommission: Record<string, number> = {};
        const availableCommission: Record<string, number> = {};

        earnings?.forEach(e => {
            lifetimeCommission[e.currency] = (lifetimeCommission[e.currency] || 0) + parseFloat(e.amount);
        });

        transfers?.filter(t => t.status === 'completed').forEach(t => {
            withdrawnCommission[t.currency] = (withdrawnCommission[t.currency] || 0) + parseFloat(t.amount);
        });

        Object.keys(lifetimeCommission).forEach(currency => {
            availableCommission[currency] = lifetimeCommission[currency] - (withdrawnCommission[currency] || 0);
        });

        // Get total wagered by referred users
        const { data: wageredData } = await supabase
            .rpc('get_referred_users_wagered', { p_user_id: user.id });

        const totalWagered: Record<string, number> = {};
        wageredData?.forEach(w => {
            totalWagered[w.currency] = parseFloat(w.total_wagered);
        });

        setStats({
            totalReferrals: totalReferrals || 0,
            totalWagered,
            lifetimeCommission,
            availableCommission,
            withdrawnCommission
        });
    };

    const fetchReferredUsers = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select(`
        id,
        username,
        created_at,
        balance
      `)
            .eq('referred_by_user_id', user.id);

        if (data) {
            setReferredUsers(data.map(u => ({
                ...u,
                first_deposit: 0, // TODO: Calculate from transactions
                total_deposits: 0, // TODO: Calculate from transactions
                total_wagered: 0, // TODO: Calculate from bets
                vip_level: 'Bronze' // TODO: Get from VIP calculation
            })));
        }
    };

    const fetchCampaigns = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('affiliate_campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setCampaigns(data.map(c => ({
                ...c,
                hits: 0, // TODO: Track link clicks
                referred_users: 0, // TODO: Count users with this campaign
                ftd: 0,
                total_deposits: 0,
                commission: 0
            })));
        }
    };

    const getReferralLink = (code?: string) => {
        const referralCode = code || profile?.referral_id;
        if (!referralCode) return '';
        // Use shiny.bet in production, otherwise window.location.origin
        const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://shiny.bet';
        return `${baseUrl}/?r=${referralCode}`;
    };

    const transferToBalance = async (amount: number, currency: string) => {
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .rpc('transfer_commission_to_balance', {
                p_user_id: user.id,
                p_amount: amount,
                p_currency: currency
            });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        // Refresh data
        await fetchAffiliateData();

        return data;
    };

    const createCampaign = async (name: string, commissionRate?: number) => {
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('affiliate_campaigns')
            .insert({
                user_id: user.id,
                name,
                referral_code: `${profile?.username}-${Date.now()}`.toLowerCase(),
                commission_rate: commissionRate || 0.10
            })
            .select()
            .single();

        if (error) throw error;

        await fetchCampaigns();
        return data;
    };

    return {
        stats,
        referredUsers,
        campaigns,
        loading,
        getReferralLink,
        transferToBalance,
        createCampaign,
        refresh: fetchAffiliateData
    };
}
