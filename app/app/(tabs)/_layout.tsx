import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import useCartStore from '@/store/cartStore';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

function AnimatedTabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <FontAwesome name={name} size={22} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const cart = useCartStore((state) => state.cart);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: '#F4A825',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="cutlery" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="shopping-cart" color={color} focused={focused} />
          ),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#F4A825', color: '#000000', fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="comment" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
