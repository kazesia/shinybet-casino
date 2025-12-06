import { useState, useCallback } from 'react';
import { BrowserProvider, verifyMessage } from 'ethers';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// EIP-4361: Sign-In with Ethereum message format
const createSiweMessage = (address: string, nonce: string, domain: string) => {
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to Shiny.bet Casino

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
};

// Generate a random nonce
const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

export function useEthereumAuth() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [address, setAddress] = useState<string | null>(null);

    const connectAndSign = useCallback(async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            toast.error('Please install MetaMask or another Ethereum wallet');
            return null;
        }

        setIsConnecting(true);

        try {
            // Request account access
            const provider = new BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            const userAddress = accounts[0];
            setAddress(userAddress);

            // Create SIWE message
            const domain = window.location.host;
            const nonce = generateNonce();
            const message = createSiweMessage(userAddress, nonce, domain);

            // Sign the message
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(message);

            // Verify signature client-side (for immediate feedback)
            const recoveredAddress = verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
                throw new Error('Signature verification failed');
            }

            // Call Supabase to authenticate/create user
            const { data, error } = await supabase.functions.invoke('verify-eth-signature', {
                body: {
                    address: userAddress,
                    message,
                    signature,
                    nonce,
                },
            });

            if (error) {
                // Fallback: Direct profile creation if Edge Function not available
                console.warn('Edge function not available, using fallback auth');
                return await fallbackAuth(userAddress, 'eth');
            }

            if (data?.session) {
                await supabase.auth.setSession(data.session);
                toast.success('Successfully signed in with Ethereum!');
                return data.session;
            }

            return null;
        } catch (error: any) {
            console.error('Ethereum auth error:', error);

            if (error.code === 4001) {
                toast.error('Sign-in cancelled by user');
            } else {
                toast.error(error.message || 'Failed to sign in with Ethereum');
            }
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
    }, []);

    return {
        address,
        isConnecting,
        connectAndSign,
        disconnect,
    };
}

// Fallback auth when Edge Function is not available
async function fallbackAuth(walletAddress: string, walletType: 'eth' | 'sol') {
    try {
        // Check if user with this wallet exists
        const column = walletType === 'eth' ? 'eth_address' : 'sol_address';
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq(column, walletAddress.toLowerCase())
            .single();

        if (existingProfile?.email) {
            // User exists, but we can't log them in without Edge Function
            toast.error('Please enable Supabase Edge Functions for wallet sign-in');
            return null;
        }

        // For new users, we need Edge Function to create auth user
        toast.error('Wallet sign-in requires Supabase Edge Functions. Please set up the verify-eth-signature function.');
        return null;
    } catch (error) {
        console.error('Fallback auth error:', error);
        return null;
    }
}

// Extend Window interface for ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}
