import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/chat-agent';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { GrossMarginChart } from '@/components/charts/GrossMarginChart';
import { OpexChart } from '@/components/charts/OpexChart';
import { EbitdaChart } from '@/components/charts/EbitdaChart';
import { CashChart } from '@/components/charts/CashChart';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.type === 'user';
  
  const renderChart = () => {
    if (!message.chartData || !message.chartType) return null;
    
    switch (message.chartType) {
      case 'revenue':
        return <RevenueChart data={message.chartData} />;
      case 'grossMargin':
        return <GrossMarginChart data={message.chartData} />;
      case 'opex':
        return <OpexChart data={message.chartData} />;
      case 'ebitda':
        return <EbitdaChart data={message.chartData} />;
      case 'cash':
        return <CashChart data={message.chartData} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 30 : -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08, 
        duration: 0.7,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={`flex gap-6 mb-8 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Premium Avatar */}
      <motion.div 
        className={`
          flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden
          ${isUser 
            ? 'bg-gradient-primary shadow-glow border border-primary/20' 
            : 'glass-card border border-border/40 bg-gradient-card'
          }
        `}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      >
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        {isUser ? (
          <User className="w-6 h-6 text-primary-foreground relative z-10" />
        ) : (
          <Bot className="w-6 h-6 text-primary relative z-10" />
        )}
      </motion.div>

      {/* Premium Message Content */}
      <div className={`
        flex-1 max-w-4xl
        ${isUser ? 'text-right' : 'text-left'}
      `}>
        <motion.div 
          className={`
            p-6 rounded-3xl glass-card border border-border/30 relative overflow-hidden
            ${isUser 
              ? 'bg-gradient-primary text-primary-foreground ml-16 shadow-success' 
              : 'bg-gradient-card mr-16 shadow-card'
            }
          `}
          whileHover={{ scale: 1.005, y: -2 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-20"></div>
          <div className="relative z-10">
            <div 
              className={`text-base leading-relaxed font-medium ${
                isUser ? 'text-primary-foreground' : 'text-foreground'
              }`}
              style={{ 
                whiteSpace: 'pre-wrap',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.01em'
              }}
            >
              {message.content}
            </div>
          </div>
          
          {/* Premium Chart Container */}
          {renderChart() && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              transition={{ 
                delay: 0.6, 
                duration: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              className="mt-8 p-6 bg-background-secondary/50 rounded-2xl border border-border/20 glass-card backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
              <div className="relative z-10">
                {renderChart()}
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Executive Timestamp */}
        <div className={`
          text-sm text-foreground-muted mt-3 px-6 font-medium
          ${isUser ? 'text-right' : 'text-left'}
        `}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </div>
    </motion.div>
  );
}