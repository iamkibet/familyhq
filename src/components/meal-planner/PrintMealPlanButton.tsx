import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import type { EntriesByDate } from '@/src/stores/mealPlannerStore';
import { MEAL_TYPE_LABELS } from './MealCell';
import { MealType } from '@/src/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface PrintMealPlanButtonProps {
  familyName: string;
  weekStart: string;
  weekEnd: string;
  weekDates: string[];
  entriesByDate: EntriesByDate;
  variant?: 'primary' | 'secondary';
}

/**
 * Builds a minimal HTML document for the weekly meal plan.
 * No interactive UI - table only, suitable for print/PDF.
 */
function buildPrintHtml(
  familyName: string,
  weekStart: string,
  weekEnd: string,
  weekDates: string[],
  entriesByDate: EntriesByDate
): string {
  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const headerCells = weekDates
    .map((d) => {
      const date = new Date(d + 'T12:00:00');
      const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
      return `<th scope="col">${dayName}<br><small>${formatDate(d)}</small></th>`;
    })
    .join('');

  const rows = MEAL_ORDER.map((mealType) => {
    const cells = weekDates
      .map((date) => {
        const entry = entriesByDate[date]?.[mealType];
        const text = entry ? entry.title : '—';
        return `<td>${escapeHtml(text)}</td>`;
      })
      .join('');
    return `<tr><th scope="row">${MEAL_TYPE_LABELS[mealType]}</th>${cells}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Meal Plan – ${escapeHtml(familyName)}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; color: #1a1a1a; }
    h1 { font-size: 20px; margin: 0 0 8px 0; font-weight: 700; }
    .sub { font-size: 14px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    th[scope="row"] { width: 100px; }
    small { font-weight: normal; color: #666; }
  </style>
</head>
<body>
  <h1>${escapeHtml(familyName)} – Meal Plan</h1>
  <p class="sub">${formatDate(weekStart)} – ${formatDate(weekEnd)}</p>
  <table>
    <thead><tr><th></th>${headerCells}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function PrintMealPlanButton({
  familyName,
  weekStart,
  weekEnd,
  weekDates,
  entriesByDate,
  variant = 'primary',
}: PrintMealPlanButtonProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const primary = isDark ? '#4FC3F7' : '#0a7ea4';
  const isSecondary = variant === 'secondary';

  const handlePrint = async () => {
    setLoading(true);
    try {
      const html = buildPrintHtml(
        familyName,
        weekStart,
        weekEnd,
        weekDates,
        entriesByDate
      );

      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        // On web, printToFileAsync opens the browser print dialog; no share.
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or share meal plan',
        });
      } else {
        Alert.alert('PDF ready', `Saved to: ${uri}`);
      }
    } catch (e) {
      console.error('Print/export failed:', e);
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePrint}
      disabled={loading}
      style={[
        styles.btn,
        isSecondary
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: primary }
          : { backgroundColor: primary },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? primary : '#FFFFFF'} size="small" />
      ) : (
        <Text style={[styles.btnText, isSecondary && { color: primary }]}>
          {Platform.OS === 'web' ? 'Print / PDF' : 'Export PDF'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
