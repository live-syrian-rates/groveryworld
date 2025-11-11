import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  I18nManager,
} from 'react-native';

// Enable RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

type Product = {
  id: string;
  name: string;
  weight?: string;
  unit?: string;
  price: number;
};

const sampleProducts: Product[] = [
  { id: '1', name: 'تفاح', weight: '1 كجم', unit: 'كرتون', price: 10.5 },
  { id: '2', name: 'موز', weight: '1 كجم', unit: 'سلة', price: 8.4 },
  { id: '3', name: 'حليب', weight: '2 لتر', unit: 'زجاجة', price: 15 },
];

export default function App() {
  const [products] = useState<Product[]>(sampleProducts);
  const [query, setQuery] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim();
    return products.filter((p) => p.name.includes(q));
  }, [products, query]);

  const inc = (id: string) => {
    setQtyMap((m) => ({ ...m, [id]: (m[id] ?? 0) + 1 }));
  };

  const dec = (id: string) => {
    setQtyMap((m) => {
      const next = Math.max(0, (m[id] ?? 0) - 1);
      return { ...m, [id]: next };
    });
  };

  const total = useMemo(() => {
    return filtered.reduce((acc, p) => {
      const qty = qtyMap[p.id] ?? 0;
      return acc + p.price * qty;
    }, 0);
  }, [filtered, qtyMap]);

  const renderItem = ({ item }: { item: Product }) => {
    const qty = qtyMap[item.id] ?? 0;
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{item.price.toFixed(2)} د.إ</Text>
        </View>
        <View style={styles.metaRow}>
          {!!item.weight && <Text style={styles.meta}>الوزن: {item.weight}</Text>}
          {!!item.unit && <Text style={styles.meta}>الوحدة: {item.unit}</Text>}
        </View>
        <View style={styles.qtyRow}>
          <Pressable
            onPress={() => dec(item.id)}
            style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
            disabled={qty === 0}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{qty}</Text>
          <Pressable onPress={() => inc(item.id)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>＋</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="ابحث عن منتج…"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          textAlign="right"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating Cart Bar */}
      <View style={styles.cartBar}>
        <Text style={styles.cartTotal}>المجموع: {total.toFixed(2)} د.إ</Text>
        <Pressable style={[styles.cartBtn, total === 0 && styles.cartBtnDisabled]} disabled={total === 0}>
          <Text style={styles.cartBtnText}>إتمام الطلب</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '600', writingDirection: 'rtl', flex: 1, paddingStart: 8 },
  price: { fontSize: 16, writingDirection: 'rtl', color: '#111' },
  metaRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 6 },
  meta: { fontSize: 14, color: '#444', writingDirection: 'rtl' },
  qtyRow: {
    marginTop: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#111',
  },
  qtyBtnDisabled: { opacity: 0.45 },
  qtyBtnText: { color: '#fff', fontSize: 26, lineHeight: 26, marginTop: -2 },
  qtyValue: { minWidth: 36, textAlign: 'center', fontSize: 18 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cartTotal: { fontSize: 18, fontWeight: '700' },
  cartBtn: {
    backgroundColor: '#0a7f5a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cartBtnDisabled: { opacity: 0.45 },
  cartBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
