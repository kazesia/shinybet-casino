import { RecentBetsList } from '@/components/bets/RecentBetsList';

export default function RecentBets() {
    return (
        <div className="min-h-screen bg-[#0f212e] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Recent Bets</h1>
                        <p className="text-sm text-[#b1bad3] mt-1">Live betting activity across all games</p>
                    </div>
                </div>

                {/* Main Content */}
                <RecentBetsList />
            </div>
        </div>
    );
}
