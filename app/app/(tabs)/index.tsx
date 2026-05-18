import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';
import type { MenuItem } from '@/types';
import MenuItemCard from '@/components/MenuItem';
import useCartStore from '@/store/cartStore';
import { API_BASE_URL } from '@/constants/config';

const C = {
  bg: '#0A0A0A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
  pill: '#1A1A1A',
};

const CUISINES = ['All', 'American', 'Japanese', 'Greek', 'French', 'Mexican', 'Indian'];

// Each card manages its own staggered entrance animation on mount
function AnimatedMenuCard({
  item,
  index,
  isRecommended,
}: {
  item: MenuItem;
  index: number;
  isRecommended: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={isRecommended ? styles.recommendedWrapper : undefined}>
        <MenuItemCard item={item} />
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>✨ Recommended</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const recommendedItemIds = useCartStore((state) => state.recommendedItemIds);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const filteredItems =
    selectedCuisine === 'All'
      ? items
      : items.filter((i) => i.cuisine === selectedCuisine.toLowerCase());

  async function fetchMenu(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else {
      setLoading(true);
      setError(false);
    }
    try {
      const res = await axios.get<MenuItem[]>(`${API_BASE_URL}/menu`);
      setItems(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Intelligent Bistro</Text>
        <Text style={styles.headerSubtitle}>Premium Dining Experience</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryBarContent}
      >
        {CUISINES.map((cuisine) => (
          <TouchableOpacity
            key={cuisine}
            style={[styles.pill, selectedCuisine === cuisine && styles.pillActive]}
            onPress={() => setSelectedCuisine(cuisine)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.pillText,
                selectedCuisine === cuisine && styles.pillTextActive,
              ]}
            >
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Could not load menu. Make sure the server is running.
          </Text>
        </View>
      )}

      {!loading && !error && (
        // key prop forces full remount on category change so animations restart
        <FlatList
          key={selectedCuisine}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMenu(true)}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
          renderItem={({ item, index }) => (
            <AnimatedMenuCard
              item={item}
              index={index}
              isRecommended={recommendedItemIds.includes(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.accent,
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  categoryBar: { flexGrow: 0 },
  categoryBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  pillText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    color: C.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  recommendedWrapper: {
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 16,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
