import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeScheme } from "@/hooks/use-theme-scheme";
import { useCurrencyStore } from "@/src/stores/currencyStore";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface AllTimeSpendingStats {
  total: number;
  fromExpenses: number;
  fromShopping: number;
}

interface AllTimeSpendingCardProps {
  stats: AllTimeSpendingStats;
}

export function AllTimeSpendingCard({ stats }: AllTimeSpendingCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === "dark";
  const { currency } = useCurrencyStore();

  const safeTotal = Math.max(0, stats?.total ?? 0);
  const safeExpenses = Math.max(0, stats?.fromExpenses ?? 0);
  const safeShopping = Math.max(0, stats?.fromShopping ?? 0);
  const hasSpending = safeTotal > 0;

  const primaryColor = isDark ? "#4FC3F7" : "#0a7ea4";
  const secondaryColor = isDark ? "#66BB6A" : "#4CAF50";

  const formatAmountOnly = (amount: number) =>
    new Intl.NumberFormat(currency.locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);

  const amountOnlyTotal = formatAmountOnly(safeTotal);

  const getAmountFontSize = (numStr: string) => {
    const len = numStr.replace(/\D/g, "").length;
    if (len >= 7) return 22;
    if (len >= 6) return 24;
    if (len >= 5) return 26;
    return 28;
  };

  const breakdownItems = [
    {
      label: "Direct Expenses",
      value: safeExpenses,
      icon: "dollarsign.circle.fill",
      color: primaryColor,
    },
    {
      label: "Shopping Items",
      value: safeShopping,
      icon: "cart.fill",
      color: secondaryColor,
    },
  ];

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push("/(tabs)/budget")}
      activeOpacity={0.9}
    >
      <View>
        <View style={styles.header}>
          <View style={styles.headerContent}>
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
                name="chart.bar.fill"
                size={20}
                color={primaryColor}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                All-Time Spending
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {hasSpending
                  ? "Total tracked spending"
                  : "Track expenses and shopping"}
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
          {!hasSpending ? (
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
                  name="chart.bar.fill"
                  size={36}
                  color={isDark ? "#666" : "#999"}
                />
              </View>
              <Text
                style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}
              >
                No spending tracked yet
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  isDark && styles.emptyDescriptionDark,
                ]}
              >
                Track expenses and bought shopping items to see your all-time
                spending
              </Text>
            </View>
          ) : (
            <>
              {/* Main total */}
              <View style={styles.totalSection}>
                <Text
                  style={[styles.totalLabel, isDark && styles.totalLabelDark]}
                >
                  Total Spent
                </Text>
                <View style={styles.totalAmountRow}>
                  <Text
                    style={[
                      styles.totalCurrencySymbol,
                      isDark && styles.totalCurrencySymbolDark,
                    ]}
                  >
                    {currency.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.totalAmount,
                      {
                        color: primaryColor,
                        fontSize: getAmountFontSize(amountOnlyTotal),
                      },
                    ]}
                  >
                    {amountOnlyTotal}
                  </Text>
                </View>
                <View style={styles.totalDivider} />
              </View>

              {/* Breakdown */}
              <View style={styles.breakdownSection}>
                {breakdownItems.map((item, index) => (
                  <View
                    key={item.label}
                    style={[
                      styles.breakdownItem,
                      index < breakdownItems.length - 1 &&
                        styles.breakdownItemBorder,
                      index < breakdownItems.length - 1 &&
                        isDark &&
                        styles.breakdownItemBorderDark,
                    ]}
                  >
                    <View style={styles.breakdownLeft}>
                      <View
                        style={[
                          styles.breakdownIcon,
                          { backgroundColor: `${item.color}20` },
                        ]}
                      >
                        <IconSymbol
                          name={item.icon}
                          size={16}
                          color={item.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.breakdownLabel,
                          isDark && styles.breakdownLabelDark,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.breakdownValueRow}>
                      <Text
                        style={[
                          styles.breakdownCurrency,
                          isDark && styles.breakdownCurrencyDark,
                        ]}
                      >
                        {currency.symbol}
                      </Text>
                      <Text
                        style={[
                          styles.breakdownValue,
                          isDark && styles.breakdownValueDark,
                        ]}
                      >
                        {formatAmountOnly(item.value)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Progress bars */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: primaryColor }]}>
                    Expenses
                  </Text>
                  <Text
                    style={[styles.progressLabel, { color: secondaryColor }]}
                  >
                    Shopping
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: primaryColor,
                        width: `${safeExpenses > 0 ? (safeExpenses / safeTotal) * 100 : 0}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: secondaryColor,
                        width: `${safeShopping > 0 ? (safeShopping / safeTotal) * 100 : 0}%`,
                        marginLeft: -2,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressPercentages}>
                  <Text
                    style={[
                      styles.progressPercentage,
                      isDark && styles.progressPercentageDark,
                    ]}
                  >
                    {safeExpenses > 0
                      ? Math.round((safeExpenses / safeTotal) * 100)
                      : 0}
                    %
                  </Text>
                  <Text
                    style={[
                      styles.progressPercentage,
                      isDark && styles.progressPercentageDark,
                    ]}
                  >
                    {safeShopping > 0
                      ? Math.round((safeShopping / safeTotal) * 100)
                      : 0}
                    %
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    minHeight: 400,
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
  headerContent: {
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
  headerText: {
    gap: 2,
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
    letterSpacing: 0.2,
  },
  subtitleDark: {
    color: "#938F99",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
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
  totalSection: {
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  totalLabelDark: {
    color: "#938F99",
  },
  totalAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  totalCurrencySymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  totalCurrencySymbolDark: {
    color: "#938F99",
  },
  totalAmount: {
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  totalDivider: {
    height: 2,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 1,
  },
  breakdownSection: {
    marginBottom: 24,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  breakdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  breakdownItemBorderDark: {
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#555",
  },
  breakdownLabelDark: {
    color: "#B0AEB3",
  },
  breakdownValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  breakdownCurrency: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  breakdownCurrencyDark: {
    color: "#938F99",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  breakdownValueDark: {
    color: "#E6E1E5",
  },
  progressSection: {
    gap: 12,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressPercentages: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  progressPercentageDark: {
    color: "#938F99",
  },
});
