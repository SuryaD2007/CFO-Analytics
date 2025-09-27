import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface OpexChartProps {
  data: Array<{
    category: string;
    amount: number;
  }>;
}

const COLORS = [
  'hsl(var(--warning))',
  'hsl(var(--destructive))', 
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--accent))'
];

export function OpexChart({ data }: OpexChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 border border-border/50">
          <p className="text-foreground font-medium">{data.category}</p>
          <p className="text-warning">
            Amount: ${data.amount}K
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground-muted">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      className="h-80 w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="amount"
            label={({ category, amount, percent }: any) => 
              `${category}: $${amount}K (${((percent || 0) * 100).toFixed(1)}%)`
            }
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}