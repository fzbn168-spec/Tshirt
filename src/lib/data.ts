export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  features: string[];
  moq: string;
  material: string;
}

const productsEn: Product[] = [
  {
    id: '1',
    name: 'Classic Navy Blue Suit',
    category: 'men',
    price: 'Contact for Price',
    image: '/images/product-1.jpg',
    description: 'Premium wool blend suit featuring a modern slim fit cut. Perfect for business and formal occasions. Available in various sizes and custom measurements.',
    features: ['Premium Wool Blend', 'Modern Slim Fit', 'Breathable Lining', 'Wrinkle Resistant'],
    moq: '50 Sets',
    material: '70% Wool, 30% Polyester',
  },
  {
    id: '2',
    name: 'Floral Summer Dress',
    category: 'women',
    price: 'Contact for Price',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Lightweight and airy floral dress perfect for summer. Made from sustainable cotton blend with vibrant prints.',
    features: ['100% Organic Cotton', 'Floral Print', 'Midi Length', 'Machine Washable'],
    moq: '100 Pieces',
    material: '100% Organic Cotton',
  },
  {
    id: '3',
    name: 'Leather Biker Jacket',
    category: 'women',
    price: 'Contact for Price',
    image: 'https://images.unsplash.com/photo-1551028919-ac66e6a39451?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Authentic leather biker jacket with silver hardware. A timeless piece that adds edge to any outfit.',
    features: ['Genuine Leather', 'YKK Zippers', 'Quilted Lining', 'Adjustable Waist'],
    moq: '20 Pieces',
    material: 'Genuine Cowhide Leather',
  },
  {
    id: '4',
    name: 'Kids Denim Overalls',
    category: 'kids',
    price: 'Contact for Price',
    image: 'https://images.unsplash.com/photo-1519238263496-63f728b46600?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Durable and cute denim overalls for active kids. Adjustable straps and plenty of pockets.',
    features: ['Durable Denim', 'Adjustable Straps', 'Multiple Pockets', 'Easy Care'],
    moq: '200 Pieces',
    material: '98% Cotton, 2% Elastane',
  },
  {
    id: '5',
    name: 'Silk Scarf Collection',
    category: 'accessories',
    price: 'Contact for Price',
    image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Luxurious silk scarves in various patterns and colors. The perfect accessory to elevate any look.',
    features: ['100% Mulberry Silk', 'Hand Rolled Edges', 'Digital Print', 'Gift Box Included'],
    moq: '100 Pieces',
    material: '100% Mulberry Silk',
  },
  {
    id: '6',
    name: 'Casual Linen Shirt',
    category: 'men',
    price: 'Contact for Price',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Breathable linen shirt for a relaxed yet polished look. Ideal for warm weather.',
    features: ['100% Linen', 'Button-down Collar', 'Relaxed Fit', 'Natural Fibers'],
    moq: '150 Pieces',
    material: '100% Linen',
  },
];

const productsZh: Product[] = [
  {
    id: '1',
    name: '经典藏青色西装',
    category: 'men',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '优质羊毛混纺西装，现代修身剪裁。适合商务和正式场合。多种尺码可选，支持定制。',
    features: ['优质羊毛混纺', '现代修身剪裁', '透气里料', '防皱处理'],
    moq: '50 套',
    material: '70% 羊毛, 30% 聚酯纤维',
  },
  {
    id: '2',
    name: '碎花夏日连衣裙',
    category: 'women',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '轻盈透气的碎花连衣裙，适合夏日穿着。采用可持续棉混纺面料，印花鲜艳。',
    features: ['100%有机棉', '碎花印花', '中长款', '可机洗'],
    moq: '100 件',
    material: '100% 有机棉',
  },
  {
    id: '3',
    name: '皮革机车夹克',
    category: 'women',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1551028919-ac66e6a39451?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '真皮机车夹克，配有银色五金件。永不过时的单品，为任何装扮增添前卫感。',
    features: ['真皮', 'YKK拉链', '绗缝里料', '腰部可调'],
    moq: '20 件',
    material: '真牛皮',
  },
  {
    id: '4',
    name: '儿童牛仔背带裤',
    category: 'kids',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1519238263496-63f728b46600?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '耐用可爱的儿童牛仔背带裤，适合活泼好动的孩子。可调节肩带，多口袋设计。',
    features: ['耐磨牛仔布', '可调节肩带', '多口袋', '易打理'],
    moq: '200 件',
    material: '98% 棉, 2% 氨纶',
  },
  {
    id: '5',
    name: '丝绸围巾系列',
    category: 'accessories',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '奢华丝绸围巾，多种图案和颜色可选。提升任何造型的完美配饰。',
    features: ['100% 桑蚕丝', '手工卷边', '数码印花', '含礼盒'],
    moq: '100 条',
    material: '100% 桑蚕丝',
  },
  {
    id: '6',
    name: '休闲亚麻衬衫',
    category: 'men',
    price: '联系询价',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '透气亚麻衬衫，休闲又不失精致。温暖天气的理想选择。',
    features: ['100% 亚麻', '扣领设计', '宽松版型', '天然纤维'],
    moq: '150 件',
    material: '100% 亚麻',
  },
];

export function getProducts(locale: string): Product[] {
  return locale === 'zh' ? productsZh : productsEn;
}

export const products = productsEn; // Default export for backward compatibility if needed
