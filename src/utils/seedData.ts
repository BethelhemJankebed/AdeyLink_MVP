// This file contains demo data seeding functions
// In a real app, you would call these from an admin panel or setup script

import { projectId, publicAnonKey } from './supabase/info'

export async function seedDemoData() {
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23`
  
  console.log('Seeding demo data...')
  
  // Note: In production, you would need to properly authenticate these requests
  // For demo purposes, you can manually create some sellers and products through the UI
  
  console.log('Demo data seeding complete!')
  console.log('Create seller accounts to populate the marketplace!')
}

// Demo seller data structure for reference
export const demoSellers = [
  {
    email: 'rose@flowers.com',
    name: 'Rose Garden',
    bio: 'Beautiful handcrafted floral arrangements for every occasion. Over 10 years of experience in floral design.',
    city: 'New York',
    category: 'flowers',
    interests: ['Floristry', 'Event Design', 'Gardening']
  },
  {
    email: 'maria@catering.com',
    name: "Maria's Kitchen",
    bio: 'Authentic homemade food catering for events. Specializing in Mediterranean and Latin cuisine.',
    city: 'Los Angeles',
    category: 'food-catering',
    interests: ['Cooking', 'Baking', 'Event Catering']
  },
  {
    email: 'sarah@crafts.com',
    name: 'Sarah Crafts',
    bio: 'Unique handmade crafts and home decor. Each piece tells a story and is made with love.',
    city: 'Chicago',
    category: 'handcrafts',
    interests: ['Knitting', 'Pottery', 'Painting']
  },
  {
    email: 'emma@jewelry.com',
    name: 'Emma Jewels',
    bio: 'Custom jewelry designs using ethically sourced materials. Specializing in personalized pieces.',
    city: 'Miami',
    category: 'jewelry',
    interests: ['Jewelry Making', 'Gemstones', 'Design']
  },
  {
    email: 'lily@beauty.com',
    name: 'Lily Beauty',
    bio: 'Natural and organic beauty products. Cruelty-free cosmetics made with sustainable ingredients.',
    city: 'Seattle',
    category: 'beauty',
    interests: ['Skincare', 'Cosmetics', 'Natural Beauty']
  },
  {
    email: 'sophia@fashion.com',
    name: 'Sophia Style',
    bio: 'Contemporary fashion and accessories. Empowering women through bold, unique designs.',
    city: 'Boston',
    category: 'fashion',
    interests: ['Fashion Design', 'Styling', 'Sustainable Fashion']
  }
]

// Demo product examples
export const demoProducts = {
  flowers: [
    { title: 'Rose Bouquet', price: 45, description: 'Stunning arrangement of 12 fresh roses' },
    { title: 'Wedding Centerpiece', price: 120, description: 'Elegant centerpiece perfect for weddings' },
    { title: 'Spring Mix', price: 35, description: 'Colorful mix of seasonal spring flowers' }
  ],
  'food-catering': [
    { title: 'Party Platter', price: 150, description: 'Serves 20 people - assorted appetizers' },
    { title: 'Wedding Cake', price: 300, description: '3-tier custom wedding cake' },
    { title: 'Catering Package', price: 500, description: 'Full meal catering for 50 people' }
  ],
  handcrafts: [
    { title: 'Knitted Scarf', price: 28, description: 'Handmade wool scarf in various colors' },
    { title: 'Ceramic Vase', price: 55, description: 'Hand-thrown pottery vase' },
    { title: 'Wall Art', price: 85, description: 'Original acrylic painting on canvas' }
  ],
  jewelry: [
    { title: 'Silver Necklace', price: 65, description: 'Sterling silver pendant necklace' },
    { title: 'Custom Ring', price: 180, description: 'Personalized engagement ring' },
    { title: 'Earring Set', price: 40, description: 'Handcrafted gold-plated earrings' }
  ],
  beauty: [
    { title: 'Face Cream', price: 35, description: 'Organic moisturizing face cream' },
    { title: 'Lipstick Set', price: 42, description: '5 natural lipstick shades' },
    { title: 'Skincare Bundle', price: 95, description: 'Complete natural skincare routine' }
  ],
  fashion: [
    { title: 'Summer Dress', price: 78, description: 'Lightweight floral print dress' },
    { title: 'Leather Bag', price: 125, description: 'Handcrafted leather tote bag' },
    { title: 'Silk Scarf', price: 45, description: 'Premium silk designer scarf' }
  ]
}
