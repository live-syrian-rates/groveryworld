import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  I18nManager,
  Pressable,
  TextInput,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';

// Ensure RTL layout for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ==== Types (keys match your CSV/JSON field names) ====
// Example product shape based on your API response
// { "name (اسم المادة)": "تفاح", "price (جملة الجملة (دولار))": "2.50", "weight (الوزن)": "1 كجم", "unit (الوحدة)": "كرتون" }
type Product = {
  [key: string]: any;
  'name (اسم المادة)': string;
  'price (جملة الجملة (دولار))'?: string | number;
  'weight (الوزن)'?: string;
  'unit (الوحدة)'?: string;
};

// Replace with your target WhatsApp number in international format without '+' or leading zeros
// مثال: الإمارات: 9715XXXXXXXX (ابدأ برمز الدولة)
const WHATSAPP_PHONE = '971559247026';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({}); // key by product index string

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Keep your working endpoint here
        const res = await fetch('http://10.220.114.91:5000/products');
        const data = (await res.json()) as Product[];
        if (!isMounted.current) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message ?? 'فشل تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Helpers ----
  // Define helpers BEFORE any useMemo that calls them
  const keyForIndex = (index: number) => String(index);
  const getPrice = (p: Product) => {
    const raw = p['price (جملة الجملة (دولار))'];
    const num = Number(raw ?? 0);
    return Number.isFinite(num) ? num : 0;
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim();
    return products.filter((p) =>
      String(p['name (اسم المادة)'] ?? '').toLowerCase().includes(q.toLowerCase())
    );
  }, [products, query]);

  const total = useMemo(() => {
    return filtered.reduce((acc, p, idx) => {
      const key = keyForIndex(idx);
      const qty = qtyMap[key] ?? 0;
      if (!qty) return acc;
      return acc + qty * getPrice(p);
    }, 0);
  }, [filtered, qtyMap]);

  const inc = (index: number) => {
    const k = keyForIndex(index);
    setQtyMap((m) => ({ ...m, [k]: (m[k] ?? 0) + 1 }));
  };
  const dec = (index: number) => {
    const k = keyForIndex(index);
    setQtyMap((m) => {
      const next = Math.max(0, (m[k] ?? 0) - 1);
      return { ...m, [k]: next };
    });
  };

  const clearCart = () => setQtyMap({});

  // Build a readable Arabic bill
  const buildBillText = (): string => {
    const lines: string[] = [];
    lines.push('فاتورة الطلب:\n');
    filtered.forEach((p, idx) => {
      const k = keyForIndex(idx);
      const qty = qtyMap[k] ?? 0;
      if (!qty) return;
      const name = p['name (اسم المادة)'];
      const price = getPrice(p);
      const lineTotal = price * qty;
      const unit = p['unit (الوحدة)'] ? ` (${p['unit (الوحدة)']})` : '';
      lines.push(`• ${name}${unit} — ${qty} × ${price.toFixed(2)} = ${lineTotal.toFixed(2)} دولار`);
    });
    lines.push('\nالمجموع: ' + total.toFixed(2) + ' دولار');
    lines.push('\nالاسم: __________');
    lines.push('الهاتف: __________');
    lines.push('العنوان: __________');
    return lines.join('\n');
  };

  const sendWhatsApp = async () => {
    const text = encodeURIComponent(buildBillText());
    const deepLink = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${text}`;
    const webLink = `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;

    try {
      const supported = await Linking.canOpenURL('whatsapp://send');
      if (supported) {
        await Linking.openURL(deepLink);
      } else {
        await Linking.openURL(webLink);
      }
    } catch (e) {
      // Fallback to web in any error
      await Linking.openURL(webLink);
    }
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const name = item['name (اسم المادة)'] ?? '';
    const price = getPrice(item);
    const weight = item['weight (الوزن)'] ?? '';
    const unit = item['unit (الوحدة)'] ?? '';
    const k = keyForIndex(index);
    const qty = qtyMap[k] ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.price}>{price.toFixed(2)} دولار</Text>
        </View>
        <View style={styles.metaRow}>
          {!!weight && <Text style={styles.meta}>الوزن: {weight}</Text>}
          {!!unit && <Text style={styles.meta}>الوحدة: {unit}</Text>}
        </View>
        <View style={styles.qtyRow}>
          <Pressable onPress={() => dec(index)} style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{qty}</Text>
          <Pressable onPress={() => inc(index)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>＋</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>جاري التحميل…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>حدث خطأ: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="ابحث عن منتج…"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Sticky cart bar */}
      <View style={styles.cartBar}>
        <View>
          <Text style={styles.cartSummaryLabel}>إجمالي السلة</Text>
          <Text style={styles.cartSummaryValue}>{total.toFixed(2)} دولار</Text>
        </View>
        <View style={styles.cartActions}>
          <Pressable onPress={clearCart} style={[styles.secondaryBtn, { marginStart: 8 }]}>
            <Text style={styles.secondaryBtnText}>تفريغ</Text>
          </Pressable>
          <Pressable
            onPress={sendWhatsApp}
            style={[styles.primaryBtn, total === 0 && styles.primaryBtnDisabled]}
            disabled={total === 0}
          >
            <Text style={styles.primaryBtnText}>أرسل الطلب عبر واتساب</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginTop: 8, fontSize: 16 },
  errorText: { color: '#B00020', fontSize: 16 },

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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '600', writingDirection: 'rtl', flex: 1, paddingEnd: 8 },
  price: { fontSize: 16, writingDirection: 'rtl', color: '#111' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { fontSize: 14, color: '#444', writingDirection: 'rtl' },

  qtyRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartSummaryLabel: { fontSize: 12, color: '#666' },
  cartSummaryValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  cartActions: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: {
    backgroundColor: '#0a7f5a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#efefef',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryBtnText: { color: '#111', fontSize: 14, fontWeight: '600' },
});
