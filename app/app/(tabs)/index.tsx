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
import { API_BASE_URL } from '@/app/config';

const C = {
  bg: '#0A0A0A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
  pill: '#1A1A1A',
};

const CATEGORIES = ['All', 'Burgers', 'Drinks', 'Sides', 'Desserts'];

// Each card manages its own staggered entrance animation on mount
function AnimatedMenuCard({ item, index }: { item: MenuItem; index: number }) {
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
      <MenuItemCard item={item} />
    </Animated.View>
  );
}

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter(
          (i) => i.category.toLowerCase() === selectedCategory.toLowerCase()
        );

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
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, selectedCategory === cat && styles.pillActive]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === cat && styles.pillTextActive,
              ]}
            >
              {cat}
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
          key={selectedCategory}
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
            <AnimatedMenuCard item={item} index={index} />
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
});
