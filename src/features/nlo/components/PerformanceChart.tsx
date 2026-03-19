import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { mockPerformanceData } from "../mock-data";

const PerformanceChart = () => {
  return (
    <div className="w-full bg-dark-card border border-dark-border rounded-2xl p-3 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockPerformanceData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2F80FF" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#2F80FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2A2F39" strokeDasharray="3 6" vertical={true} horizontal={false} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6E7584", fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6E7584", fontSize: 10 }}
            tickFormatter={(v) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1E27",
              border: "1px solid #2A2F39",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Value"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2F80FF"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
