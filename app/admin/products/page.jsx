// app/admin/products/page.jsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/app/components/Toast';
import { useConfirm } from '@/app/components/ConfirmDialog';
import { ArrowLeft } from 'lucide-react';

// ── Shared inline style tokens ───────────────────────────────────
const C = {
  bg: '#f5f5f7',
  card: '#ffffff',
  border: '#e8e8ed',
  text: '#1d1d1f',
  muted: '#86868b',
  blue: '#0071e3',
  blueHover: '#0077ed',
  blueBg: 'rgba(0,113,227,0.08)',
  red: '#ff453a',
  redBg: 'rgba(255,69,58,0.08)',
  green: '#30d158',
  greenBg: 'rgba(48,209,88,0.1)',
  orange: '#ff9f0a',
  orangeBg: 'rgba(255,159,10,0.1)',
  inputBorder: '#d2d2d7',
};

const inputStyle = {
  width: '100%', padding: '0.65rem 0.875rem', borderRadius: '10px',
  border: `1px solid ${C.inputBorder}`, background: C.card, color: C.text,
  fontSize: '0.9375rem', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const sectionStyle = {
  background: C.bg, borderRadius: '12px',
  border: `1px solid ${C.border}`, padding: '1rem',
};

const smInputStyle = {
  padding: '0.5rem 0.625rem', borderRadius: '8px',
  border: `1px solid ${C.inputBorder}`, background: C.card,
  color: C.text, fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none',
};

// ── Spec templates ───────────────────────────────────────────────
const DEFAULT_SPEC_FIELDS = {
  iPhone: [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. A18 Pro' },
    { key: 'mainCamera', label: 'Main Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 48MP, f/1.8' },
    { key: 'ultraWideCamera', label: 'Ultra Wide Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 12MP, f/2.2' },
    { key: 'telephotoCamera', label: 'Telephoto Camera', type: 'text', unit: '', placeholder: 'e.g. 12MP, f/2.8, 5x optical zoom' },
    { key: 'frontCamera', label: 'Front Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 12MP, f/1.9' },
    { key: 'displaySize', label: 'Display Size', type: 'text', unit: 'inch', placeholder: 'e.g. 6.1' },
    { key: 'displayType', label: 'Display Type', type: 'text', unit: '', placeholder: 'e.g. Super Retina XDR OLED' },
    { key: 'displayResolution', label: 'Display Resolution', type: 'text', unit: '', placeholder: 'e.g. 2556×1179 at 460 ppi' },
    { key: 'refreshRate', label: 'Refresh Rate', type: 'text', unit: 'Hz', placeholder: 'e.g. 60' },
    { key: 'battery', label: 'Battery Life', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 22 hours' },
    { key: 'chargingSpeed', label: 'Charging Speed', type: 'text', unit: '', placeholder: 'e.g. 20W wired, MagSafe 15W' },
    { key: 'os', label: 'Operating System', type: 'text', unit: '', placeholder: 'e.g. iOS 18' },
    { key: 'connectivity', label: 'Connectivity', type: 'text', unit: '', placeholder: 'e.g. 5G, Wi-Fi 6E, Bluetooth 5.3' },
    { key: 'simCard', label: 'SIM Card', type: 'text', unit: '', placeholder: 'e.g. Dual eSIM' },
    { key: 'waterResistance', label: 'Water Resistance', type: 'text', unit: '', placeholder: 'e.g. IP68' },
  ],
  iPad: [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. Apple M2' },
    { key: 'mainCamera', label: 'Main Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 12MP, f/1.8' },
    { key: 'ultraWideCamera', label: 'Ultra Wide Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 12MP, f/2.4' },
    { key: 'frontCamera', label: 'Front Camera', type: 'text', unit: 'MP', placeholder: 'e.g. 12MP, f/2.0' },
    { key: 'displaySize', label: 'Display Size', type: 'text', unit: 'inch', placeholder: 'e.g. 11' },
    { key: 'displayType', label: 'Display Type', type: 'text', unit: '', placeholder: 'e.g. Liquid Retina' },
    { key: 'displayResolution', label: 'Display Resolution', type: 'text', unit: '', placeholder: 'e.g. 2388×1668 at 264 ppi' },
    { key: 'refreshRate', label: 'Refresh Rate', type: 'text', unit: 'Hz', placeholder: 'e.g. 60' },
    { key: 'battery', label: 'Battery Life', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 10 hours' },
    { key: 'connectivity', label: 'Connectivity', type: 'text', unit: '', placeholder: 'e.g. Wi-Fi 6E, Bluetooth 5.3' },
    { key: 'os', label: 'Operating System', type: 'text', unit: '', placeholder: 'e.g. iPadOS 18' },
  ],
  MacBook: [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. Apple M3 Pro' },
    { key: 'cpu', label: 'CPU Cores', type: 'text', unit: '', placeholder: 'e.g. 12-core CPU' },
    { key: 'gpu', label: 'GPU Cores', type: 'text', unit: '', placeholder: 'e.g. 18-core GPU' },
    { key: 'ram', label: 'RAM', type: 'text', unit: 'GB', placeholder: 'e.g. 16' },
    { key: 'displaySize', label: 'Display Size', type: 'text', unit: 'inch', placeholder: 'e.g. 14.2' },
    { key: 'displayType', label: 'Display Type', type: 'text', unit: '', placeholder: 'e.g. Liquid Retina XDR' },
    { key: 'displayResolution', label: 'Display Resolution', type: 'text', unit: '', placeholder: 'e.g. 3024×1964' },
    { key: 'battery', label: 'Battery Life', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 18 hours' },
    { key: 'ports', label: 'Ports', type: 'text', unit: '', placeholder: 'e.g. 3x Thunderbolt 4, HDMI, SD card' },
    { key: 'camera', label: 'Camera', type: 'text', unit: '', placeholder: 'e.g. 1080p FaceTime HD' },
    { key: 'os', label: 'Operating System', type: 'text', unit: '', placeholder: 'e.g. macOS Sequoia' },
    { key: 'weight', label: 'Weight', type: 'text', unit: 'kg', placeholder: 'e.g. 1.61' },
  ],
  'Apple Watch': [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. Apple S9 SiP' },
    { key: 'displaySize', label: 'Display Size', type: 'text', unit: 'mm', placeholder: 'e.g. 45' },
    { key: 'displayType', label: 'Display Type', type: 'text', unit: '', placeholder: 'e.g. Always-On Retina LTPO OLED' },
    { key: 'battery', label: 'Battery Life', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 18 hours' },
    { key: 'waterResistance', label: 'Water Resistance', type: 'text', unit: '', placeholder: 'e.g. 50 metres' },
    { key: 'connectivity', label: 'Connectivity', type: 'text', unit: '', placeholder: 'e.g. LTE, Wi-Fi, Bluetooth 5.3' },
    { key: 'sensors', label: 'Sensors', type: 'text', unit: '', placeholder: 'e.g. Blood Oxygen, ECG, Temperature' },
    { key: 'os', label: 'Operating System', type: 'text', unit: '', placeholder: 'e.g. watchOS 11' },
  ],
  AirPods: [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. Apple H2' },
    { key: 'anc', label: 'Active Noise Cancellation', type: 'text', unit: '', placeholder: 'e.g. Yes' },
    { key: 'battery', label: 'Earbuds Battery', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 6 hours' },
    { key: 'totalBattery', label: 'Total Battery (with case)', type: 'text', unit: 'hrs', placeholder: 'e.g. Up to 30 hours' },
    { key: 'connectivity', label: 'Connectivity', type: 'text', unit: '', placeholder: 'e.g. Bluetooth 5.3' },
    { key: 'waterResistance', label: 'Water Resistance', type: 'text', unit: '', placeholder: 'e.g. IPX4' },
    { key: 'audio', label: 'Audio Features', type: 'text', unit: '', placeholder: 'e.g. Spatial Audio, Adaptive EQ' },
  ],
  'Apple TV': [
    { key: 'chip', label: 'Chip', type: 'text', unit: '', placeholder: 'e.g. Apple A15 Bionic' },
    { key: 'resolution', label: 'Resolution', type: 'text', unit: '', placeholder: 'e.g. 4K HDR' },
    { key: 'frameRate', label: 'Frame Rate', type: 'text', unit: 'fps', placeholder: 'e.g. Up to 60' },
    { key: 'audio', label: 'Audio', type: 'text', unit: '', placeholder: 'e.g. Dolby Atmos, Dolby Digital 7.1' },
    { key: 'connectivity', label: 'Connectivity', type: 'text', unit: '', placeholder: 'e.g. Wi-Fi 6, Bluetooth 5.0, HDMI 2.1' },
    { key: 'os', label: 'Operating System', type: 'text', unit: '', placeholder: 'e.g. tvOS 18' },
  ],
};

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('products');

  // ── Products ─────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatus, setStockStatus] = useState('all'); // all, instock, low, out
  const [stockFilterValue, setStockFilterValue] = useState('');
  const [stockFilterMode, setStockFilterMode] = useState('total'); // total, variant
  const [form, setForm] = useState({
    name: '', category: '', description: '', image: '',
    warranty: '', tags: [], colors: [], storageOptions: [], variants: [], specs: {},
  });
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000', image: '' });
  const [colorImageUploading, setColorImageUploading] = useState(false);
  const [newStorage, setNewStorage] = useState('');

  // ── Categories ───────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', specFields: [] });
  const [newSpecField, setNewSpecField] = useState({ key: '', label: '', type: 'text', unit: '', placeholder: '' });

  useEffect(() => {
    if (session?.user?.role !== 'admin') return;
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(console.error).finally(() => setProductsLoading(false));
  }, [session]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) { console.error(err); }
    finally { setCategoriesLoading(false); }
  };

  useEffect(() => { if (session?.user?.role === 'admin') fetchCategories(); }, [session]);

  const specFields = useMemo(() => {
    if (!form.category) return [];
    const saved = categories.find(c => c.name === form.category);
    return saved ? saved.specFields : (DEFAULT_SPEC_FIELDS[form.category] || []);
  }, [form.category, categories]);

  const productCategories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(), [products]);

  const LOW_STOCK_THRESHOLD = 5;

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Stock status filter
    const hasOut = p.variants?.some(v => v.stock === 0);
    const hasLow = p.variants?.some(v => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD);
    let matchStatus = true;
    if (stockStatus === 'out') matchStatus = hasOut;
    else if (stockStatus === 'low') matchStatus = hasLow && !hasOut;
    else if (stockStatus === 'instock') matchStatus = !hasOut && !hasLow;

    // Stock number filter
    let matchStockNum = true;
    const num = parseInt(stockFilterValue);
    if (!isNaN(num) && stockFilterValue !== '') {
      if (stockFilterMode === 'total') {
        const total = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        matchStockNum = total > num;
      } else {
        matchStockNum = p.variants?.some(v => v.stock > num);
      }
    }

    return matchCat && matchSearch && matchStatus && matchStockNum;
  }), [products, selectedCategory, searchQuery, stockStatus, stockFilterValue, stockFilterMode]);

  const generateSKU = (name, color, storage) => {
    const n = name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 10);
    const c = color.toUpperCase().replace(/\s+/g, '').slice(0, 5);
    const s = storage.toUpperCase().replace(/\s+/g, '');
    return `${n}-${c}-${s}`;
  };

  const handleNameChange = (value) => {
    setForm(prev => ({ ...prev, name: value, variants: prev.variants.map(v => ({ ...v, sku: generateSKU(value, v.color, v.storage) })) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Upload failed'); return; }
      setForm(prev => ({ ...prev, image: data.url }));
    } catch (err) { showToast(err.message); }
    finally { setUploading(false); }
  };

  const addColor = () => {
    if (!newColor.name.trim()) { showToast('Color name is required'); return; }
    if (form.colors.some(c => c.name.toLowerCase() === newColor.name.toLowerCase())) { showToast('Color already exists'); return; }
    const c = { name: newColor.name, hex: newColor.hex, image: newColor.image || '' };
    const newVariants = form.storageOptions.map(s => ({ color: c.name, storage: s, sku: generateSKU(form.name, c.name, s), price: 0, stock: 0 }));
    setForm(prev => ({ ...prev, colors: [...prev.colors, c], variants: [...prev.variants, ...newVariants] }));
    setNewColor({ name: '', hex: '#000000', image: '' });
  };

  const handleColorImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setColorImageUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Upload failed'); return; }
      setNewColor(prev => ({ ...prev, image: data.url }));
    } catch (err) { showToast(err.message); }
    finally { setColorImageUploading(false); }
  };

  const removeColor = (i) => {
    const removed = form.colors[i].name;
    setForm(prev => ({ ...prev, colors: prev.colors.filter((_, idx) => idx !== i), variants: prev.variants.filter(v => v.color !== removed) }));
  };

  const addStorage = () => {
    if (!newStorage.trim()) { showToast('Storage size is required'); return; }
    if (form.storageOptions.includes(newStorage.trim())) { showToast('Storage option already exists'); return; }
    const s = newStorage.trim();
    const newVariants = form.colors.map(c => ({ color: c.name, storage: s, sku: generateSKU(form.name, c.name, s), price: 0, stock: 0 }));
    setForm(prev => ({ ...prev, storageOptions: [...prev.storageOptions, s], variants: [...prev.variants, ...newVariants] }));
    setNewStorage('');
  };

  const removeStorage = (i) => {
    const removed = form.storageOptions[i];
    setForm(prev => ({ ...prev, storageOptions: prev.storageOptions.filter((_, idx) => idx !== i), variants: prev.variants.filter(v => v.storage !== removed) }));
  };

  const getVariant = (colorName, storage) =>
    form.variants.find(v => v.color === colorName && v.storage === storage) ||
    { color: colorName, storage, sku: generateSKU(form.name, colorName, storage), price: 0, stock: 0 };

  const updateVariant = (colorName, storage, field, value) => {
    setForm(prev => {
      const exists = prev.variants.some(v => v.color === colorName && v.storage === storage);
      const val = field === 'price' || field === 'stock' ? parseInt(value) || 0 : value;
      const updated = exists
        ? prev.variants.map(v => v.color === colorName && v.storage === storage ? { ...v, [field]: val } : v)
        : [...prev.variants, { color: colorName, storage, sku: generateSKU(prev.name, colorName, storage), price: 0, stock: 0, [field]: val }];
      return { ...prev, variants: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image) { showToast('Please upload a product image'); return; }
    if (!form.name.trim()) { showToast('Product name is required'); return; }
    if (!form.category.trim()) { showToast('Please select a category'); return; }
    if (!form.description.trim()) { showToast('Product description is required'); return; }
    if (!form.warranty.trim()) { showToast('Warranty information is required'); return; }
    if (form.colors.length === 0) { showToast('Add at least one color'); return; }
    if (form.storageOptions.length === 0) { showToast('Add at least one storage option'); return; }

    const allCombos = form.colors.flatMap(c => form.storageOptions.map(s => ({ color: c.name, storage: s })));
    const missingPrice = allCombos.filter(({ color, storage }) => { const v = form.variants.find(v => v.color === color && v.storage === storage); return !v || !v.price || v.price <= 0; });
    if (missingPrice.length > 0) { showToast(`Price required for: ${missingPrice.map(v => `${v.color}/${v.storage}`).join(', ')}`); return; }

    const missingStock = allCombos.filter(({ color, storage }) => { const v = form.variants.find(v => v.color === color && v.storage === storage); return !v || v.stock < 0; });
    if (missingStock.length > 0) { showToast(`Stock required for: ${missingStock.map(v => `${v.color}/${v.storage}`).join(', ')}`); return; }

    const allSKUs = form.variants.map(v => v.sku);
    const dups = allSKUs.filter((sku, i) => allSKUs.indexOf(sku) !== i);
    if (dups.length > 0) { showToast(`Duplicate SKUs: ${[...new Set(dups)].join(', ')}`); return; }

    if (specFields.length > 0) {
      const empty = specFields.filter(f => !form.specs[f.key]?.trim());
      if (empty.length > 0) { showToast(`Please fill in: ${empty.map(f => f.label).join(', ')}`); return; }
    }

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tags: form.tags.filter(Boolean) }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to save product right now'); return; }
      const r = await fetch('/api/products');
      const d = await r.json();
      setProducts(d.products || []);
      resetForm();
      setShowForm(false);
      showToast(editingId ? 'Product updated!' : 'Product created!', 'success');
    } catch (err) { showToast(err.message); }
  };

  const resetForm = () => {
    setForm({ name: '', category: '', description: '', image: '', warranty: '', tags: [], colors: [], storageOptions: [], variants: [], specs: {} });
    setEditingId(null); setNewColor({ name: '', hex: '#000000', image: '' }); setNewStorage('');
  };

  const handleEdit = (product) => {
    setForm({ name: product.name, category: product.category, description: product.description, image: product.image, warranty: product.warranty, tags: product.tags || [], colors: product.colors || [], storageOptions: product.storageOptions || [], variants: product.variants || [], specs: product.specs || {} });
    setEditingId(product._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!(await confirmAction({ title: 'Delete this product?', message: 'This cannot be undone.', confirmLabel: 'Delete' }))) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Delete failed'); return; }
      setProducts(products.filter(p => p._id !== id));
      showToast('Product deleted', 'success');
    } catch (err) { showToast(err.message); }
  };

  const openNewCategory = () => { setEditingCategory(null); setCategoryForm({ name: '', specFields: [] }); setNewSpecField({ key: '', label: '', type: 'text', unit: '', placeholder: '' }); setShowCategoryForm(true); };
  const openEditCategory = (cat) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, specFields: [...cat.specFields] }); setNewSpecField({ key: '', label: '', type: 'text', unit: '', placeholder: '' }); setShowCategoryForm(true); };
  const loadDefaultFields = (catName) => { const f = DEFAULT_SPEC_FIELDS[catName]; if (f) setCategoryForm(prev => ({ ...prev, specFields: [...f] })); };

  const addSpecField = () => {
    if (!newSpecField.key.trim() || !newSpecField.label.trim()) { showToast('Field key and label are required'); return; }
    if (categoryForm.specFields.some(f => f.key === newSpecField.key)) { showToast('Field key already exists'); return; }
    setCategoryForm(prev => ({ ...prev, specFields: [...prev.specFields, { ...newSpecField }] }));
    setNewSpecField({ key: '', label: '', type: 'text', unit: '', placeholder: '' });
  };

  const removeSpecField = async (key) => {
    if (!(await confirmAction(`Remove "${key}" field?`))) return;
    setCategoryForm(prev => ({ ...prev, specFields: prev.specFields.filter(f => f.key !== key) }));
  };

  const moveSpecField = (index, direction) => {
    const fields = [...categoryForm.specFields];
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    [fields[index], fields[target]] = [fields[target], fields[index]];
    setCategoryForm(prev => ({ ...prev, specFields: fields }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) { showToast('Category name is required'); return; }
    const url = editingCategory ? `/api/admin/categories/${editingCategory._id}` : '/api/admin/categories';
    const method = editingCategory ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Unable to save category right now'); return; }
      await fetchCategories(); setShowCategoryForm(false); setEditingCategory(null);
      showToast(editingCategory ? 'Category updated!' : 'Category created!', 'success');
    } catch (err) { showToast(err.message); }
  };

  const handleDeleteCategory = async (id) => {
    if (!(await confirmAction({ title: 'Delete this category?', message: 'This cannot be undone.', confirmLabel: 'Delete' }))) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Delete failed'); return; }
      await fetchCategories(); showToast('Category deleted', 'success');
    } catch (err) { showToast(err.message); }
  };

  if (status === 'loading' || productsLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>Loading...</div>;
  }

  return (
    <div className="admin-products-page" style={{ paddingTop: '2rem' }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-products-page h1 { font-size: 1.5rem !important; }
          .admin-products-page h2 { font-size: 1.125rem !important; }
          .admin-products-header { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .admin-products-form-grid { grid-template-columns: 1fr !important; }
          .admin-products-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .admin-products-table-wrap table { min-width: 600px; }
          .admin-categories-grid { grid-template-columns: 1fr !important; }
          .admin-spec-fields-grid { grid-template-columns: 1fr !important; }
          .admin-custom-field-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#0071e3', cursor: 'pointer', fontSize: '0.9375rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>
      {/* Header */}
      <div className="admin-products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
            Products & Categories
          </h1>
          <p style={{ color: C.muted, marginTop: '0.25rem', fontSize: '0.9375rem' }}>
            {activeTab === 'products' ? `${filteredProducts.length} of ${products.length} products` : `${categories.length} categories`}
          </p>
        </div>
        <button
          onClick={() => { if (activeTab === 'products') { resetForm(); setShowForm(!showForm); } else { showForm ? setShowCategoryForm(false) : openNewCategory(); } }}
          style={{ background: showForm || showCategoryForm ? C.bg : C.blue, color: showForm || showCategoryForm ? C.text : '#fff', border: showForm || showCategoryForm ? `1px solid ${C.border}` : 'none', borderRadius: '980px', padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {activeTab === 'products' ? (showForm ? '✕ Close' : '+ Add Product') : (showCategoryForm ? '✕ Close' : '+ Add Category')}
        </button>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: C.bg, borderRadius: '12px', padding: '4px', width: 'fit-content', border: `1px solid ${C.border}`, marginBottom: '1.5rem' }}>
        {['products', 'categories'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setShowForm(false); setShowCategoryForm(false); }}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '9px', fontSize: '0.9375rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeTab === tab ? C.blue : 'transparent', color: activeTab === tab ? '#fff' : C.muted, transition: 'all 0.15s ease' }}
          >
            {tab === 'products' ? `Products (${products.length})` : `Categories (${categories.length})`}
          </button>
        ))}
      </div>

      {/* ═══ PRODUCTS TAB ═══ */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Product Form */}
          {showForm && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Image Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Product Image</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <label style={{ flex: 1, display: 'block', border: `2px dashed ${C.border}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
                      <span style={{ fontSize: '0.9375rem', color: C.muted }}>{uploading ? 'Uploading...' : 'Click to upload or drag & drop'}</span>
                    </label>
                    {form.image && (
                      <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                        <Image src={form.image} alt="Preview" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + Category */}
                <div className="admin-products-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Product Name</label>
                    <input style={inputStyle} type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} required
                      onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Category</label>
                    {categories.length > 0 ? (
                      <select value={form.category} onChange={e => { setForm(prev => ({ ...prev, category: e.target.value, specs: {} })); }} required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                        <option value="">Select a category</option>
                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    ) : (
                      <input style={{ ...inputStyle, color: C.muted }} type="text" placeholder="No categories yet — create one first" disabled />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                {/* Tags + Warranty */}
                <div className="admin-products-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Tags (comma-separated)</label>
                    <input style={inputStyle} type="text" placeholder="New, Bestseller" value={form.tags.join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()) })}
                      onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Warranty</label>
                    <input style={inputStyle} type="text" placeholder="1 year warranty" value={form.warranty} onChange={e => setForm({ ...form, warranty: e.target.value })}
                      onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                  </div>
                </div>

                {/* Colors */}
                <div style={sectionStyle}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Colors</p>
                  {form.colors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {form.colors.map((color, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: C.card, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color.hex, flexShrink: 0, border: `1px solid ${C.border}` }} />
                          <span style={{ flex: 1, fontSize: '0.9375rem', color: C.text }}>{color.name}</span>
                          <label style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: `1px solid ${C.border}`, background: C.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                          }} title={color.image ? 'Change image' : 'Upload image'}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try {
                                const fd = new FormData(); fd.append('file', file);
                                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                const data = await res.json();
                                if (!res.ok) { showToast(data.error || 'Upload failed'); return; }
                                setForm(prev => ({
                                  ...prev,
                                  colors: prev.colors.map((c, idx) => idx === i ? { ...c, image: data.url } : c)
                                }));
                                showToast('Image uploaded', 'success');
                              } catch (err) { showToast(err.message); }
                            }} />
                            {color.image ? (
                              <Image src={color.image} alt={color.name} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1rem', color: C.blue, fontWeight: 300 }}>+</span>
                            )}
                          </label>
                          <span style={{ fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace' }}>{color.hex}</span>
                          <button type="button" onClick={() => removeColor(i)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'inherit' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input style={{ ...smInputStyle, flex: 1 }} type="text" placeholder="Color name (e.g., Space Black)" value={newColor.name} onChange={e => setNewColor({ ...newColor, name: e.target.value })} />
                    <input type="color" value={newColor.hex} onChange={e => setNewColor({ ...newColor, hex: e.target.value })} style={{ width: '44px', height: '38px', borderRadius: '8px', border: `1px solid ${C.border}`, cursor: 'pointer', padding: '2px' }} />
                    <label style={{ width: '40px', height: '40px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: colorImageUploading ? 'wait' : 'pointer', flexShrink: 0, overflow: 'hidden', position: 'relative' }} title="Upload color image">
                      <input type="file" accept="image/*" onChange={handleColorImageUpload} disabled={colorImageUploading} style={{ display: 'none' }} />
                      {newColor.image ? (
                        <Image src={newColor.image} alt="Color" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.25rem', color: colorImageUploading ? C.muted : C.blue, fontWeight: 300, lineHeight: 1 }}>{colorImageUploading ? '...' : '+'}</span>
                      )}
                    </label>
                    <button type="button" onClick={addColor} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Add</button>
                  </div>
                </div>

                {/* Storage */}
                <div style={sectionStyle}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Storage Options</p>
                  {form.storageOptions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {form.storageOptions.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: C.card, borderRadius: '980px', border: `1px solid ${C.border}`, fontSize: '0.875rem', color: C.text }}>
                          {s}
                          <button type="button" onClick={() => removeStorage(i)} aria-label={`Remove storage option ${s}`} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1, padding: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input style={{ ...smInputStyle, flex: 1 }} type="text" placeholder="e.g., 128GB, 256GB" value={newStorage} onChange={e => setNewStorage(e.target.value)} />
                    <button type="button" onClick={addStorage} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Add</button>
                  </div>
                </div>

                {/* Variant Matrix */}
                {form.colors.length > 0 && form.storageOptions.length > 0 && (
                  <div style={sectionStyle}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Variant Pricing & Stock</p>
                    <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.75rem' }}>Fill in price and stock for each color × storage combination. SKUs are auto-generated.</p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            {['Color', 'Storage', 'SKU', 'Price (₦)', 'Stock'].map(h => (
                              <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {form.colors.map(color => form.storageOptions.map(storage => {
                            const variant = getVariant(color.name, storage);
                            return (
                              <tr key={`${color.name}-${storage}`}>
                                <td style={{ padding: '0.625rem 0.75rem', borderBottom: `1px solid ${C.bg}` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color.hex, flexShrink: 0, border: `1px solid ${C.border}` }} />
                                    <span style={{ fontSize: '0.875rem', color: C.text }}>{color.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.bg}` }}>{storage}</td>
                                <td style={{ padding: '0.625rem 0.75rem', borderBottom: `1px solid ${C.bg}` }}>
                                  <input type="text" value={variant.sku} onChange={e => updateVariant(color.name, storage, 'sku', e.target.value)}
                                    style={{ ...smInputStyle, width: '180px', fontFamily: 'monospace', fontSize: '0.75rem' }} />
                                </td>
                                <td style={{ padding: '0.625rem 0.75rem', borderBottom: `1px solid ${C.bg}` }}>
                                  <input type="number" placeholder="0" min="1" value={variant.price || ''} onChange={e => updateVariant(color.name, storage, 'price', e.target.value)}
                                    style={{ ...smInputStyle, width: '110px' }} />
                                </td>
                                <td style={{ padding: '0.625rem 0.75rem', borderBottom: `1px solid ${C.bg}` }}>
                                  <input type="number" placeholder="0" min="0" value={variant.stock || ''} onChange={e => updateVariant(color.name, storage, 'stock', e.target.value)}
                                    style={{ ...smInputStyle, width: '80px' }} />
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Structured Specs */}
                {specFields.length > 0 && (
                  <div style={sectionStyle}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Specifications — {form.category}</p>
                    <p style={{ fontSize: '0.8125rem', color: C.muted, margin: '0 0 0.75rem' }}>All fields are required.</p>
                    <div className="admin-spec-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {specFields.map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: C.muted, marginBottom: '0.375rem' }}>
                            {field.label}{field.unit && <span style={{ color: C.muted, fontWeight: 400 }}> ({field.unit})</span>}
                          </label>
                          <input type={field.type} placeholder={field.placeholder} value={form.specs[field.key] || ''}
                            onChange={e => setForm(prev => ({ ...prev, specs: { ...prev.specs, [field.key]: e.target.value } }))}
                            style={{ ...smInputStyle, width: '100%' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" style={{ flex: 1, background: C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {editingId ? 'Update Product' : 'Create Product'}
                  </button>
                  <button type="button" onClick={() => { resetForm(); setShowForm(false); }} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '980px', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Row 1: Category tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>Category</span>
              {['all', ...productCategories].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  style={{ padding: '0.375rem 0.875rem', borderRadius: '980px', fontSize: '0.8125rem', fontWeight: 500, border: `1px solid ${selectedCategory === cat ? C.blue : C.border}`, background: selectedCategory === cat ? C.blue : C.card, color: selectedCategory === cat ? '#fff' : C.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                  {cat === 'all' ? `All (${products.length})` : `${cat} (${products.filter(p => p.category === cat).length})`}
                </button>
              ))}
            </div>

            {/* Row 2: Stock status tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>Stock</span>
              {[
                { value: 'all', label: 'All' },
                { value: 'instock', label: 'In Stock' },
                { value: 'low', label: 'Low Stock' },
                { value: 'out', label: 'Out of Stock' },
              ].map(s => (
                <button key={s.value} onClick={() => setStockStatus(s.value)}
                  style={{ padding: '0.375rem 0.875rem', borderRadius: '980px', fontSize: '0.8125rem', fontWeight: 500, border: `1px solid ${stockStatus === s.value ? C.blue : C.border}`, background: stockStatus === s.value ? C.blue : C.card, color: stockStatus === s.value ? '#fff' : C.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Row 3: Search + Stock number filter */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="Search by product name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, maxWidth: '280px' }}
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />

              {/* Stock number filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.375rem 0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: C.muted, whiteSpace: 'nowrap' }}>Stock &gt;</span>
                <input type="number" min="0" placeholder="0" value={stockFilterValue} onChange={e => setStockFilterValue(e.target.value)}
                  style={{ width: '64px', border: 'none', outline: 'none', fontSize: '0.875rem', color: C.text, fontFamily: 'inherit', background: 'transparent' }} />
                <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  {['total', 'variant'].map(mode => (
                    <button key={mode} onClick={() => setStockFilterMode(mode)}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: stockFilterMode === mode ? C.blue : C.bg, color: stockFilterMode === mode ? '#fff' : C.muted, transition: 'all 0.15s' }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                {stockFilterValue && (
                  <button onClick={() => setStockFilterValue('')} aria-label="Clear stock filter" style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>✕</button>
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="admin-products-table-wrap" style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: C.muted }}>
                {searchQuery || selectedCategory !== 'all' || stockStatus !== 'all' || stockFilterValue ? 'No products match your filters.' : 'No products yet. Add your first product above.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {['Product', 'Category', 'Variants', 'Stock', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                    const variantCount = product.variants?.length || 0;
                    const isExpanded = expandedProduct === product._id;
                    const LOW_STOCK = 5;
                    const hasOutVariant = product.variants?.some(v => v.stock === 0);
                    const hasLowVariant = product.variants?.some(v => v.stock > 0 && v.stock <= LOW_STOCK);
                    const stockColor = totalStock > 10 ? C.green : totalStock > 0 ? C.orange : C.red;
                    const stockBg = totalStock > 10 ? C.greenBg : totalStock > 0 ? C.orangeBg : C.redBg;
                    return (
                      <React.Fragment key={product._id}>
                        <tr key={product._id}
                          onClick={() => setExpandedProduct(isExpanded ? null : product._id)}
                          style={{ borderBottom: isExpanded ? 'none' : `1px solid ${C.bg}`, cursor: 'pointer', background: isExpanded ? C.bg : 'transparent', transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.bg; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ color: C.muted, fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                              {product.image && (
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                                  <Image src={product.image} alt={product.name} width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                              <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: C.text }}>{product.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.9375rem', color: C.muted }}>{product.category}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.9375rem', color: C.muted }}>{variantCount} variant{variantCount !== 1 ? 's' : ''}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ padding: '0.2rem 0.625rem', borderRadius: '980px', fontSize: '0.75rem', fontWeight: 600, background: stockBg, color: stockColor }}>
                                {totalStock}
                              </span>
                              {hasOutVariant && (
                                <span title="One or more variants are out of stock" style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.red, display: 'inline-block', flexShrink: 0 }} />
                              )}
                              {!hasOutVariant && hasLowVariant && (
                                <span title="One or more variants are low on stock" style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.orange, display: 'inline-block', flexShrink: 0 }} />
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleEdit(product)} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Edit</button>
                              <button onClick={() => handleDelete(product._id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded variant rows */}
                        {isExpanded && (
                          <tr key={`${product._id}-expanded`}>
                            <td colSpan={5} style={{ padding: '0 1rem 1rem', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                              <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: C.card }}>
                                      {['Color', 'Storage', 'SKU', 'Stock', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.variants?.map((v, i) => {
                                      const color = product.colors?.find(c => c.name === v.color);
                                      const isLow = v.stock > 0 && v.stock <= LOW_STOCK;
                                      const isOut = v.stock === 0;
                                      return (
                                        <tr key={i} style={{ background: i % 2 === 0 ? C.card : C.bg }}>
                                          <td style={{ padding: '0.625rem 0.875rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                              {color && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: color.hex, border: `1px solid ${C.border}`, flexShrink: 0 }} />}
                                              <span style={{ fontSize: '0.875rem', color: C.text }}>{v.color}</span>
                                            </div>
                                          </td>
                                          <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: C.text, fontWeight: 500 }}>{v.storage}</td>
                                          <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.75rem', color: C.muted, fontFamily: 'monospace' }}>{v.sku}</td>
                                          <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.875rem', fontWeight: 600, color: isOut ? C.red : isLow ? C.orange : C.text }}>{v.stock}</td>
                                          <td style={{ padding: '0.625rem 0.875rem' }}>
                                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '980px', fontSize: '0.6875rem', fontWeight: 600, background: isOut ? C.redBg : isLow ? C.orangeBg : C.greenBg, color: isOut ? C.red : isLow ? C.orange : C.green }}>
                                              {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══ CATEGORIES TAB ═══ */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category Form */}
          {showCategoryForm && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Category Name</label>
                  <input style={inputStyle} type="text" placeholder="e.g., iPhone" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required
                    onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>Load Apple Template</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.keys(DEFAULT_SPEC_FIELDS).map(key => (
                      <button key={key} type="button" onClick={() => loadDefaultFields(key)}
                        style={{ padding: '0.375rem 0.75rem', borderRadius: '980px', fontSize: '0.8125rem', border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}>
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={sectionStyle}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: C.text, margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Spec Fields ({categoryForm.specFields.length})
                  </p>
                  {categoryForm.specFields.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: C.muted, margin: 0 }}>No spec fields yet. Load a template above or add fields manually.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                      {categoryForm.specFields.map((field, i) => (
                        <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: C.card, borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '0.8125rem' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: C.text }}>{field.label}</span>
                            <span style={{ color: C.muted, marginLeft: '0.5rem' }}>({field.key})</span>
                            {field.unit && <span style={{ color: C.muted, marginLeft: '0.25rem' }}>· {field.unit}</span>}
                          </div>
                          <button type="button" onClick={() => moveSpecField(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: C.muted, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '0.875rem' }}>↑</button>
                          <button type="button" onClick={() => moveSpecField(i, 1)} disabled={i === categoryForm.specFields.length - 1} style={{ background: 'none', border: 'none', color: C.muted, cursor: i === categoryForm.specFields.length - 1 ? 'not-allowed' : 'pointer', opacity: i === categoryForm.specFields.length - 1 ? 0.3 : 1, fontSize: '0.875rem' }}>↓</button>
                          <button type="button" onClick={() => removeSpecField(field.key)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'inherit' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.muted, margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Add Custom Field</p>
                    <div className="admin-custom-field-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {[
                        { placeholder: 'Key (e.g. chip)', field: 'key' },
                        { placeholder: 'Label (e.g. Chip)', field: 'label' },
                        { placeholder: 'Unit', field: 'unit' },
                        { placeholder: 'Placeholder text', field: 'placeholder' },
                      ].map(({ placeholder, field }) => (
                        <input key={field} type="text" placeholder={placeholder} value={newSpecField[field]} onChange={e => setNewSpecField({ ...newSpecField, [field]: e.target.value })} style={smInputStyle} />
                      ))}
                    </div>
                    <button type="button" onClick={addSpecField} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Add Field
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" style={{ flex: 1, background: C.blue, color: '#fff', border: 'none', borderRadius: '980px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '980px', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Grid */}
          {categoriesLoading ? (
            <p style={{ color: C.muted }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: C.muted, background: C.card, borderRadius: '18px', border: `1px solid ${C.border}` }}>
              No categories yet. Create your first category to get started.
            </div>
          ) : (
            <div className="admin-categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {categories.map(cat => (
                <div key={cat._id} style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: C.text, margin: '0 0 0.25rem' }}>{cat.name}</h3>
                      <p style={{ fontSize: '0.8125rem', color: C.muted, margin: 0 }}>
                        {cat.specFields.length} spec field{cat.specFields.length !== 1 ? 's' : ''} · {products.filter(p => p.category === cat.name).length} product{products.filter(p => p.category === cat.name).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => openEditCategory(cat)} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Edit</button>
                      <button onClick={() => handleDeleteCategory(cat._id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Delete</button>
                    </div>
                  </div>
                  {cat.specFields.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {cat.specFields.map(f => (
                        <span key={f.key} style={{ padding: '0.2rem 0.5rem', borderRadius: '980px', fontSize: '0.75rem', background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>{f.label}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
