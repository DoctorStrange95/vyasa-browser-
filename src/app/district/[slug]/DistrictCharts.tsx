"use client";
import TrendChart from "@/components/TrendChart";

interface District {
  imrTrend: number[];
  vaccinationTrend: number[];
  stuntingTrend: number[];
  under5Trend: number[];
  trendYears: number[];
}

export default function DistrictCharts({ district }: { district: District }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
      <ChartCard title="Infant Mortality Rate Trend" sub="per 1,000 live births (state estimate)">
        <TrendChart labels={district.trendYears} data={district.imrTrend} label="IMR" color="#f97316" unit="/1000" />
      </ChartCard>
      <ChartCard title="Vaccination Coverage Trend" sub="% fully immunized children (state estimate)">
        <TrendChart labels={district.trendYears} data={district.vaccinationTrend} label="Vaccination %" color="#2dd4bf" unit="%" />
      </ChartCard>
      <ChartCard title="Child Stunting Trend" sub="% stunted children under 5 (state estimate)">
        <TrendChart labels={district.trendYears} data={district.stuntingTrend} label="Stunting %" color="#a855f7" unit="%" />
      </ChartCard>
      <ChartCard title="Under-5 Mortality Trend" sub="per 1,000 live births (state estimate)">
        <TrendChart labels={district.trendYears} data={district.under5Trend} label="U5-MR" color="#ef4444" unit="/1000" />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0f2040", border: "1px solid #1e3a5f", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="font-display" style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0" }}>{title}</div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>{sub}</div>
      </div>
      <div style={{ height: "200px" }}>{children}</div>
    </div>
  );
}
