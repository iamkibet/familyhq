import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeScheme } from "@/hooks/use-theme-scheme";
import { PieChart } from "@/src/components/PieChart";
import { useFormatCurrency } from "@/src/hooks/use-format-currency";
import { useCurrencyStore } from "@/src/stores/currencyStore";
import { BudgetCategory, BudgetPeriod } from "@/src/types";
import { formatDate } from "@/src/utils";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BudgetCardProps {
  categories: BudgetCategory[];
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  pieChartData: { name: string; value: number; color: string }[];
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
  const isDark = colorScheme === "dark";
  const formatCurrency = useFormatCurrency();
  const { currency } = useCurrencyStore();

  const hasValidData = activePeriod && categories.length > 0;
  const safePercentageUsed =
    percentageUsed == null || isNaN(percentageUsed) || !isFinite(percentageUsed)
      ? 0
      : Math.max(0, Math.min(100, percentageUsed));
  const safeTotalLimit =
    totalLimit == null || isNaN(totalLimit) || !isFinite(totalLimit)
      ? 0
      : Math.max(0, totalLimit);
  const safeTotalSpent =
    totalSpent == null || isNaN(totalSpent) || !isFinite(totalSpent)
      ? 0
      : Math.max(0, totalSpent);

  const statusColor = getBudgetStatusColor(safePercentageUsed);

  // Format number only (no currency) for large amount display; symbol shown smaller
  const formatAmountOnly = (amount: number) =>
    new Intl.NumberFormat(currency.locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);

  const amountOnlyLimit = formatAmountOnly(safeTotalLimit);
  const amountOnlySpent = formatAmountOnly(safeTotalSpent);

  // Scale main amount font for 6+ figures so it stays readable
  const getAmountFontSize = (numStr: string) => {
    const len = numStr.replace(/\D/g, "").length;
    if (len >= 7) return 22; // 1,000,000+
    if (len >= 6) return 24; // 100,000+
    if (len >= 5) return 26; // 10,000+
    return 28; // smaller
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push("/(tabs)/budget")}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: isDark
                  ? "rgba(79, 195, 247, 0.2)"
                  : "rgba(10, 126, 164, 0.15)",
              },
            ]}
          >
            <IconSymbol
              name="dollarsign.circle.fill"
              size={20}
              color={isDark ? "#4FC3F7" : "#0a7ea4"}
            />
          </View>
          <View>
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Budget
            </Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {activePeriod
                ? `${formatDate(activePeriod.startDate)} - ${formatDate(activePeriod.endDate)}`
                : "No Active Period"}
            </Text>
          </View>
        </View>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={isDark ? "#938F99" : "#999"}
        />
      </View>

        {/* Content */}
        <View style={styles.content}>
          {!activePeriod || !hasValidData ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                ]}
              >
                <IconSymbol
                  name="dollarsign.circle"
                  size={36}
                  color={isDark ? "#666" : "#999"}
                />
              </View>
              <Text
                style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}
              >
                {!activePeriod
                  ? "No Active Budget Period"
                  : "No Budget Categories"}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  isDark && styles.emptyDescriptionDark,
                ]}
              >
                {!activePeriod
                  ? "Create a budget period to get started"
                  : "Tap to set up your budget"}
              </Text>
            </View>
          ) : (
            <>
              {/* Main Summary */}
              <View style={styles.summarySection}>
                <View style={styles.summaryLeft}>
                  <Text style={[styles.label, isDark && styles.labelDark]}>
                    Spent
                  </Text>
                  <View style={styles.amountRow}>
                    <Text style={[styles.currencySymbol, isDark && styles.currencySymbolDark]}>
                      {currency.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.amount,
                        {
                          color: statusColor,
                          fontSize: getAmountFontSize(amountOnlySpent),
                        },
                      ]}
                    >
                      {amountOnlySpent}
                    </Text>
                  </View>
                  <Text style={[styles.limit, isDark && styles.limitDark]}>
                    of{" "}
                    <Text style={styles.limitCurrency}>{currency.symbol}</Text>{" "}
                    {amountOnlyLimit}
                  </Text>
                </View>

                {pieChartData.length > 0 && safeTotalLimit > 0 && (
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={pieChartData}
                      size={90}
                      isDark={isDark}
                      totalValue={safeTotalLimit}
                      centerLabel={safePercentageUsed.toFixed(0) + "%"}
                    />
                  </View>
                )}
              </View>

              {categories.length > 0 ? (
                <View style={styles.categoriesSection}>
                  {categories.slice(0, 3).map((category) => {
                    const categorySpent = calculateCategorySpent(category.name);
                    const safeCategorySpent =
                      isNaN(categorySpent) || !isFinite(categorySpent)
                        ? 0
                        : Math.max(0, categorySpent);
                    const safeCategoryLimit =
                      isNaN(category.limit) || !isFinite(category.limit)
                        ? 0
                        : Math.max(0, category.limit);
                    const categoryPercentage =
                      safeCategoryLimit > 0
                        ? (safeCategorySpent / safeCategoryLimit) * 100
                        : 0;
                    const categoryColor =
                      getBudgetStatusColor(categoryPercentage);

                    return (
                      <View key={category.id} style={styles.categoryItem}>
                        <View style={styles.categoryLeft}>
                          <View
                            style={[
                              styles.categoryDot,
                              { backgroundColor: categoryColor },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryName,
                              isDark && styles.categoryNameDark,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {category.name}
                          </Text>
                        </View>
                        <View style={styles.categoryRight}>
                          <View style={styles.categoryBar}>
                            <View
                              style={[
                                styles.categoryBarFill,
                                {
                                  backgroundColor: categoryColor,
                                  width: `${Math.min(categoryPercentage, 100)}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryAmount,
                              { color: categoryColor },
                            ]}
                          >
                            {formatCurrency(safeCategorySpent)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {categories.length > 3 && (
                    <View style={styles.viewAllContainer}>
                      <Text
                        style={[
                          styles.viewAllText,
                          isDark && styles.viewAllTextDark,
                        ]}
                      >
                        +{categories.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyCategories}>
                  <Text
                    style={[
                      styles.emptyCategoriesText,
                      isDark && styles.emptyCategoriesTextDark,
                    ]}
                  >
                    No budget categories yet
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    height: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: "#2C2C2C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.3,
  },
  titleDark: {
    color: "#E6E1E5",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  subtitleDark: {
    color: "#938F99",
  },
  content: {
    flex: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  currencySymbolDark: {
    color: "#938F99",
  },
  limitCurrency: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyTitleDark: {
    color: "#938F99",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyDescriptionDark: {
    color: "#666",
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryLeft: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  labelDark: {
    color: "#938F99",
  },
  amount: {
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 4,
    includeFontPadding: false,
  },
  limit: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  limitDark: {
    color: "#666",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  categoriesSection: {
    marginTop: 16,
    gap: 10,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 28,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    flex: 1,
  },
  categoryNameDark: {
    color: "#B0AEB3",
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  categoryBar: {
    width: 56,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 56,
    textAlign: "right",
  },
  viewAllContainer: {
    marginTop: 6,
    paddingVertical: 4,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
  },
  viewAllTextDark: {
    color: "#666",
  },
  emptyCategories: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyCategoriesText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  emptyCategoriesTextDark: {
    color: "#666",
  },
});
