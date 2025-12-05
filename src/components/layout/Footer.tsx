import { Link } from 'react-router-dom';
import { Twitter, MessageCircle, Crown, Shield, Zap, Globe, Clock, Lock } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    games: [
      { label: 'Dice', href: '/game/dice' },
      { label: 'Blackjack', href: '/game/blackjack' },
      { label: 'Crash', href: '/game/crash' },
      { label: 'Mines', href: '/game/mines' },
      { label: 'Plinko', href: '/game/plinko' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Live Support', href: '/help' },
      { label: 'Fairness', href: '/provably-fair' },
      { label: 'Contact Us', href: '/help' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Responsible Gaming', href: '/legal/responsible' },
      { label: 'AML Policy', href: '/legal/aml' },
    ],
    social: [
      { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
      { label: 'Discord', icon: MessageCircle, href: 'https://discord.com' },
      { label: 'Telegram', icon: MessageCircle, href: 'https://telegram.org' },
    ],
  };

  return (
    <footer className="relative bg-[#0a1a24] border-t border-[#1a2c38] pt-16 pb-24 md:pb-8 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#1475e1]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative container max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Shiny.bet Logo" className="h-8 w-auto" />
              <span className="text-xl font-black italic tracking-tight text-white">
                SHINY<span className="text-[#FFD700]">.BET</span>
              </span>
            </Link>
            <p className="text-sm text-[#557086] leading-relaxed mb-6 max-w-[220px]">
              The world's most trusted crypto casino. Provably fair, instant payouts.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              {footerLinks.social.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1a2c38] hover:bg-[#213743] flex items-center justify-center text-[#b1bad3] hover:text-white transition-all hover:-translate-y-0.5"
                >
                  <item.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Games */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Games</h4>
            <ul className="space-y-2">
              {footerLinks.games.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#557086] hover:text-[#ffd700] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#557086] hover:text-[#ffd700] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#557086] hover:text-[#ffd700] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Crypto Logos */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-8 border-t border-[#1a2c38]">
          {['BTC', 'ETH', 'LTC', 'USDT', 'DOGE', 'TRX'].map((crypto) => (
            <div
              key={crypto}
              className="flex items-center gap-1.5 text-[#557086] text-xs font-medium bg-[#1a2c38]/50 px-3 py-1.5 rounded-full"
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#ffd700]/20 to-[#fdb931]/10" />
              {crypto}
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1a2c38] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#557086]">
            <Globe className="w-4 h-4" />
            <span>© {currentYear} ShinyBet. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-[#ed4245]/20 text-[#ed4245] px-2 py-1 rounded font-bold">18+</span>
            <span className="text-xs text-[#557086]">Play responsibly</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
