'use client';

import { useState, useEffect, useCallback } from 'react';

interface DistributionItem {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

interface PercentageDistributionProps {
  items: DistributionItem[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  disabled?: boolean;
}

// SVG Pie Chart component
function PieChart({
  items,
  values,
}: {
  items: DistributionItem[];
  values: Record<string, number>;
}) {
  const size = 200;
  const center = size / 2;
  const radius = 85;

  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const segments = items
    .filter(item => (values[item.key] || 0) > 0)
    .map((item) => {
      const percent = (values[item.key] || 0) / 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;

      const [startX, startY] = getCoordinatesForPercent(startPercent);
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const pathData = [
        `M ${center + startX * radius} ${center + startY * radius}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
        `L ${center} ${center}`,
      ].join(' ');

      // Calculate label position (middle of arc)
      const labelPercent = startPercent + percent / 2;
      const [labelX, labelY] = getCoordinatesForPercent(labelPercent);
      const labelRadius = radius * 0.6;

      return {
        item,
        pathData,
        labelX: center + labelX * labelRadius,
        labelY: center + labelY * labelRadius,
        percent: values[item.key] || 0,
      };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Pie segments */}
      {segments.map(({ item, pathData }) => (
        <path
          key={item.key}
          d={pathData}
          fill={item.color}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1"
        />
      ))}
      {/* Labels (emoji + percentage inside slice) */}
      {segments.map(({ item, labelX, labelY, percent }) => (
        percent >= 10 && (
          <text
            key={`label-${item.key}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {item.emoji} {percent}%
          </text>
        )
      ))}
    </svg>
  );
}

export function PercentageDistribution({
  items,
  values,
  onChange,
  disabled = false,
}: PercentageDistributionProps) {

  // Ensure values always sum to 100
  const normalizeValues = useCallback((vals: Record<string, number>): Record<string, number> => {
    const total = Object.values(vals).reduce((sum, v) => sum + v, 0);
    if (total === 0) {
      // Equal distribution if all zero
      const equalShare = Math.floor(100 / items.length);
      const remainder = 100 - (equalShare * items.length);
      return items.reduce((acc, item, idx) => {
        acc[item.key] = equalShare + (idx === 0 ? remainder : 0);
        return acc;
      }, {} as Record<string, number>);
    }
    if (total === 100) return vals;

    // Normalize to 100
    const factor = 100 / total;
    const normalized: Record<string, number> = {};
    let runningTotal = 0;

    items.forEach((item, idx) => {
      if (idx === items.length - 1) {
        // Last item gets remainder to ensure exact 100
        normalized[item.key] = 100 - runningTotal;
      } else {
        normalized[item.key] = Math.round((vals[item.key] || 0) * factor);
        runningTotal += normalized[item.key];
      }
    });

    return normalized;
  }, [items]);

  const [localValues, setLocalValues] = useState<Record<string, number>>(() =>
    normalizeValues(values)
  );

  // Sync with external values
  useEffect(() => {
    setLocalValues(normalizeValues(values));
  }, [values, normalizeValues]);

  const handleSliderChange = (key: string, newValue: number) => {
    if (disabled) return;

    const oldValue = localValues[key];
    const diff = newValue - oldValue;

    if (diff === 0) return;

    // Get other items that can be adjusted
    const otherItems = items.filter(item => item.key !== key);
    const otherTotal = otherItems.reduce((sum, item) => sum + localValues[item.key], 0);

    // If we're increasing, we need to take from others
    // If we're decreasing, we need to give to others
    const newValues: Record<string, number> = { ...localValues, [key]: newValue };

    if (otherTotal === 0 && diff > 0) {
      // Can't increase if others are at 0
      return;
    }

    // Distribute the difference proportionally among other items
    otherItems.forEach(item => {
      const currentVal = localValues[item.key];
      if (otherTotal === 0) {
        // Equal distribution
        newValues[item.key] = Math.round((100 - newValue) / otherItems.length);
      } else {
        const proportion = currentVal / otherTotal;
        const adjustment = Math.round(diff * proportion);
        newValues[item.key] = Math.max(0, currentVal - adjustment);
      }
    });

    // Ensure total is exactly 100
    const total = Object.values(newValues).reduce((sum, v) => sum + v, 0);
    if (total !== 100) {
      // Find the largest other item and adjust
      const largestOther = otherItems.reduce((max, item) =>
        newValues[item.key] > newValues[max.key] ? item : max
      , otherItems[0]);
      newValues[largestOther.key] += (100 - total);
    }

    // Ensure no negative values
    Object.keys(newValues).forEach(k => {
      newValues[k] = Math.max(0, Math.min(100, newValues[k]));
    });

    setLocalValues(newValues);
    onChange(newValues);
  };

  const total = Object.values(localValues).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Sliders section (full width) */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-cream flex items-center gap-2">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </label>
              <span
                className="text-lg font-bold min-w-[3rem] text-right"
                style={{ color: item.color }}
              >
                {localValues[item.key]}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={localValues[item.key] || 0}
              onChange={(e) => handleSliderChange(item.key, parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, ${item.color} 0%, ${item.color} ${localValues[item.key]}%, rgba(255,255,255,0.2) ${localValues[item.key]}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>
        ))}

        {/* Total indicator */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-cream/10">
          <span className="text-cream/60">Totaal</span>
          <span className={`font-bold ${total === 100 ? 'text-success-green' : 'text-warm-red'}`}>
            {total}%
          </span>
        </div>
      </div>

      {/* Chart section (own row) - always show pie chart */}
      <div className="flex justify-center pt-4 border-t border-cream/10">
        <PieChart items={items} values={localValues} />
      </div>
    </div>
  );
}
