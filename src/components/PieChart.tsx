import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  isDark?: boolean;
  totalValue?: number; // Optional total for percentage calculation
  centerLabel?: string; // Optional custom center label
}

export function PieChart({ data, size = 200, strokeWidth = 2, isDark = false, totalValue, centerLabel }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No data</Text>
        </View>
      </View>
    );
  }

  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  let currentAngle = -90; // Start from top

  const paths = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    currentAngle += angle;

    return (
      <Path
        key={index}
        d={pathData}
        fill={item.color}
        stroke={isDark ? '#1C1B1F' : '#FFFFFF'}
        strokeWidth={strokeWidth}
      />
    );
  });

  // Calculate percentage if totalValue is provided
  const percentage = totalValue ? (total / totalValue) * 100 : null;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>{paths}</G>
        <Circle cx={center} cy={center} r={radius * 0.6} fill={isDark ? '#1C1B1F' : '#FFFFFF'} />
        {centerLabel ? (
          <SvgText
            x={center}
            y={center}
            fontSize={14}
            fontWeight="600"
            fill={isDark ? '#E6E1E5' : '#111'}
            textAnchor="middle">
            {centerLabel}
          </SvgText>
        ) : percentage !== null ? (
          <>
            <SvgText
              x={center}
              y={center - 8}
              fontSize={24}
              fontWeight="bold"
              fill={isDark ? '#E6E1E5' : '#111'}
              textAnchor="middle">
              {percentage.toFixed(0)}%
            </SvgText>
            <SvgText
              x={center}
              y={center + 16}
              fontSize={12}
              fill={isDark ? '#938F99' : '#666'}
              textAnchor="middle">
              Used
            </SvgText>
          </>
        ) : (
          <SvgText
            x={center}
            y={center}
            fontSize={16}
            fontWeight="600"
            fill={isDark ? '#E6E1E5' : '#111'}
            textAnchor="middle">
            {data.length}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  emptyTextDark: {
    color: '#666',
  },
});

