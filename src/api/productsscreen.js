import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://10.220.114.91:5000/products');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        if (!Array.isArray(data)) throw new Error('Expected array');

        const cleaned = data.map(item => ({
          name: item.name || '',
          price: parseFloat(item.price) || 0,
          weight: item.weight || '',
          unit: item.unit || ''
        }));

        setProducts(cleaned);
        setError('');
      } catch (err) {
        console.error('Fetch failed:', err);
        setError('فشل تحميل المنتجات. حاول مرة أخرى.');
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>{item.weight} — {item.unit}</Text>
      <Text style={styles.price}>{item.price} درهم</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => String(index)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  card: { marginBottom: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  details: { fontSize: 14, color: '#555' },
  price: { fontSize: 16, color: '#007700', marginTop: 4 },
  error: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 20 }
});

export default ProductsScreen;
