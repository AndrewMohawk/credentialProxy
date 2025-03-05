import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Jan', total: 1800 },
  { name: 'Feb', total: 2100 },
  { name: 'Mar', total: 2200 },
  { name: 'Apr', total: 2400 },
  { name: 'May', total: 2800 },
  { name: 'Jun', total: 3600 },
];

export function Overview() {
  return (
    <div className="rounded-lg border border-border bg-card dark:bg-gray-800/80 p-6">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground dark:text-gray-200">Request Overview</h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400">Credential requests per month</p>
      </div>
      <div className="mt-3 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="currentColor"
              className="text-muted-foreground dark:text-gray-400"
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="currentColor"
              className="text-muted-foreground dark:text-gray-400"
              width={40}
            />
            <Bar
              dataKey="total"
              fill="currentColor"
              className="fill-primary dark:fill-blue-400"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

