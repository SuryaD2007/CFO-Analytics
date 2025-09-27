import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      className="bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -360, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 1.2, type: "spring", stiffness: 100 }}
              whileHover={{ rotate: 180, scale: 1.1 }}
              className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow animate-float"
            >
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent"
              >
                CFO Analytics
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm text-foreground-muted"
              >
                AI-Powered Financial Intelligence
              </motion.p>
            </div>
          </div>

          {/* Status Indicators */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-foreground-muted">Data Live</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-foreground-muted">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Real-time Analytics</span>
              </div>
              
              <div className="flex items-center gap-2 text-foreground-muted">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">USD Currency</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}