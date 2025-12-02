import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const POSTS = [
  {
    title: "Top 5 Strategies for Dice",
    excerpt: "Learn how to manage your bankroll and optimize your odds in our most popular game.",
    date: "Mar 1, 2025",
    category: "Strategy"
  },
  {
    title: "Shiny.bet 2.0 Update Notes",
    excerpt: "We've overhauled the UI, added new games, and improved withdrawal speeds.",
    date: "Feb 28, 2025",
    category: "News"
  },
  {
    title: "Winner Spotlight: User 'CryptoKing' wins 5 BTC",
    excerpt: "Read the interview with our latest jackpot winner.",
    date: "Feb 25, 2025",
    category: "Community"
  }
];

export default function Blog() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {POSTS.map((post, i) => (
          <Card key={i} className="bg-zinc-900/50 border-white/10 hover:bg-zinc-900/80 transition-colors cursor-pointer">
            <div className="h-48 bg-zinc-800 w-full rounded-t-xl" /> {/* Placeholder Image */}
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline">{post.category}</Badge>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>{post.excerpt}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-[#F7D979] hover:underline">Read More &rarr;</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
