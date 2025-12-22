import { FC, useMemo } from 'react';

import { Box, Typography } from '@mui/material';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { PortfolioSnapshot, formatPortfolioDataForChart, getPortfolioChange } from '../../../utils';

const CHART_HEIGHT = 120;
const POSITIVE_COLOR = '#4CAF50';
const NEGATIVE_COLOR = '#F44336';
const NEUTRAL_COLOR = '#9E9E9E';

interface PortfolioChartProps {
  totalValue: number;
  snapshots: PortfolioSnapshot[];
  currency?: string;
}

export const PortfolioChart: FC<PortfolioChartProps> = ({
  totalValue,
  snapshots,
  currency = 'USD'
}) => {
  const chartData = useMemo(() => formatPortfolioDataForChart(snapshots), [snapshots]);
  const percentageChange = useMemo(() => getPortfolioChange(snapshots), [snapshots]);

  const chartColor = useMemo(() => {
    if (percentageChange > 0) return POSITIVE_COLOR;
    if (percentageChange < 0) return NEGATIVE_COLOR;
    return NEUTRAL_COLOR;
  }, [percentageChange]);

  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(totalValue);
  }, [totalValue, currency]);

  const formattedChange = useMemo(() => {
    const sign = percentageChange >= 0 ? '+' : '';
    return `${sign}${percentageChange.toFixed(2)}%`;
  }, [percentageChange]);

  // Generate mock data if no real data exists
  const displayData = useMemo(() => {
    if (chartData.length >= 2) return chartData;

    // Generate flat line with current value for display purposes
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: totalValue,
        date
      };
    });
  }, [chartData, totalValue]);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        borderRadius: 2,
        padding: 2,
        marginBottom: 2
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '1.75rem',
              lineHeight: 1.2
            }}
          >
            {formattedValue}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              mt: 0.5
            }}
          >
            Total Balance
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor:
              percentageChange >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
            borderRadius: 1,
            px: 1,
            py: 0.5
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: chartColor,
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            {formattedChange}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: CHART_HEIGHT, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: '0.75rem'
              }}
              formatter={(value: number | undefined) => [
                value !== undefined ? `$${value.toFixed(2)}` : '$0.00',
                'Value'
              ]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
