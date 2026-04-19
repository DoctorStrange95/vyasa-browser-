"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface Props {
  labels: number[];
  data: number[];
  label: string;
  color: string;
  unit?: string;
}

export default function TrendChart({ labels, data, label, color, unit = "" }: Props) {
  const chartData = {
    labels: labels.map(String),
    datasets: [
      {
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}22`,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: color,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f2040",
        borderColor: "#1e3a5f",
        borderWidth: 1,
        titleColor: "#94a3b8",
        bodyColor: color,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => ` ${ctx.parsed.y}${unit}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#475569", font: { family: "'IBM Plex Mono', monospace", size: 11 } },
        grid: { color: "#1e3a5f" },
      },
      y: {
        ticks: { color: "#475569", font: { family: "'IBM Plex Mono', monospace", size: 11 } },
        grid: { color: "#1e3a5f" },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
