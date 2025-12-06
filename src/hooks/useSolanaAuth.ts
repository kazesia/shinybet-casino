import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import bs58 from 'bs58';

// SIWS (Sign-In with Solana) message format
const createSiwsMessage = (address: string, nonce: string, domain: string) => {
    const issuedAt = new Date().toISOString();

    return `${domain} wants you to sign in with your Solana account:
${address}

Sign in to Shiny.bet Casino

URI: https://${domain}
Version: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
};

// Generate a random nonce
const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

export function useSolanaAuth() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [address, setAddress] = useState<string | null>(null);

    const getPhantomProvider = () => {
        if (typeof window === 'undefined') return null;

        // Check for Phantom
        if ('phantom' in window) {
            const provider = (window as any).phantom?.solana;
            if (provider?.isPhantom) {
                return provider;
            }
        }

        // Check for Solflare
        if ('solflare' in window) {
            return (window as any).solflare;
        }

        // Check for generic Solana provider
        if ('solana' in window) {
            return (window as any).solana;
        }

        return null;
    };

    const connectAndSign = useCallback(async () => {
        const provider = getPhantomProvider();

        if (!provider) {
            toast.error('Please install Phantom or Solflare wallet');
            window.open('https://phantom.app/', '_blank');
            return null;
        }

        setIsConnecting(true);

        try {
            // Connect to wallet
            const response = await provider.connect();
            const publicKey = response.publicKey.toString();
            setAddress(publicKey);

            // Create SIWS message
            const domain = window.location.host;
            const nonce = generateNonce();
            const message = createSiwsMessage(publicKey, nonce, domain);

            // Encode message to Uint8Array
            const encodedMessage = new TextEncoder().encode(message);

            // Sign the message
            const signedMessage = await provider.signMessage(encodedMessage, 'utf8');

            // Convert signature to base58
            const signature = bs58.encode(signedMessage.signature);

            // Call Supabase to authenticate/create user
            const { data, error } = await supabase.functions.invoke('verify-sol-signature', {
                body: {
                    address: publicKey,
                    message,
                    signature,
                    nonce,
                },
            });

            if (error) {
                // Fallback message if Edge Function not available
                console.warn('Edge function not available, using fallback auth');
                return await fallbackAuth(publicKey, 'sol');
            }

            if (data?.session) {
                await supabase.auth.setSession(data.session);
                toast.success('Successfully signed in with Solana!');
                return data.session;
            }

            return null;
        } catch (error: any) {
            console.error('Solana auth error:', error);

            if (error.code === 4001 || error.message?.includes('User rejected')) {
                toast.error('Sign-in cancelled by user');
            } else {
                toast.error(error.message || 'Failed to sign in with Solana');
            }
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        const provider = getPhantomProvider();
        if (provider) {
            try {
                await provider.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
        }
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
            .eq(column, walletAddress)
            .single();

        if (existingProfile?.email) {
            toast.error('Please enable Supabase Edge Functions for wallet sign-in');
            return null;
        }

        toast.error('Wallet sign-in requires Supabase Edge Functions. Please set up the verify-sol-signature function.');
        return null;
    } catch (error) {
        console.error('Fallback auth error:', error);
        return null;
    }
}
