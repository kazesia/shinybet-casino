import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  CheckCircle2,
  HelpCircle,
  Zap,
  Users,
  TrendingUp,
  Gift,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TIERS = [
  {
    name: 'Bronze',
    minWager: 10000,
    color: '#cd7f32',
    icon: '🛡️',
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses'
    ]
  },
  {
    name: 'Silver',
    minWager: 50000,
    color: '#c0c0c0',
    icon: '⭐',
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth'
    ]
  },
  {
    name: 'Gold',
    minWager: 100000,
    color: '#ffd700',
    icon: '⭐',
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth'
    ]
  },
  {
    name: 'Platinum I-III',
    minWager: 250000,
    color: '#22d3ee',
    icon: '⭐',
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth',
      'Daily bonuses / Reload'
    ]
  },
];

const BENEFITS = [
  {
    title: 'Boost',
    description: 'Every week and every month, expect a fresh bonus based on your recent games. The more you play, the higher the bonuses.',
    icon: '🔶',
  },
  {
    title: 'Dedicated VIP Host',
    description: 'Receive your own dedicated VIP host who will support and cater to your betting needs.',
    icon: '🎀',
  },
  {
    title: 'Recent Play Bonuses',
    description: 'Having a rough streak of luck? Shiny offers money back on losses every time you level up.',
    icon: '🏠',
  },
  {
    title: 'Level-Ups',
    description: 'Reach a new level and get paid. The level-ups get better the higher you go.',
    icon: '🔶',
  },
  {
    title: 'Bespoke benefits',
    description: 'Work with your dedicated VIP host to tailor benefits to your gaming needs.',
    icon: '⚙️',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Why is Shiny\'s VIP program the best?',
    answer: 'Shiny offers the most comprehensive VIP program in the industry with personalized rewards, dedicated hosts, and exclusive benefits tailored to your gaming style.'
  },
  {
    question: 'How much has Shiny given out in bonuses?',
    answer: 'Shiny has distributed millions in bonuses to our VIP members, with amounts increasing as you climb the VIP tiers.'
  },
  {
    question: 'How do I enter the $75,000 weekly raffle?',
    answer: 'VIP members are automatically entered into our weekly raffle based on their activity and tier level.'
  },
  {
    question: 'Where can I find the Shiny Telegram Channel?',
    answer: 'Join our official Telegram channel for updates, exclusive offers, and community engagement.'
  },
  {
    question: 'Where can I find the Shiny VIP Telegram channel?',
    answer: 'VIP members receive an exclusive invitation to our VIP-only Telegram channel with their VIP host.'
  },
];

export default function VIPClub() {
  const { user } = useAuth();
  const { data: dashboardData } = useDashboardData();

  const totalWagered = dashboardData?.totalWagered || 0;

  // Find current tier
  const currentTierIndex = TIERS.findIndex((tier, index) => {
    const nextTier = TIERS[index + 1];
    return totalWagered >= tier.minWager && (!nextTier || totalWagered < nextTier.minWager);
  });

  const currentTier = currentTierIndex >= 0 ? TIERS[currentTierIndex] : TIERS[0];
  const nextTier = TIERS[currentTierIndex + 1];
  const progressToNext = nextTier
    ? ((totalWagered - currentTier.minWager) / (nextTier.minWager - currentTier.minWager)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-[#1a2c38] text-white">
      {/* Hero Section with User Progress */}
      <div className="relative bg-gradient-to-br from-[#213743] via-[#1a2c38] to-[#0f212e] pt-8 pb-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Large Star Graphic */}
          <div className="absolute right-0 top-0 w-64 h-64 opacity-20">
            <div className="relative w-full h-full">
              <Star className="w-full h-full text-orange-400 fill-orange-400" />
              <Star className="absolute inset-0 w-3/4 h-3/4 m-auto text-orange-500 fill-none stroke-2" />
            </div>
          </div>

          {/* User Progress Card */}
          {user && (
            <Card className="bg-[#0f212e]/80 backdrop-blur border-[#ffd700]/30 max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white text-lg font-semibold">
                    {user.email?.split('@')[0] || 'User'}
                  </div>
                  <Star className="w-5 h-5 text-[#ffd700]" />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-[#b1bad3]">
                    <span>Your VIP Progress</span>
                    <button className="hover:text-white transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-white">{progressToNext.toFixed(1)}%</span>
                </div>

                <div className="mb-3">
                  <div className="h-2 bg-[#1a2c38] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: currentTier.color }} />
                    <span className="text-[#b1bad3]">{currentTier.name}</span>
                  </div>
                  {nextTier && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" style={{ color: nextTier.color }} />
                      <span className="text-[#b1bad3]">{nextTier.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* VIP Ranking System */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Shiny VIP ranking system</h2>

        {/* Tier Icons Row */}
        <div className="flex justify-center items-center gap-16 mb-12">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
          <Star className="w-8 h-8 text-gray-400" />
          <Star className="w-8 h-8 text-orange-400" />
          <Star className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier, index) => {
            const isUnlocked = totalWagered >= tier.minWager;
            const isCurrent = index === currentTierIndex;

            return (
              <Card
                key={tier.name}
                className={cn(
                  "bg-[#0f212e] border-2 transition-all hover:border-opacity-50",
                  isCurrent ? "border-[#ffd700]" : "border-[#2f4553]"
                )}
              >
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Badge
                      className="px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: `${tier.color}20`,
                        color: tier.color,
                        border: `1px solid ${tier.color}40`
                      }}
                    >
                      {tier.name}
                    </Badge>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-white mb-1">
                      ${(tier.minWager / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-[#b1bad3]">Wager amount</div>
                  </div>

                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#b1bad3]">
                        <CheckCircle2
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: tier.color }}
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Shiny VIP Club benefits</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title} className="bg-[#0f212e] border-[#2f4553]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1a2c38] flex items-center justify-center text-2xl flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-[#b1bad3] leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">Frequently Asked Questions</h2>
        <p className="text-center text-[#b1bad3] mb-12">Reach out to our award winning support team</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#0f212e] border-[#2f4553]">
              <CardContent className="p-2">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-[#1a2c38] text-white border-l-2 border-[#1475e1] text-sm font-medium">
                  General
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg text-[#b1bad3] hover:bg-[#1a2c38] text-sm font-medium transition-colors">
                  Benefits
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg text-[#b1bad3] hover:bg-[#1a2c38] text-sm font-medium transition-colors">
                  VIP Hosts
                </button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Accordion */}
          <div className="lg:col-span-3">
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-[#0f212e] border border-[#2f4553] rounded-lg px-6 data-[state=open]:border-[#1475e1]"
                >
                  <AccordionTrigger className="text-left hover:no-underline text-white py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#b1bad3] pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Live Support Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-[#0f212e] border-[#2f4553]">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Live, 24-hour customer support</h3>
            <p className="text-[#b1bad3] mb-6">Our support team is available around the clock to assist you</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
