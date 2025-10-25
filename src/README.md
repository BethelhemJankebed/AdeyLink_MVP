# Empower Her - Women's Marketplace MVP

A marketplace web application connecting women entrepreneurs with customers, featuring TikTok-style product videos, social features, and direct messaging.

## 🌟 MVP Features

### 1. **User Authentication**
- Email/password signup and login
- User profiles with bio, location, interests
- Seller and buyer roles

### 2. **Category System**
- Homepage with 6 main categories:
  - 🌸 Flowers
  - 🍽️ Food & Catering
  - 🎨 Handcrafts
  - ✨ Jewelry
  - 💄 Beauty & Cosmetics
  - 👗 Fashion & Accessories

### 3. **Geographical Discovery**
- Sellers are recommended based on proximity to user's location
- Distance calculation using Haversine formula
- Sorted by distance and rating

### 4. **Seller Listings**
- View sellers in each category
- See seller ratings, reviews, and follower counts
- Profile information including interests

### 5. **TikTok-Style Video Feed**
- Short product videos in each category
- Vertical scrolling experience
- Like and comment on videos
- View seller profile from video

### 6. **Seller Profiles**
- Tabbed interface showing:
  - About (bio and interests)
  - Products with prices
  - Videos posted
  - Reviews and ratings (5-star system)
- Follow/unfollow sellers
- Direct message button
- Write reviews

### 7. **Product Management**
- Sellers can add products with:
  - Title, description, price
  - Category
  - Availability status
- Product catalog view
- Product detail pages

### 8. **Shopping Cart**
- Add products to cart
- Manage quantities
- Remove items
- View total price

### 9. **Order Placement**
- Cash on Delivery (COD) payment method
- Order confirmation
- Cart cleared after order

### 10. **Social Features**
- Follow/unfollow sellers
- Get notified when followed sellers post (coming soon)
- 5-star review system
- Comments on product videos
- Like videos

### 11. **Messaging System**
- Real-time chat between buyers and sellers
- Conversation list
- Message history
- Auto-refresh for new messages

## 🚀 Quick Start Checklist

### First Time Setup
1. ✅ Open the application
2. ✅ Click "Sign Up" to create an account
3. ✅ Fill in your details and location
4. ✅ Check "I want to sell products" if you're a seller
5. ✅ Allow location permissions for better recommendations
6. ✅ Explore the categories on the homepage

### To Populate the Marketplace (Testing)
Since this is an MVP, you'll need to create demo data:
1. ✅ Create multiple seller accounts (use different emails)
2. ✅ Log in as each seller and add products via their profile
3. ✅ Switch between accounts to simulate buyers and sellers
4. ✅ This creates a realistic marketplace experience

## 🚀 Getting Started

### For Buyers:
1. **Sign Up** - Create an account with your email
2. **Browse Categories** - Choose a category from the homepage
3. **Discover Sellers** - View sellers sorted by proximity
4. **Watch Videos** - See product videos TikTok-style
5. **Visit Profiles** - Click on sellers to see their full profile
6. **Add to Cart** - Add products you like
7. **Place Order** - Checkout with Cash on Delivery
8. **Message Sellers** - Contact sellers directly
9. **Follow & Review** - Follow sellers and leave reviews

### For Sellers:
1. **Sign Up as Seller** - Check "I want to sell products" during signup
2. **Add Products** - (API endpoint available, UI coming soon)
3. **Upload Videos** - (API endpoint available, UI coming soon)
4. **Receive Messages** - Chat with potential customers
5. **Build Following** - Gain followers through quality products
6. **Manage Reviews** - Respond to customer reviews

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase Edge Functions (Deno + Hono)
- **Database**: Supabase KV Store (Key-Value storage)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## 📊 Data Structure

The app uses a key-value store with the following key patterns:

- `user:{userId}` - User profiles
- `product:{sellerId}:{productId}` - Products
- `video:{sellerId}:{videoId}` or `video:{videoId}` - Product videos
- `review:{sellerId}:{reviewId}` - Reviews
- `follow:{followerId}:{followedId}` - Follow relationships
- `like:{userId}:{videoId}` - Video likes
- `comment:{videoId}:{commentId}` - Video comments
- `cart:{userId}:{productId}` - Shopping cart items
- `order:{userId}:{orderId}` - Orders
- `message:{conversationId}:{messageId}` - Messages

## 🔜 Future Enhancements

- Product upload UI for sellers
- Video upload functionality
- Order tracking and history
- Push notifications for new messages
- Search and filters
- Payment gateway integration
- Seller analytics dashboard
- Product recommendations
- Social sharing features
- Email notifications
- Mobile app

## 💡 Notes

- This is an MVP built for prototyping
- Cash on Delivery is the only payment method
- Location permissions improve seller recommendations
- All features are powered by Supabase backend

## 🔒 Security

- Row Level Security on Supabase
- JWT-based authentication
- Environment variables for sensitive keys
- Never expose SUPABASE_SERVICE_ROLE_KEY to frontend

---

Built with ❤️ for women entrepreneurs
