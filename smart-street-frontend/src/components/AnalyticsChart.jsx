import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No analytics data available yet.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10}} 
            stroke="#94a3b8" 
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            tick={{fontSize: 10}} 
            stroke="#94a3b8" 
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#0891b2', fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="profile_views" 
            name="Profile Views"
            stroke="#06b6d4" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorViews)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
