import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface RevenueChartProps {
  data: Array<{
    month: string;
    actual: number;
    budget: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 border border-border/50">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'actual' ? 'Actual' : 'Budget'}: ${entry.value}K
            </p>
          ))}
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
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          <Legend 
            wrapperStyle={{ 
              color: 'hsl(var(--foreground-muted))',
              fontSize: '12px',
              paddingTop: '20px'
            }}
          />
          <Bar 
            dataKey="actual" 
            name="Actual Revenue"
            fill="hsl(var(--success))"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="budget" 
            name="Budget"
            fill="hsl(var(--warning))"
            radius={[4, 4, 0, 0]}
            opacity={0.7}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}