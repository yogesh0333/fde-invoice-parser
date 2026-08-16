import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategorySpendSummary, ExpenseCategory } from '../types';
import { PieChart as PieIcon, Layers } from 'lucide-react';

interface SpendingAnalyticsProps {
  categories: CategorySpendSummary[];
  totalSpend: number;
  selectedCategory: ExpenseCategory | 'All';
  onSelectCategory: (category: ExpenseCategory | 'All') => void;
}

export const SpendingAnalytics: React.FC<SpendingAnalyticsProps> = ({
  categories,
  totalSpend,
  selectedCategory,
  onSelectCategory,
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  const chartData = categories.map((cat) => ({
    name: cat.category,
    value: cat.amount,
    color: cat.color,
    count: cat.count,
    percentage: cat.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            {data.name}
          </div>
          <div className="mt-1 text-slate-600">
            <span className="font-bold text-slate-900">
              ₹{Math.round(data.value).toLocaleString('en-IN')}
            </span>{' '}
            ({data.percentage.toFixed(1)}%)
          </div>
          <div className="text-slate-400 text-[10px]">
            {data.count} invoice{data.count > 1 ? 's' : ''}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="spending-analytics-card"
      className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-500">
              Distribution across {categories.length} active expense categories
            </p>
          </div>
        </div>
        {selectedCategory !== 'All' && (
          <button
            onClick={() => onSelectCategory('All')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
          >
            Clear category filter
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
        {/* Recharts Donut */}
        <div className="relative h-52 md:col-span-5 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) =>
                  onSelectCategory(
                    selectedCategory === entry.name ? 'All' : (entry.name as ExpenseCategory)
                  )
                }
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={selectedCategory === entry.name ? '#1E293B' : '#FFFFFF'}
                    strokeWidth={selectedCategory === entry.name ? 2.5 : 1.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Donut Label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total
            </span>
            <span className="font-bold text-sm text-slate-900">
              ₹{Math.round(totalSpend / 1000)}k
            </span>
          </div>
        </div>

        {/* Category Breakdown Progress Bars List */}
        <div className="space-y-2.5 md:col-span-7">
          {categories.slice(0, 6).map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <div
                key={cat.category}
                onClick={() =>
                  onSelectCategory(isSelected ? 'All' : cat.category)
                }
                className={`group cursor-pointer rounded-lg p-2 transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 ring-1 ring-indigo-300'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate group-hover:text-indigo-600 transition-colors">
                      {cat.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({cat.count})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      ₹{Math.round(cat.amount).toLocaleString('en-IN')}
                    </span>
                    <span className="w-10 text-right text-[11px] text-slate-500 font-medium">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cat.percentage, 3)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
