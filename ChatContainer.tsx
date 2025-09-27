import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType, chatAgent } from '@/lib/chat-agent';
import { financialProcessor } from '@/lib/financial-data';
import { Loader2 } from 'lucide-react';

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      await financialProcessor.loadData();
      setIsDataLoaded(true);
      
      // Add executive welcome message
      const welcomeMessage: ChatMessageType = {
        id: '1',
        type: 'assistant',
        content: `Welcome to CFO Executive Analytics & Strategic Advisory Platform

I am your AI-powered business intelligence advisor, designed specifically for executive-level financial analysis and strategic decision-making.

Financial Intelligence Capabilities:
• Revenue performance analysis with budget variance insights
• Gross margin optimization and profitability trend analysis
• Operating expense management and cost efficiency evaluation
• EBITDA performance monitoring and cash runway analysis
• Capital allocation and liquidity management assessment

Strategic Business Advisory:
• Growth strategy development and market expansion planning
• Risk assessment and mitigation framework design
• Operational efficiency and process optimization guidance
• Competitive positioning and market analysis
• Investment decision support and resource allocation

Executive Decision Support:
• Board-ready financial reporting and analysis
• Scenario planning and financial modeling
• Strategic roadmap development and execution planning
• Performance benchmarking and KPI optimization

I provide comprehensive analysis with interactive visualizations to support data-driven executive decision-making. Ask me anything about your company's financial performance, strategic opportunities, or business challenges.`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!isDataLoaded) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatAgent.processQuery(content);
      
      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        chartData: response.chartData,
        chartType: response.chartType,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">Loading financial data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              index={index}
            />
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-6 mb-8"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass-card border border-border/40 flex items-center justify-center bg-gradient-card">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
              <div className="flex-1 max-w-4xl">
                <div className="p-6 rounded-3xl glass-card border border-border/30 bg-gradient-card mr-16 shadow-card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-mesh opacity-20"></div>
                  <div className="relative z-10 flex items-center gap-3 text-foreground-muted">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-base font-medium">Processing executive analysis...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}