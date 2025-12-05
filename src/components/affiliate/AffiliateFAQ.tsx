import { Card } from '@/components/ui/card';
import { Dice1, TrendingUp, Spade } from 'lucide-react';

export function AffiliateFAQ() {
    return (
        <div className="space-y-6">
            {/* Commission Rules */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Commission Rules</h2>
                <p className="text-[#b1bad3] mb-6">
                    Our default commission rate is 10% but you can calculate specific rates for our products using the formulas below.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Casino */}
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#00e701]/10 rounded-lg">
                                <Dice1 className="w-5 h-5 text-[#00e701]" />
                            </div>
                            <h3 className="text-white font-semibold">Casino</h3>
                        </div>
                        <p className="text-[#b1bad3] text-sm mb-4">
                            All of our games have a different house edge. You can derive your commission using the following formula:
                        </p>
                        <div className="bg-[#0f212e] rounded-lg p-4 font-mono text-xs text-[#00e701]">
                            (Edge as decimal * wagered / 2) * commission_rate
                        </div>
                    </Card>

                    {/* Sportsbook */}
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#1475e1]/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-[#1475e1]" />
                            </div>
                            <h3 className="text-white font-semibold">Sportsbook</h3>
                        </div>
                        <p className="text-[#b1bad3] text-sm mb-4">
                            All sports bets are applied at a 3% theoretical house edge. You can derive your commission using the following formula:
                        </p>
                        <div className="bg-[#0f212e] rounded-lg p-4 font-mono text-xs text-[#1475e1]">
                            (0.03 * wagered / 2) * commission_rate
                        </div>
                    </Card>

                    {/* Poker */}
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#F7D979]/10 rounded-lg">
                                <Spade className="w-5 h-5 text-[#F7D979]" />
                            </div>
                            <h3 className="text-white font-semibold">Poker</h3>
                        </div>
                        <p className="text-[#b1bad3] text-sm mb-4">
                            We collect a small percentage of each pot (known as Rake) as a fee for hosting the game. Your commission is calculated using Rake. You can use the formula below to derive your commission:
                        </p>
                        <div className="bg-[#0f212e] rounded-lg p-4 font-mono text-xs text-[#F7D979]">
                            Rake * commission_rate
                        </div>
                    </Card>
                </div>
            </div>

            {/* FAQ Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>

                <div className="space-y-4">
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <h3 className="text-white font-semibold mb-2">How do I start earning?</h3>
                        <p className="text-[#b1bad3] text-sm">
                            Simply share your unique referral link with friends or your audience. When they sign up and start playing, you'll earn commission on their bets automatically.
                        </p>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <h3 className="text-white font-semibold mb-2">When do I receive my commission?</h3>
                        <p className="text-[#b1bad3] text-sm">
                            Commission is calculated instantly after each bet and appears in your Available Commission balance. You can transfer it to your casino balance anytime.
                        </p>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <h3 className="text-white font-semibold mb-2">Is there a minimum payout?</h3>
                        <p className="text-[#b1bad3] text-sm">
                            Yes, the minimum transfer amount is $10 USD equivalent in any supported cryptocurrency.
                        </p>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <h3 className="text-white font-semibold mb-2">Can I track my referrals' activity?</h3>
                        <p className="text-[#b1bad3] text-sm">
                            Yes! The "Referred Users" tab shows detailed statistics including total deposits, wagered amounts, and VIP status for each of your referrals.
                        </p>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <h3 className="text-white font-semibold mb-2">How long does the commission last?</h3>
                        <p className="text-[#b1bad3] text-sm">
                            Forever! You earn lifetime commission on all bets placed by your referrals, as long as they continue playing.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
