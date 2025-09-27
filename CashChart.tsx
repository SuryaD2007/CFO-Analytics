import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface CashChartProps {
  data: Array<{
    month: string;
    balance: number;
  }>;
}

export function CashChart({ data }: CashChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const balance = payload[0].value;
      const isLow = balance < 500; // Less than $500K is concerning
      
      return (
        <div className="glass-card p-4 border border-border/50">
          <p className="text-foreground font-medium">{label}</p>
          <p className={`${isLow ? "text-destructive" : "text-success"}`}>
            Cash: ${balance}K
          </p>
          {isLow && (
            <p className="text-xs text-destructive mt-1">⚠️ Low cash warning</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="h-80 w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="lowCashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--foreground-muted))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--foreground-muted))" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--success))"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#cashGradient)"
          />
          {/* Warning line at $500K */}
          <Line
            type="monotone"
            dataKey={() => 500}
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}