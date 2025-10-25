# Empower Her - Architecture Documentation

## System Overview

Empower Her is a full-stack marketplace application built with React and Supabase, featuring social commerce capabilities similar to LinkedIn and TikTok.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend
- **Supabase Edge Functions** (Deno runtime)
- **Hono** web framework for routing
- **Supabase Auth** for user authentication
- **Supabase KV Store** for data persistence

### Architecture Pattern
- **Three-tier architecture**: Frontend → Server → Database
- **RESTful API** design
- **JWT-based authentication**

## Data Model

### Key-Value Store Structure

The application uses a flexible key-value store with the following patterns:

#### User Data
```
user:{userId} = {
  id: string
  email: string
  name: string
  bio: string
  location: { city: string, lat: number, lng: number }
  interests: string[]
  isSeller: boolean
  followers: number
  following: number
  avatar: string
  createdAt: string
}
```

#### Products
```
product:{sellerId}:{productId} = {
  id: string
  sellerId: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  available: boolean
  createdAt: string
}
```

#### Videos
```
video:{sellerId}:{videoId} = {
  id: string
  sellerId: string
  productId: string
  title: string
  description: string
  videoUrl: string
  category: string
  likes: number
  commentCount: number
}
```

#### Reviews
```
review:{sellerId}:{reviewId} = {
  id: string
  sellerId: string
  buyerId: string
  rating: number (1-5)
  comment: string
  date: string
}
```

#### Social Features
```
follow:{followerId}:{followedId} = {
  userId: string
  sellerId: string
  timestamp: string
}

like:{userId}:{videoId} = {
  userId: string
  videoId: string
  timestamp: string
}

comment:{videoId}:{commentId} = {
  id: string
  videoId: string
  userId: string
  text: string
  timestamp: string
}
```

#### Shopping
```
cart:{userId}:{productId} = {
  productId: string
  sellerId: string
  quantity: number
  addedAt: string
}

order:{userId}:{orderId} = {
  id: string
  buyerId: string
  products: Product[]
  total: number
  paymentMethod: string
  status: string
  createdAt: string
}
```

#### Messaging
```
message:{conversationId}:{messageId} = {
  id: string
  conversationId: string (sorted user IDs)
  senderId: string
  receiverId: string
  text: string
  timestamp: string
  read: boolean
}
```

## API Endpoints

### Authentication
- `POST /make-server-75c53d23/signup` - Create new user
- `GET /make-server-75c53d23/user/:userId` - Get user profile

### Categories & Discovery
- `GET /make-server-75c53d23/category/:category/sellers?lat={lat}&lng={lng}` - Get sellers by category with proximity sorting

### Products
- `GET /make-server-75c53d23/seller/:sellerId/products` - Get seller's products
- `POST /make-server-75c53d23/products` - Add new product (auth required)

### Videos
- `GET /make-server-75c53d23/videos/category/:category` - Get videos by category
- `GET /make-server-75c53d23/seller/:sellerId/videos` - Get seller's videos
- `GET /make-server-75c53d23/videos/:videoId/like` - Check like status (auth required)
- `POST /make-server-75c53d23/videos/:videoId/like` - Toggle like (auth required)
- `GET /make-server-75c53d23/videos/:videoId/comments` - Get comments
- `POST /make-server-75c53d23/videos/:videoId/comments` - Add comment (auth required)

### Social Features
- `GET /make-server-75c53d23/follow/:sellerId/status` - Check follow status (auth required)
- `POST /make-server-75c53d23/follow/:sellerId` - Toggle follow (auth required)

### Reviews
- `GET /make-server-75c53d23/seller/:sellerId/reviews` - Get seller's reviews
- `POST /make-server-75c53d23/reviews` - Add review (auth required)

### Shopping Cart
- `GET /make-server-75c53d23/cart` - Get cart items (auth required)
- `POST /make-server-75c53d23/cart` - Add to cart (auth required)
- `DELETE /make-server-75c53d23/cart/:productId` - Remove from cart (auth required)

### Orders
- `POST /make-server-75c53d23/orders` - Place order (auth required)

### Messaging
- `GET /make-server-75c53d23/conversations` - Get conversations (auth required)
- `GET /make-server-75c53d23/messages/:userId` - Get messages with user (auth required)
- `POST /make-server-75c53d23/messages` - Send message (auth required)

