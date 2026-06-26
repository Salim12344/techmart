import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const ProductSchema = new mongoose.Schema({
  name: String, category: String, description: String, image: String,
  warranty: String, tags: [String],
  colors: [{ name: String, hex: String, image: String }],
  storageOptions: [String],
  variants: [{ color: String, storage: String, sku: String, price: Number, stock: Number }],
  specs: mongoose.Schema.Types.Mixed,
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

const Product = mongoose.models.product || mongoose.model('product', ProductSchema);

const products = [
  {
    name: 'iPhone 16 Pro Max',
    category: 'iPhone',
    description: 'iPhone 16 Pro Max features a stunning 6.9-inch Super Retina XDR display, the powerful A18 Pro chip, a 48MP camera system with 5x optical zoom, and all-day battery life. Built with titanium for a premium, lightweight feel.',
    warranty: '1 Year Apple Warranty',
    tags: ['New', 'Bestseller', 'Pro'],
    colors: [
      { name: 'Desert Titanium', hex: '#BFA48F', image: '' },
      { name: 'Natural Titanium', hex: '#C2BCB2', image: '' },
      { name: 'White Titanium', hex: '#F2F1ED', image: '' },
      { name: 'Black Titanium', hex: '#3C3C3D', image: '' },
    ],
    storageOptions: ['256GB', '512GB', '1TB'],
    specs: {
      chip: 'A18 Pro',
      mainCamera: '48MP Fusion, f/1.78',
      ultraWideCamera: '48MP, f/2.2',
      telephotoCamera: '12MP, f/2.8, 5x optical zoom',
      frontCamera: '12MP TrueDepth, f/1.9',
      displaySize: '6.9 inches',
      displayType: 'Super Retina XDR OLED, ProMotion 120Hz',
      displayResolution: '2868 x 1320 at 460 ppi',
      refreshRate: '120Hz ProMotion',
      battery: 'Up to 33 hours video playback',
      chargingSpeed: 'USB-C, MagSafe 25W',
      os: 'iOS 18',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, UWB',
      simCard: 'Dual eSIM',
      waterResistance: 'IP68 (6 meters, 30 minutes)',
    },
    prices: { '256GB': 1899000, '512GB': 2249000, '1TB': 2599000 },
  },
  {
    name: 'iPhone 16 Pro',
    category: 'iPhone',
    description: 'iPhone 16 Pro with A18 Pro chip, 48MP camera system with 5x Telephoto, 6.3-inch Super Retina XDR display with ProMotion, and titanium design.',
    warranty: '1 Year Apple Warranty',
    tags: ['New', 'Pro'],
    colors: [
      { name: 'Desert Titanium', hex: '#BFA48F', image: '' },
      { name: 'Natural Titanium', hex: '#C2BCB2', image: '' },
      { name: 'White Titanium', hex: '#F2F1ED', image: '' },
      { name: 'Black Titanium', hex: '#3C3C3D', image: '' },
    ],
    storageOptions: ['128GB', '256GB', '512GB', '1TB'],
    specs: {
      chip: 'A18 Pro',
      mainCamera: '48MP Fusion, f/1.78',
      ultraWideCamera: '48MP, f/2.2',
      telephotoCamera: '12MP, f/2.8, 5x optical zoom',
      frontCamera: '12MP TrueDepth, f/1.9',
      displaySize: '6.3 inches',
      displayType: 'Super Retina XDR OLED, ProMotion 120Hz',
      displayResolution: '2622 x 1206 at 460 ppi',
      refreshRate: '120Hz ProMotion',
      battery: 'Up to 27 hours video playback',
      os: 'iOS 18',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3',
      waterResistance: 'IP68',
    },
    prices: { '128GB': 1599000, '256GB': 1749000, '512GB': 2099000, '1TB': 2449000 },
  },
  {
    name: 'iPhone 16',
    category: 'iPhone',
    description: 'iPhone 16 with A18 chip, advanced dual-camera system, Action button, and a gorgeous 6.1-inch Super Retina XDR display. Available in vibrant colors.',
    warranty: '1 Year Apple Warranty',
    tags: ['New'],
    colors: [
      { name: 'Black', hex: '#3C3B3F', image: '' },
      { name: 'White', hex: '#F5F5F0', image: '' },
      { name: 'Pink', hex: '#F4AFC8', image: '' },
      { name: 'Teal', hex: '#B0D4CE', image: '' },
      { name: 'Ultramarine', hex: '#7686C8', image: '' },
    ],
    storageOptions: ['128GB', '256GB', '512GB'],
    specs: {
      chip: 'A18',
      mainCamera: '48MP Fusion, f/1.6',
      ultraWideCamera: '12MP, f/2.2',
      frontCamera: '12MP TrueDepth, f/1.9',
      displaySize: '6.1 inches',
      displayType: 'Super Retina XDR OLED',
      displayResolution: '2556 x 1179 at 460 ppi',
      refreshRate: '60Hz',
      battery: 'Up to 22 hours video playback',
      os: 'iOS 18',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3',
      waterResistance: 'IP68',
    },
    prices: { '128GB': 1249000, '256GB': 1399000, '512GB': 1649000 },
  },
  {
    name: 'MacBook Air 15" M3',
    category: 'MacBook',
    description: 'MacBook Air 15-inch with M3 chip delivers incredible performance in an impossibly thin design. Up to 18 hours of battery life, Liquid Retina display, and MagSafe charging.',
    warranty: '1 Year Apple Warranty',
    tags: ['New', 'Bestseller'],
    colors: [
      { name: 'Midnight', hex: '#2E3642', image: '' },
      { name: 'Starlight', hex: '#F0E4D3', image: '' },
      { name: 'Space Gray', hex: '#7D7E80', image: '' },
      { name: 'Silver', hex: '#E3E4E5', image: '' },
    ],
    storageOptions: ['256GB', '512GB', '1TB'],
    specs: {
      chip: 'Apple M3',
      cpu: '8-core CPU',
      gpu: '10-core GPU',
      ram: '8GB / 16GB / 24GB Unified Memory',
      displaySize: '15.3 inches',
      displayType: 'Liquid Retina',
      displayResolution: '2880 x 1864 at 224 ppi',
      battery: 'Up to 18 hours',
      ports: '2x Thunderbolt / USB 4, MagSafe 3, 3.5mm headphone jack',
      camera: '1080p FaceTime HD',
      os: 'macOS Sequoia',
      weight: '1.51 kg',
    },
    prices: { '256GB': 2099000, '512GB': 2399000, '1TB': 2799000 },
  },
  {
    name: 'MacBook Pro 14" M4 Pro',
    category: 'MacBook',
    description: 'MacBook Pro 14-inch with M4 Pro chip delivers groundbreaking performance for demanding workflows. Liquid Retina XDR display, up to 24 hours battery, and Thunderbolt 5.',
    warranty: '1 Year Apple Warranty',
    tags: ['New', 'Pro'],
    colors: [
      { name: 'Space Black', hex: '#2E2C2F', image: '' },
      { name: 'Silver', hex: '#E3E4E5', image: '' },
    ],
    storageOptions: ['512GB', '1TB', '2TB'],
    specs: {
      chip: 'Apple M4 Pro',
      cpu: '14-core CPU',
      gpu: '20-core GPU',
      ram: '24GB Unified Memory',
      displaySize: '14.2 inches',
      displayType: 'Liquid Retina XDR',
      displayResolution: '3024 x 1964 at 254 ppi',
      battery: 'Up to 24 hours',
      ports: '3x Thunderbolt 5, HDMI, SDXC, MagSafe 3',
      camera: '12MP Center Stage',
      os: 'macOS Sequoia',
      weight: '1.55 kg',
    },
    prices: { '512GB': 3199000, '1TB': 3599000, '2TB': 4199000 },
  },
  {
    name: 'iPad Pro 13" M4',
    category: 'iPad',
    description: 'The thinnest, most powerful iPad ever. With the M4 chip, Ultra Retina XDR OLED display, and Apple Pencil Pro support.',
    warranty: '1 Year Apple Warranty',
    tags: ['New', 'Pro'],
    colors: [
      { name: 'Space Black', hex: '#2E2C2F', image: '' },
      { name: 'Silver', hex: '#E3E4E5', image: '' },
    ],
    storageOptions: ['256GB', '512GB', '1TB', '2TB'],
    specs: {
      chip: 'Apple M4',
      mainCamera: '12MP Wide, f/1.8',
      frontCamera: '12MP Ultra Wide, Center Stage',
      displaySize: '13 inches',
      displayType: 'Ultra Retina XDR OLED',
      displayResolution: '2752 x 2064 at 264 ppi',
      refreshRate: 'ProMotion 120Hz',
      battery: 'Up to 10 hours',
      connectivity: 'Wi-Fi 6E, Bluetooth 5.3, optional 5G',
      os: 'iPadOS 18',
    },
    prices: { '256GB': 2099000, '512GB': 2499000, '1TB': 3099000, '2TB': 3699000 },
  },
  {
    name: 'iPad Air 11" M2',
    category: 'iPad',
    description: 'iPad Air with the M2 chip brings serious performance in a thin, light design. 11-inch Liquid Retina display with P3 wide color.',
    warranty: '1 Year Apple Warranty',
    tags: ['Popular'],
    colors: [
      { name: 'Space Gray', hex: '#7D7E80', image: '' },
      { name: 'Starlight', hex: '#F0E4D3', image: '' },
      { name: 'Purple', hex: '#B8A9C9', image: '' },
      { name: 'Blue', hex: '#7DAFCA', image: '' },
    ],
    storageOptions: ['128GB', '256GB', '512GB', '1TB'],
    specs: {
      chip: 'Apple M2',
      mainCamera: '12MP Wide',
      frontCamera: '12MP Ultra Wide, Center Stage',
      displaySize: '11 inches',
      displayType: 'Liquid Retina',
      displayResolution: '2360 x 1640 at 264 ppi',
      refreshRate: '60Hz',
      battery: 'Up to 10 hours',
      connectivity: 'Wi-Fi 6E, Bluetooth 5.3',
      os: 'iPadOS 18',
    },
    prices: { '128GB': 999000, '256GB': 1149000, '512GB': 1399000, '1TB': 1799000 },
  },
  {
    name: 'Apple Watch Series 10',
    category: 'Apple Watch',
    description: 'The biggest, most advanced Apple Watch display ever. Thinner design, faster charging, water depth gauge, and comprehensive health features.',
    warranty: '1 Year Apple Warranty',
    tags: ['New'],
    colors: [
      { name: 'Jet Black', hex: '#1C1C1E', image: '' },
      { name: 'Rose Gold', hex: '#E8C4B8', image: '' },
      { name: 'Silver', hex: '#E3E4E5', image: '' },
    ],
    storageOptions: ['GPS', 'GPS + Cellular'],
    specs: {
      chip: 'Apple S10 SiP',
      displaySize: '46mm',
      displayType: 'Always-On LTPO3 OLED',
      battery: 'Up to 18 hours',
      waterResistance: 'WR50, EN 13319',
      connectivity: 'Wi-Fi, Bluetooth 5.3, optional LTE',
      sensors: 'Blood Oxygen, ECG, Temperature, Heart Rate',
      os: 'watchOS 11',
    },
    prices: { 'GPS': 649000, 'GPS + Cellular': 799000 },
  },
  {
    name: 'Apple Watch Ultra 2',
    category: 'Apple Watch',
    description: 'The most rugged and capable Apple Watch. Titanium case, precision dual-frequency GPS, up to 36 hours of battery life, and the brightest Apple display ever.',
    warranty: '1 Year Apple Warranty',
    tags: ['Pro', 'Adventure'],
    colors: [
      { name: 'Natural Titanium', hex: '#C2BCB2', image: '' },
      { name: 'Black Titanium', hex: '#3C3C3D', image: '' },
    ],
    storageOptions: ['GPS + Cellular'],
    specs: {
      chip: 'Apple S9 SiP',
      displaySize: '49mm',
      displayType: 'Always-On LTPO2 OLED, 3000 nits',
      battery: 'Up to 36 hours (72 hours low power)',
      waterResistance: 'WR100, EN 13319 (40m diving)',
      connectivity: 'LTE, Wi-Fi, Bluetooth 5.3, Dual-frequency GPS',
      sensors: 'Blood Oxygen, ECG, Temperature, Depth Gauge',
      os: 'watchOS 11',
    },
    prices: { 'GPS + Cellular': 1299000 },
  },
  {
    name: 'AirPods Pro 2',
    category: 'AirPods',
    description: 'AirPods Pro 2 with USB-C. Active Noise Cancellation, Adaptive Audio, Personalised Spatial Audio, and up to 2x more noise cancellation than the first generation.',
    warranty: '1 Year Apple Warranty',
    tags: ['Bestseller'],
    colors: [
      { name: 'White', hex: '#F5F5F0', image: '' },
    ],
    storageOptions: ['Standard'],
    specs: {
      chip: 'Apple H2',
      anc: 'Active Noise Cancellation with Adaptive Transparency',
      battery: 'Up to 6 hours (ANC on)',
      totalBattery: 'Up to 30 hours with MagSafe case',
      connectivity: 'Bluetooth 5.3',
      waterResistance: 'IPX4 (earbuds and case)',
      audio: 'Personalised Spatial Audio, Adaptive EQ, Conversation Awareness',
    },
    prices: { 'Standard': 399000 },
  },
  {
    name: 'AirPods Max',
    category: 'AirPods',
    description: 'AirPods Max with USB-C. Over-ear headphones with High-Fidelity Audio, Active Noise Cancellation, and a breathtaking design with anodised aluminium cups.',
    warranty: '1 Year Apple Warranty',
    tags: ['Premium'],
    colors: [
      { name: 'Midnight', hex: '#2E3642', image: '' },
      { name: 'Blue', hex: '#7DAFCA', image: '' },
      { name: 'Purple', hex: '#B8A9C9', image: '' },
      { name: 'Orange', hex: '#E8734A', image: '' },
      { name: 'Starlight', hex: '#F0E4D3', image: '' },
    ],
    storageOptions: ['Standard'],
    specs: {
      chip: 'Apple H2',
      anc: 'Active Noise Cancellation with Adaptive Transparency',
      battery: 'Up to 20 hours',
      totalBattery: '20 hours',
      connectivity: 'Bluetooth 5.3',
      waterResistance: 'Not water resistant',
      audio: 'Personalised Spatial Audio, Dolby Atmos, Lossless Audio',
    },
    prices: { 'Standard': 899000 },
  },
  {
    name: 'Apple TV 4K',
    category: 'Apple TV',
    description: 'Apple TV 4K brings the best of cinema home with Dolby Vision, Dolby Atmos, and a powerful A15 Bionic chip for gaming and streaming.',
    warranty: '1 Year Apple Warranty',
    tags: ['Entertainment'],
    colors: [
      { name: 'Black', hex: '#1C1C1E', image: '' },
    ],
    storageOptions: ['64GB', '128GB'],
    specs: {
      chip: 'A15 Bionic',
      resolution: '4K HDR with Dolby Vision',
      frameRate: 'Up to 60fps',
      audio: 'Dolby Atmos, Dolby Digital 7.1 / 5.1',
      connectivity: 'HDMI 2.1, Wi-Fi 6, Bluetooth 5.0, Gigabit Ethernet',
      os: 'tvOS 18',
    },
    prices: { '64GB': 249000, '128GB': 299000 },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const p of products) {
      const variants = [];
      for (const color of p.colors) {
        for (const storage of p.storageOptions) {
          const sku = `${p.name.replace(/[^A-Z0-9]/gi, '-').toUpperCase().slice(0, 10)}-${color.name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${storage.replace(/\s+/g, '').toUpperCase()}`;
          variants.push({
            color: color.name,
            storage,
            sku,
            price: p.prices[storage] || 0,
            stock: Math.floor(Math.random() * 20) + 5,
          });
        }
      }

      const existing = await Product.findOne({ name: p.name });
      if (existing) {
        console.log(`Skipping "${p.name}" (already exists)`);
        continue;
      }

      await Product.create({
        name: p.name,
        category: p.category,
        description: p.description,
        image: '',
        warranty: p.warranty,
        tags: p.tags,
        colors: p.colors,
        storageOptions: p.storageOptions,
        variants,
        specs: p.specs,
      });

      console.log(`Created: ${p.name} (${variants.length} variants)`);
    }

    console.log('\nDone! All products seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
