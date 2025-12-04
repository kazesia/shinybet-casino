# Shiny.bet - Premium Crypto Casino Platform

A modern, full-featured crypto casino platform built with React, TypeScript, Vite, and Supabase.

## 🎮 Features

- **Multiple Casino Games**: Dice, Mines, Plinko, Blackjack, Crash, Coin Flip, Roulette, and Limbo
- **Real-time Betting**: Live bet feed with WebSocket integration
- **VIP System**: Progressive VIP tiers with rewards
- **Wallet Management**: Deposit, withdraw, and vault system
- **Admin Dashboard**: Comprehensive admin panel for managing users, bets, and transactions
- **Responsive Design**: Mobile-first, fully responsive UI
- **Sound Effects**: Immersive audio feedback
- **Multi-language Support**: i18n integration

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: TanStack Query
- **UI Components**: Radix UI, shadcn/ui
- **Forms**: React Hook Form + Zod validation

## 📦 Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## 🌐 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Deployment

This project is optimized for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 📝 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