## Component Structure

```
App.tsx (Root)
├── AuthProvider (Context)
│   └── AppContent
│       ├── Navigation Bar
│       ├── Homepage
│       ├── CategoryView
│       ├── VideoFeed
│       ├── SellerProfile
│       │   └── AddProduct (Modal)
│       ├── Cart
│       ├── Messaging
│       ├── ProductDetail (Modal)
│       ├── Login
│       └── SignUp
```

## Key Features Implementation

### 1. Geographical Proximity
- Uses Haversine formula for distance calculation
- Sorts sellers by distance from user's location
- Location captured during signup via browser geolocation API

### 2. TikTok-Style Video Feed
- Vertical scrolling with wheel events
- Video placeholder with metadata overlay
- Like, comment, and share actions
- Seller profile overlay

### 3. Social Features
- Follow/unfollow with real-time count updates
- 5-star review system
- Video comments with user info
- Direct messaging with conversation list

### 4. Shopping Flow
1. Browse products → Add to cart
2. Review cart → Place order
3. COD payment method
4. Order confirmation

### 5. Real-time Messaging
- Polling mechanism (3-second intervals)
- Conversation threads
- Message history
- Unread indicators (coming soon)

## Security Considerations

### Authentication Flow
1. User signs up → Supabase creates auth user
2. Backend creates user profile in KV store
3. User signs in → Receives JWT access token
4. Token passed in Authorization header for protected routes
5. Backend validates token with Supabase auth

### Protected Routes
All routes requiring authentication:
- Check Authorization header
- Extract JWT token
- Validate with `supabase.auth.getUser()`
- Return 401 if invalid

### Data Access
- Users can only modify their own data
- Cart and orders are user-specific
- Messages require sender authentication

## Performance Optimizations

### Frontend
- React state management for local updates
- Optimistic UI updates for likes/follows
- Lazy loading of images (future)
- Virtual scrolling for long lists (future)

### Backend
- Efficient key prefix queries
- Distance calculation only for relevant sellers
- Batch operations for related data

## Scalability Notes

### Current Limitations (MVP)
- KV store may not scale to millions of records
- No CDN for media files
- Polling for messages (no WebSockets)
- No caching layer

### Future Improvements
- Migrate to PostgreSQL with proper indexing
- Implement Redis for caching
- Use WebSockets for real-time features
- Add CDN for static assets
- Implement pagination for large datasets
- Add full-text search with Elasticsearch

## Development Workflow

### Adding New Features
1. Design data model (KV keys)
2. Implement backend API endpoint
3. Add frontend component
4. Update routing in App.tsx
5. Test authentication flow
6. Handle errors gracefully

### Testing
- Manual testing in browser
- Check console logs for errors
- Verify API responses in Network tab
- Test with multiple accounts

## Environment Variables

Required in Supabase Edge Functions:
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided
- `SUPABASE_ANON_KEY` - Automatically provided

## Deployment

This app is designed for Figma Make prototyping environment:
- Frontend: Deployed automatically
- Backend: Supabase Edge Functions
- Database: Supabase KV Store
- Auth: Supabase Auth

## Monitoring & Debugging

### Logs
- Edge Functions: `console.log()` visible in Supabase dashboard
- Frontend: Browser console
- Network requests: Browser DevTools

### Common Issues
1. **401 Unauthorized**: Check if access token is valid
2. **CORS errors**: Ensure CORS headers in backend
3. **Data not loading**: Check KV key patterns
4. **Messages not updating**: Polling interval issue

## Future Roadmap

### Phase 1 (Current MVP)
- ✅ User authentication
- ✅ Category browsing
- ✅ Seller listings
- ✅ Product management
- ✅ Shopping cart
- ✅ Orders (COD)
- ✅ Social features
- ✅ Messaging

### Phase 2 (Next)
- Video upload functionality
- Image upload for products
- Search and filters
- Order history
- Seller dashboard
- Analytics

### Phase 3 (Future)
- Payment gateway integration
- Push notifications
- Email notifications
- Mobile app
- Advanced recommendations
- Seller verification
- Ratings & badges

---

Built with ❤️ for women entrepreneurs
