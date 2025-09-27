import { motion } from 'framer-motion';
import { Header } from './Header';
import { ChatContainer } from '@/components/chat/ChatContainer';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, hsl(var(--success) / 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, hsl(var(--warning) / 0.02) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          <ChatContainer />
        </main>
      </div>
    </div>
  );
}