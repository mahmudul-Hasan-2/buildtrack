"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#94a3b8", "#f97316", "#eab308", "#22c55e"];

type Props = {
  monthly: { month: string; total: number }[];
  budget: { name: string; budget: number; spent: number }[];
  taskStatus: { name: string; value: number }[];
  contractors: { name: string; rate: number; total: number }[];
  showTasks: boolean;
};

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ReportsCharts({
  monthly,
  budget,
  taskStatus,
  contractors,
  showTasks,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Box title="Monthly expense trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#f97316"
              strokeWidth={2}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box title="Budget vs actual cost (top projects)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={budget}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              fontSize={11}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="budget" fill="#0B192C" name="Budget" />
            <Bar dataKey="spent" fill="#f97316" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {showTasks && (
        <>
          <Box title="Task status distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {taskStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Box title="Contractor performance (completion %)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Bar dataKey="rate" fill="#22c55e" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </div>
  );
}
