import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { BudgetCategory, BudgetPeriod } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PieChart } from '@/src/components/PieChart';
import { formatDate } from '@/src/utils';

interface BudgetCardProps {
  categories: BudgetCategory[];
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  pieChartData: Array<{ name: string; value: number; color: string }>;
  activePeriod: BudgetPeriod | null;
  calculateCategorySpent: (categoryName: string) => number;
  getBudgetStatusColor: (percentage: number) => string;
}

export function BudgetCard({
  categories,
  totalLimit,
  totalSpent,
  totalRemaining,
  percentageUsed,
  pieChartData,
  activePeriod,
  calculateCategorySpent,
  getBudgetStatusColor,
}: BudgetCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const formatCurrency = useFormatCurrency();
  
  // Ensure we have valid data - if activePeriod exists but categories don't match, show empty state
  const hasValidData = activePeriod && categories.length > 0;
  // Safely handle undefined or invalid percentageUsed
  const safePercentageUsed = (percentageUsed == null || isNaN(percentageUsed) || !isFinite(percentageUsed)) 
    ? 0 
    : Math.max(0, Math.min(100, percentageUsed));
  const safeTotalLimit = (totalLimit == null || isNaN(totalLimit) || !isFinite(totalLimit)) 
    ? 0 
    : Math.max(0, totalLimit);
  const safeTotalSpent = (totalSpent == null || isNaN(totalSpent) || !isFinite(totalSpent)) 
    ? 0 
    : Math.max(0, totalSpent);
  const statusColor = getBudgetStatusColor(safePercentageUsed);

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push('/(tabs)/budget')}
      activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="dollarsign.circle.fill" size={24} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
          <View>
            <Text style={[styles.title, isDark && styles.titleDark]}>Budget</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {activePeriod
                ? `${formatDate(activePeriod.startDate)} - ${formatDate(activePeriod.endDate)}`
                : 'No Active Period'}
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={20} color={isDark ? '#938F99' : '#999'} />
      </View>

      <View style={styles.content}>
        {!activePeriod || !hasValidData ? (
          <View style={styles.emptyState}>
            <IconSymbol name="dollarsign.circle" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
              {!activePeriod ? 'No Active Budget Period' : 'No Budget Categories'}
            </Text>
            <Text style={[styles.emptyStateSubtext, isDark && styles.emptyStateSubtextDark]}>
              {!activePeriod ? 'Create a budget period to get started' : 'Tap to set up your budget'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={[styles.label, isDark && styles.labelDark]}>Total Spent</Text>
                <Text style={[styles.amount, { color: statusColor }]}>
                  {formatCurrency(safeTotalSpent).replace(/\.00$/, '')}
                </Text>
                <Text style={[styles.limit, isDark && styles.limitDark]}>
                  of {formatCurrency(safeTotalLimit).replace(/\.00$/, '')}
                </Text>
              </View>
              {pieChartData.length > 0 && safeTotalLimit > 0 && (
                <View style={styles.chartContainer}>
                  <PieChart
                    data={pieChartData}
                    size={100}
                    isDark={isDark}
                    totalValue={safeTotalLimit}
                    centerLabel={safePercentageUsed.toFixed(0) + '%'}
                  />
                </View>
              )}
            </View>

            {categories.length > 0 ? (
              <View style={styles.categoriesList}>
                {categories.slice(0, 3).map((category) => {
                  const categorySpent = calculateCategorySpent(category.name);
                  const safeCategorySpent = isNaN(categorySpent) || !isFinite(categorySpent) ? 0 : Math.max(0, categorySpent);
                  const safeCategoryLimit = isNaN(category.limit) || !isFinite(category.limit) ? 0 : Math.max(0, category.limit);
                  const categoryPercentage = safeCategoryLimit > 0 ? (safeCategorySpent / safeCategoryLimit) * 100 : 0;
                  const categoryColor = getBudgetStatusColor(categoryPercentage);
                  return (
                    <View key={category.id} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                        <Text style={[styles.categoryName, isDark && styles.categoryNameDark]}>
                          {category.name}
                        </Text>
                      </View>
                      <Text style={[styles.categoryAmount, { color: categoryColor }]}>
                        {formatCurrency(safeCategorySpent)} / {formatCurrency(safeCategoryLimit)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
                  No budget categories yet
                </Text>
                <Text style={[styles.emptyStateSubtext, isDark && styles.emptyStateSubtextDark]}>
                  Tap to set up your budget
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#2C2C2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#E6E1E5',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitleDark: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLeft: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  labelDark: {
    color: '#938F99',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  limit: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  limitDark: {
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#1E1E1E',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
  },
  categoriesList: {
    gap: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  categoryNameDark: {
    color: '#E6E1E5',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateTextDark: {
    color: '#938F99',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyStateSubtextDark: {
    color: '#666',
  },
});

