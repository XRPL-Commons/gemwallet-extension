import { FC, useMemo } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Typography } from '@mui/material';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

import { PortfolioSnapshot, formatPortfolioDataForChart, getPortfolioChange } from '../../../utils';

const CHART_HEIGHT = 100;
const POSITIVE_COLOR = '#4CAF50';
const NEGATIVE_COLOR = '#F44336';
const NEUTRAL_COLOR = '#9E9E9E';

interface PortfolioChartProps {
  totalValue: number;
  snapshots: PortfolioSnapshot[];
  currency?: string;
  onClick?: () => void;
}

export const PortfolioChart: FC<PortfolioChartProps> = ({
  totalValue,
  snapshots,
  currency = 'USD',
  onClick
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

  // No mock data - show flat line at 0 if no real data
  const displayData = useMemo(() => {
    if (chartData.length >= 2) return chartData;

    // Show flat line at current value (or 0)
    const now = new Date();
    const value = totalValue || 0;
    return [
      { time: 'Start', value, date: new Date(now.getTime() - 86400000) },
      { time: 'Now', value, date: now }
    ];
  }, [chartData, totalValue]);

  return (
    <Box
      onClick={onClick}
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        borderRadius: 2,
        padding: 2,
        marginBottom: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        '&:hover': onClick
          ? {
              transform: 'scale(1.01)'
            }
          : {}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
            {onClick && (
              <KeyboardArrowDownIcon
                sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', mt: 0.5 }}
              />
            )}
          </Box>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
