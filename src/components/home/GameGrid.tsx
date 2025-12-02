import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Dices, Coins, TrendingUp, Bomb, Disc, Cherry } from 'lucide-react';
import { Link } from 'react-router-dom';

const GAMES = [
  {
    id: 'dice',
    title: 'Dice',
    description: 'Classic crypto dice with adjustable odds.',
    icon: Dices,
    color: 'text-blue-400',
    tag: 'Popular',
    link: '/game/dice'
  },
  {
    id: 'coinflip',
    title: 'Coin Flip',
    description: 'Heads or Tails? Double your money.',
    icon: Coins,
    color: 'text-yellow-400',
    tag: 'Fast',
    link: '/game/coinflip'
  },
  {
    id: 'limbo',
    title: 'Limbo',
    description: 'How high can you go? Multipliers up to 1000x.',
    icon: TrendingUp,
    color: 'text-green-400',
    tag: 'High Risk',
    link: '/game/limbo'
  },
  {
    id: 'mines',
    title: 'Mines',
    description: 'Avoid the mines and collect the gems.',
    icon: Bomb,
    color: 'text-red-400',
    tag: 'Strategy',
    link: '/game/mines'
  },
  {
    id: 'wheel',
    title: 'Lucky Wheel',
    description: 'Spin the wheel for massive prizes.',
    icon: Disc,
    color: 'text-purple-400',
    tag: 'New',
    link: '/game/wheel'
  },
  {
    id: 'slots',
    title: 'Slots',
    description: 'Premium slots from top providers.',
    icon: Cherry,
    color: 'text-pink-400',
    tag: 'Hot',
    link: '/game/slots'
  }
];

const GameGrid = () => {
  return (
    <section className="py-16 container">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold mb-2">Popular Games</h2>
            <p className="text-brand-textSecondary">Our players' favorite ways to win.</p>
        </div>
        <Button variant="link" className="text-gold-gradient">View All Games &rarr;</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <Link to={game.link} key={game.id} className="block">
            <Card className="group relative overflow-hidden border-white/5 bg-brand-surface hover:border-[#F7D979]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-[#F7D979]/10 h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 ${game.color}`}>
                    <game.icon className="w-8 h-8" />
                  </div>
                  <Badge variant="secondary" className="bg-white/5 text-brand-textSecondary border-0">
                    {game.tag}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-gold-gradient transition-colors">{game.title}</h3>
                <p className="text-sm text-brand-textSecondary mb-6">{game.description}</p>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">RTP 99%</span>
                  <Button size="sm" className="bg-gold-gradient text-black font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <Play className="w-3 h-3 mr-1" /> Play
                  </Button>
                </div>
                
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GameGrid;
