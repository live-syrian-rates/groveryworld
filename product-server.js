const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'products.json');

// Load product data from file
function loadProducts() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const products = JSON.parse(raw);

    // Clean `[cite: ...]` from all fields
    return products.map(p => ({
      name: (p.name || '').replace(/\s*

\[cite:.*?\]

\s*/g, '').trim(),
      price: parseFloat(p.price) || 0,
      weight: (p.weight || '').replace(/\s*

\[cite:.*?\]

\s*/g, '').trim(),
      unit: (p.unit || '').replace(/\s*

\[cite:.*?\]

\s*/g, '').trim()
    }));
  } catch (err) {
    console.error('❌ Failed to load products:', err);
    return [];
  }
}

app.get('/products', (req, res) => {
  const products = loadProducts();
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`✅ Product server running at http://localhost:${PORT}`);
});
