import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What was June 2025 revenue vs budget?",
    "Show me gross margin trends for the last 3 months",
    "What are our biggest business risks right now?",
    "How can we improve our cash runway?",
    "What growth strategies should we consider?",
    "Analyze our profitability trends",
    "What's our path to market leadership?"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
      className="border-t border-border/40 bg-background/98 backdrop-blur-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-mesh opacity-5"></div>
      
      {/* Premium Suggested Questions */}
      {message === '' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
          className="p-6 border-b border-border/20 relative z-10"
        >
          <p className="text-base text-foreground-muted mb-4 font-medium">Executive Analytics Queries:</p>
          <div className="flex flex-wrap gap-3">
            {suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                onClick={() => setMessage(question)}
                className="px-4 py-3 text-sm bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all duration-300 border border-border/30 hover:border-primary/40 glass-card backdrop-blur-sm font-medium"
              >
                {question}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Premium Input Area */}
      <div className="p-6 relative z-10">
        <motion.div 
          className="flex gap-4 items-end chat-input"
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
        >
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about financial performance, strategic initiatives, market opportunities, or any business-critical analysis..."
              className="min-h-[72px] resize-none bg-background-secondary/70 border-border/40 focus:border-primary/50 rounded-2xl text-foreground placeholder:text-foreground-muted/70 text-base p-4 font-medium backdrop-blur-sm transition-all duration-300 focus:shadow-glow focus:bg-background-secondary/90"
              disabled={isLoading}
            />
          </div>
          <motion.div 
            className="h-[72px] px-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
          >
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="h-full w-full bg-gradient-primary hover:bg-gradient-primary transition-all duration-400 shadow-success rounded-2xl premium-button border border-primary/20 font-semibold text-base"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}