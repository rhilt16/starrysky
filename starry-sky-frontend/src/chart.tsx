import React from "react";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import Tooltip from "@mui/material/Tooltip";
import type { CelestialBodiesSchema } from '../src/api/services/MainService'

export interface SkyScatterChartProps {
  buckets: Record<number, CelestialBodiesSchema[]>;
  width?: number;
  height?: number;
}

export const SkyScatterChart: React.FC<SkyScatterChartProps> = ({
  buckets,
  width = 600,
  height = 500,
}) => {
  // Convert buckets → series[]
  const series = Object.entries(buckets)
    .filter(([_, bucket]) => bucket.length > 0)
    .map(([key, bucket]) => ({
      label: `Bucket ${key}`,
      data: bucket.map((v) => ({
        x: Number(v.position.alt),
        y: Number(v.position.az),
        id: v.name,
        data: v, // attach full star body for tooltip
      })),
    }));
  return (
    <ScatterChart
      width={width}
      height={height}
      series={series}
    >
      <Tooltip
        renderTooltip={(params: { dataPoint: { data: any; }; }) => {
          const v = params.dataPoint.data;

          return (
            <div
              style={{
                padding: 10,
                background: "rgba(0,0,0,0.85)",
                color: "white",
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              <strong>{v.name}</strong><br />
              Magnitude: {v.magnitude}<br />
              Alt: {v.position.alt}°<br />
              Az: {v.position.az}°<br />
              Distance: {v.position.distance_au} AU
            </div>
          );
        }}
      />
    </ScatterChart>
  );

};

export default SkyScatterChart;
