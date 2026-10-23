/**
 * Section 9 — the per-category score chart.
 *
 * A horizontal bar per risk category, showing how much of the total risk came
 * from each. Categories with a zero score are still listed so the reader can see
 * that they were considered.
 */

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_COLOR } from '../../engine/types';
import type { Category } from '../../engine/types';

interface CategoryBarProps {
  scores: Readonly<Record<Category, number>>;
}

interface BarDatum {
  category: Category;
  label: string;
  score: number;
  color: string;
}

const TOOLTIP_STYLE = {
  background: 'rgb(255 255 255)',
  border: '1px solid rgb(203 213 225)',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'rgb(15 23 42)',
} as const;

export function CategoryBar({ scores }: CategoryBarProps): JSX.Element {
  const data: BarDatum[] = CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    score: scores[category] ?? 0,
    color: CATEGORY_COLOR[category],
  }));

  return (
    <div className="scamlens-scroll max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, bottom: 8, left: 8 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
            formatter={(value: number) => [`${value} / 100`, 'Score']}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((datum) => (
              <Cell key={datum.category} fill={datum.color} />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              formatter={(value: number) => `${value}`}
              style={{ fontSize: 11, fill: 'rgb(71 85 105)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
