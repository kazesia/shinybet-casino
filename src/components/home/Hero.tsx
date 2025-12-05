import { Button } from '@/components/ui/button';
import { StarButton } from '@/components/ui/star-button';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { usePlayerCount } from '@/context/PlayerCountContext';
import { Dices, Trophy, ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero = () => {
  const { openAuthModal } = useUI();
  const { user } = useAuth();
  const { totalPlayers } = usePlayerCount();

  // Animation variants - Premium effects
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" as const }
    },
  };

  const scaleInVariants = {
    hidden: { opacity: 0, scale: 0.8, filter: "blur(20px)" },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" as const }
    },
  };

  const slideInLeftVariants = {
    hidden: { opacity: 0, x: -60, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: "easeOut" as const }
    },
  };

  const floatVariants = {
    animate: {
      y: [-8, 8, -8],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
    },
  };

  const pulseGlow = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(255,215,0,0.2)",
        "0 0 40px rgba(255,215,0,0.4)",
        "0 0 20px rgba(255,215,0,0.2)",
      ],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
    },
  };

  return (
    <section className="relative pt-8 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto overflow-hidden">

      {/* Aura-style Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Main cyan/blue glow orb - animated */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d4ff]/15 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const }}
        />
        {/* Secondary blue glow - top right */}
        <motion.div
          className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#1475e1]/20 rounded-full blur-[120px]"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
        />
        {/* Accent gold glow - left */}
        <motion.div
          className="absolute top-1/4 -left-20 w-[300px] h-[300px] bg-[#ffd700]/10 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay: 2 }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#0f212e]/80" />
      </div>

      <motion.div
        className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Left Content */}
        <motion.div className="lg:col-span-5 space-y-6" variants={itemVariants}>

          {/* Featured Badge */}
          <motion.div
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ffd700]/20 via-[#ffd700]/10 to-[#ffd700]/5 border border-[#ffd700]/40 rounded-full px-5 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,215,0,0.1)]"
            whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,215,0,0.35)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img src="/logo.png" alt="Shiny.bet" className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
            <span className="text-[#ffd700] text-sm font-bold tracking-wide">#1 Crypto Casino 2025</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.1] tracking-tight">
            World's Largest
            <span className="block bg-gradient-to-r from-[#ffd700] via-[#fdb931] to-[#ffd700] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]">
              Crypto Casino
            </span>
          </h1>

          <p className="text-[#b1bad3] text-lg max-w-md">
            Experience the thrill of provably fair gaming with instant crypto payouts and industry-leading rewards.
          </p>


          {user ? (
            <motion.div className="flex flex-wrap gap-3 pt-2" variants={itemVariants}>
              <Link to="/game/dice">
                <Button className="h-14 px-8 bg-gradient-to-r from-[#ffd700] to-[#fdb931] hover:from-[#fdb931] hover:to-[#ffd700] text-[#0f212e] font-black text-lg rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:-translate-y-0.5">
                  Play Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/sports">
                <Button variant="outline" className="h-14 px-8 border-[#2f4553] bg-[#1a2c38]/80 hover:bg-[#213743] hover:border-white/20 text-white font-bold text-lg rounded-xl backdrop-blur-sm transition-all">
                  Sportsbook
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div className="flex flex-wrap gap-3 pt-2" variants={itemVariants}>
              <StarButton
                onClick={() => openAuthModal('register')}
                variant="gold"
                className="h-14 px-8 text-lg rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:-translate-y-0.5"
              >
                Get Started Free
              </StarButton>
              <Button
                onClick={() => openAuthModal('login')}
                variant="outline"
                className="h-14 px-8 border-[#2f4553] bg-[#1a2c38]/80 hover:bg-[#213743] hover:border-white/20 text-white font-bold text-lg rounded-xl backdrop-blur-sm transition-all"
              >
                Sign In
              </Button>
            </motion.div>
          )}

          {/* Live Players */}
          <motion.div
            className="flex items-center gap-3 pt-2 pl-1"
            variants={itemVariants}
          >
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2f4553] to-[#1a2c38] border-2 border-[#0f212e] flex items-center justify-center shadow-lg"
                >
                  <Users className="w-5 h-5 text-[#b1bad3]" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#1a2c38]/50 px-3 py-1.5 rounded-full border border-[#2f4553]/50">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e701] animate-pulse shadow-[0_0_10px_#00e701]" />
              <span className="text-[#b1bad3] text-sm font-medium">
                <span className="text-white font-bold">{totalPlayers.toLocaleString()}</span> players online
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - Banners */}
        <motion.div
          className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 h-full"
          variants={itemVariants}
        >
          {/* Casino Banner */}
          <motion.div variants={floatVariants} animate="animate">
            <Link
              to="/casino"
              className="group relative h-[280px] md:h-[340px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-[#ffd700]/10 hover:border-[#ffd700]/30 hover:shadow-[0_20px_60px_-10px_rgba(255,215,0,0.15)] block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <img
                src="/game-assets/banners/casino_banner.png"
                alt="Casino"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
          </motion.div>

          {/* Sports Banner */}
          <motion.div variants={floatVariants} animate="animate" style={{ animationDelay: '1s' }}>
            <Link
              to="/sports"
              className="group relative h-[280px] md:h-[340px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-[#1475e1]/10 hover:border-[#1475e1]/30 hover:shadow-[0_20px_60px_-10px_rgba(20,117,225,0.15)] block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1475e1]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <img
                src="/game-assets/banners/sports_banner.png"
                alt="Sports"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Shiny.bet Logo Section */}
      <motion.div
        className="mt-16 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" as const }}
      >
        <img
          src="/logo.png"
          alt="Shiny.bet"
          className="h-20 md:h-28 lg:h-36 w-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
        />
        <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
          Shiny<span className="text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">.bet</span>
        </h2>
        <p className="mt-4 text-[#b1bad3] text-lg md:text-xl max-w-2xl">
          The world's leading crypto casino platform with provably fair games, instant payouts, and industry-leading rewards.
        </p>
      </motion.div>

    </section>
  );
};

export default Hero;
