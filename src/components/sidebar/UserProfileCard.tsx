import { useAuth } from '@/context/AuthContext';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserProfileCard() {
    const { profile, user } = useAuth();

    if (!user) return null;

    return (
        <div className="bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border-2 border-[#2f4553] rounded-xl p-4 mb-4 relative overflow-hidden shadow-xl">
            {/* Animated Top Border */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#F7D979] to-transparent opacity-75" />

            {/* Subtle Glow */}
            <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-20 bg-[#F7D979]/20" />

            {/* User Info */}
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7D979] to-[#D9A94F] flex items-center justify-center text-black font-bold text-lg shadow-lg">
                        {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm leading-none mb-1">
                            {profile?.username || user.email?.split('@')[0] || 'User'}
                        </h3>
                        <div className="text-xs font-semibold flex items-center gap-1 text-[#b1bad3]">
                            Member
                        </div>
                    </div>
                </div>
                <Link to="/vip-club">
                    <Star className="w-5 h-5 text-[#F7D979] hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" />
                </Link>
            </div>
        </div>
    );
}
