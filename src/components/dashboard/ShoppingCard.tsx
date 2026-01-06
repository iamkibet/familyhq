import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { ShoppingItem, ShoppingList } from '@/src/types';
import { Kalam_400Regular } from '@expo-google-fonts/kalam';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShoppingCardProps {
  activeLists: ShoppingList[];
  allItems: ShoppingItem[];
}

export function ShoppingCard({ activeLists, allItems }: ShoppingCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  
  // Load handwriting font (similar to Chalkduster - works on both iOS and Android)
  const [fontsLoaded] = useFonts({
    Kalam_400Regular,
  });

  // Get all items that need to be bought across all lists
  const itemsToBuy = allItems
    .filter((item) => !item.isBought)
    .sort((a, b) => {
      // Sort by list name, then by item name
      const listA = activeLists.find((l) => l.id === a.shoppingListId);
      const listB = activeLists.find((l) => l.id === b.shoppingListId);
      if (listA?.name !== listB?.name) {
        return (listA?.name || '').localeCompare(listB?.name || '');
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20); // Show up to 20 items (scrollable)

  // Group items by list for display
  const itemsByList = itemsToBuy.reduce((acc, item) => {
    const list = activeLists.find((l) => l.id === item.shoppingListId);
    const listName = list?.name || 'Unknown';
    if (!acc[listName]) {
      acc[listName] = [];
    }
    acc[listName].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItemsToBuy = allItems.filter((item) => !item.isBought).length;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(tabs)/shopping')}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <IconSymbol name="cart.fill" size={24} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
          <View>
            <Text style={[styles.title, isDark && styles.titleDark]}>Shopping</Text>
            {totalItemsToBuy > 0 && (
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {totalItemsToBuy} item{totalItemsToBuy !== 1 ? 's' : ''} to buy
              </Text>
            )}
          </View>
        </View>
        <IconSymbol name="chevron.right" size={20} color={isDark ? '#938F99' : '#999'} />
      </TouchableOpacity>

      <View style={styles.content}>
        {itemsToBuy.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="cart" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              All items bought!
            </Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              Your shopping lists are complete
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={false}>
            <View style={styles.itemsContainer}>
              {Object.entries(itemsByList).map(([listName, items]) => (
                <View key={listName} style={styles.listGroup}>
                  <Text style={[styles.listName, isDark && styles.listNameDark]} numberOfLines={1}>
                    {listName}
                  </Text>
                  <View style={styles.itemsList}>
                    {items.map((item, index) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={[styles.itemNumber, isDark && styles.itemNumberDark]}>
                          {index + 1}.
                        </Text>
                        <View style={styles.itemContent}>
                          <Text style={[
                            styles.itemText, 
                            isDark && styles.itemTextDark,
                            fontsLoaded && { fontFamily: 'Kalam_400Regular' } // Use same font on both platforms
                          ]}>
                            {item.name}
                          </Text>
                          {item.quantity > 1 && (
                            <Text style={[styles.itemQuantity, isDark && styles.itemQuantityDark]}>
                              ×{item.quantity}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            {totalItemsToBuy > itemsToBuy.length && (
              <View style={styles.moreItems}>
                <Text style={[styles.moreItemsText, isDark && styles.moreItemsTextDark]}>
                  +{totalItemsToBuy - itemsToBuy.length} more item{totalItemsToBuy - itemsToBuy.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    height: 400,
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
    flex: 1,
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
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  itemsContainer: {
    gap: 24,
  },
  listGroup: {
    gap: 8,
  },
  listName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  listNameDark: {
    color: '#666',
  },
  itemsList: {
    gap: 6,
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center', // Center align number and text
    paddingVertical: 4,
    gap: 8,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '400',
    color: '#999',
    fontFamily: 'System',
    lineHeight: 24,
    minWidth: 24,
  },
  itemNumberDark: {
    color: '#666',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center', // Center align text and quantity
    gap: 6,
    flex: 1,
  },
  itemText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#333',
    fontFamily: 'System', // Fallback - will be overridden by Kalam when font loads (same on both platforms)
    letterSpacing: 0.3,
    lineHeight: 24,
    flex: 1,
  },
  itemTextDark: {
    color: '#E6E1E5',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
    fontFamily: 'System',
    lineHeight: 24,
  },
  itemQuantityDark: {
    color: '#666',
  },
  moreItems: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  moreItemsDark: {
    borderTopColor: '#3C3C3C',
  },
  moreItemsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
  },
  moreItemsTextDark: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyTextDark: {
    color: '#666',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtextDark: {
    color: '#666',
  },
});

