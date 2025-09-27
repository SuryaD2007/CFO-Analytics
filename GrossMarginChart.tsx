import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface GrossMarginChartProps {
  data: Array<{
    month: string;
    percentage: number;
  }>;
}

export function GrossMarginChart({ data }: GrossMarginChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 border border-border/50">
          <p className="text-foreground font-medium">{label}</p>
          <p className="text-success">
            Gross Margin: {payload[0].value}%
          </p>
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
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke="hsl(var(--success))"
            strokeWidth={3}
            dot={{ 
              fill: 'hsl(var(--success))', 
              strokeWidth: 2, 
              stroke: 'hsl(var(--background))',
              r: 6
            }}
            activeDot={{ 
              r: 8, 
              fill: 'hsl(var(--success))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}