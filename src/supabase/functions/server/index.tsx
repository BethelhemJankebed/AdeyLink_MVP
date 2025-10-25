import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Health check endpoint
app.get("/make-server-75c53d23/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper to get authenticated user
async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const accessToken = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  return user.id;
}

// ========== AUTH ENDPOINTS ==========

// Sign up endpoint
app.post("/make-server-75c53d23/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, bio, location, interests, isSeller, phone, avatar } = body;

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Store user profile in KV store
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      bio: bio || '',
      location: location || { city: '', lat: 0, lng: 0 },
      interests: interests || [],
      isSeller: isSeller || false,
      followers: 0,
      following: 0,
      avatar: avatar || '',
      phone: phone || '',
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, userId });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Get user profile
app.get("/make-server-75c53d23/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== CATEGORY & SELLER ENDPOINTS ==========

// Get sellers by category
app.get("/make-server-75c53d23/category/:category/sellers", async (c) => {
  try {
    const category = c.req.param('category');
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');

    // Get all users
    const users = await kv.getByPrefix('user:');
    
    // Filter sellers who have products in this category
    const sellersData = await Promise.all(
      users.map(async (user: any) => {
        if (!user.isSeller) return null;
        
        // Get products for this seller in this category
        const products = await kv.getByPrefix(`product:${user.id}:`);
        const hasProductsInCategory = products.some((p: any) => p.category === category);
        
        if (!hasProductsInCategory) return null;
        
        // Get reviews for this seller
        const reviews = await kv.getByPrefix(`review:${user.id}:`);
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
          : 5;
        
        // Calculate distance
        const distance = calculateDistance(lat, lng, user.location.lat, user.location.lng);
        
        return {
          id: user.id,
          name: user.name,
          bio: user.bio,
          location: user.location,
          avatar: user.avatar,
          avgRating,
          reviewCount: reviews.length,
          distance,
          followers: user.followers
        };
      })
    );
    
    // Filter out nulls and sort by distance then rating
    const sellers = sellersData
      .filter((s: any) => s !== null)
      .sort((a: any, b: any) => {
        // Sort by distance first, then by rating
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return b.avgRating - a.avgRating;
      });
    
    return c.json(sellers);
  } catch (error: any) {
    console.error('Get sellers error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== PRODUCT ENDPOINTS ==========

// Get seller's products
app.get("/make-server-75c53d23/seller/:sellerId/products", async (c) => {
  try {
    const sellerId = c.req.param('sellerId');
    const products = await kv.getByPrefix(`product:${sellerId}:`);
    return c.json(products);
  } catch (error: any) {
    console.error('Get products error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add product (sellers only)
app.post("/make-server-75c53d23/products", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, description, price, category, images, available } = body;
    
    const productId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const product = {
      id: productId,
      sellerId: userId,
      title,
      description,
      price,
      category,
      images: images || [],
      available: available !== false,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`product:${userId}:${productId}`, product);
    return c.json(product);
  } catch (error: any) {
    console.error('Add product error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== VIDEO ENDPOINTS ==========

// Get videos by category
app.get("/make-server-75c53d23/videos/category/:category", async (c) => {
  try {
    const category = c.req.param('category');
    
    // Get all videos
    const allVideos = await kv.getByPrefix('video:');
    const categoryVideos = allVideos.filter((v: any) => v.category === category);
    
    return c.json(categoryVideos);
  } catch (error: any) {
    console.error('Get videos error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get seller's videos
app.get("/make-server-75c53d23/seller/:sellerId/videos", async (c) => {
  try {
    const sellerId = c.req.param('sellerId');
    const videos = await kv.getByPrefix(`video:${sellerId}:`);
    return c.json(videos);
  } catch (error: any) {
    console.error('Get seller videos error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Check like status
app.get("/make-server-75c53d23/videos/:videoId/like", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const videoId = c.req.param('videoId');
    const like = await kv.get(`like:${userId}:${videoId}`);
    
    return c.json({ liked: !!like });
  } catch (error: any) {
    console.error('Check like error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Toggle like on video
app.post("/make-server-75c53d23/videos/:videoId/like", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const videoId = c.req.param('videoId');
    const likeKey = `like:${userId}:${videoId}`;
    const existingLike = await kv.get(likeKey);
    
    // Find video with any key pattern
    const allVideos = await kv.getByPrefix('video:');
    const video = allVideos.find((v: any) => v.id === videoId);
    
    if (existingLike) {
      // Unlike
      await kv.del(likeKey);
      
      // Update video likes count
      if (video) {
        video.likes = Math.max(0, video.likes - 1);
        // Update using the original key
        const videoKey = video.sellerId ? `video:${video.sellerId}:${videoId}` : `video:${videoId}`;
        await kv.set(videoKey, video);
      }
      
      return c.json({ liked: false });
    } else {
      // Like
      await kv.set(likeKey, { userId, videoId, timestamp: new Date().toISOString() });
      
      // Update video likes count
      if (video) {
        video.likes = (video.likes || 0) + 1;
        // Update using the original key
        const videoKey = video.sellerId ? `video:${video.sellerId}:${videoId}` : `video:${videoId}`;
        await kv.set(videoKey, video);
      }
      
      return c.json({ liked: true });
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get video comments
app.get("/make-server-75c53d23/videos/:videoId/comments", async (c) => {
  try {
    const videoId = c.req.param('videoId');
    const comments = await kv.getByPrefix(`comment:${videoId}:`);
    
    // Get user info for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment: any) => {
        const user = await kv.get(`user:${comment.userId}`);
        return {
          ...comment,
          user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
        };
      })
    );
    
    return c.json(commentsWithUsers);
  } catch (error: any) {
    console.error('Get comments error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add comment to video
app.post("/make-server-75c53d23/videos/:videoId/comments", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const videoId = c.req.param('videoId');
    const { text } = await c.req.json();
    
    const commentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const comment = {
      id: commentId,
      videoId,
      userId,
      text,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`comment:${videoId}:${commentId}`, comment);
    
    // Update video comment count
    const video = await kv.get(`video:${videoId}`);
    if (video) {
      video.commentCount = (video.commentCount || 0) + 1;
      await kv.set(`video:${videoId}`, video);
    }
    
    return c.json(comment);
  } catch (error: any) {
    console.error('Add comment error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== FOLLOW ENDPOINTS ==========

// Check follow status
app.get("/make-server-75c53d23/follow/:sellerId/status", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sellerId = c.req.param('sellerId');
    const follow = await kv.get(`follow:${userId}:${sellerId}`);
    
    return c.json({ following: !!follow });
  } catch (error: any) {
    console.error('Check follow error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Toggle follow
app.post("/make-server-75c53d23/follow/:sellerId", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sellerId = c.req.param('sellerId');
    const followKey = `follow:${userId}:${sellerId}`;
    const existingFollow = await kv.get(followKey);
    
    if (existingFollow) {
      // Unfollow
      await kv.del(followKey);
      
      // Update counts
      const user = await kv.get(`user:${userId}`);
      const seller = await kv.get(`user:${sellerId}`);
      
      if (user) {
        user.following = Math.max(0, user.following - 1);
        await kv.set(`user:${userId}`, user);
      }
      
      if (seller) {
        seller.followers = Math.max(0, seller.followers - 1);
        await kv.set(`user:${sellerId}`, seller);
      }
      
      return c.json({ following: false });
    } else {
      // Follow
      await kv.set(followKey, { userId, sellerId, timestamp: new Date().toISOString() });
      
      // Update counts
      const user = await kv.get(`user:${userId}`);
      const seller = await kv.get(`user:${sellerId}`);
      
      if (user) {
        user.following = (user.following || 0) + 1;
        await kv.set(`user:${userId}`, user);
      }
      
      if (seller) {
        seller.followers = (seller.followers || 0) + 1;
        await kv.set(`user:${sellerId}`, seller);
      }
      
      return c.json({ following: true });
    }
  } catch (error: any) {
    console.error('Toggle follow error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== REVIEW ENDPOINTS ==========

// Get seller's reviews
app.get("/make-server-75c53d23/seller/:sellerId/reviews", async (c) => {
  try {
    const sellerId = c.req.param('sellerId');
    const reviews = await kv.getByPrefix(`review:${sellerId}:`);
    
    // Get buyer info for each review
    const reviewsWithBuyers = await Promise.all(
      reviews.map(async (review: any) => {
        const buyer = await kv.get(`user:${review.buyerId}`);
        return {
          ...review,
          buyer: buyer ? { id: buyer.id, name: buyer.name, avatar: buyer.avatar } : null
        };
      })
    );
    
    return c.json(reviewsWithBuyers);
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add review
app.post("/make-server-75c53d23/reviews", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { sellerId, rating, comment } = await c.req.json();
    
    const reviewId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const review = {
      id: reviewId,
      sellerId,
      buyerId: userId,
      rating,
      comment,
      date: new Date().toISOString()
    };
    
    await kv.set(`review:${sellerId}:${reviewId}`, review);
    return c.json(review);
  } catch (error: any) {
    console.error('Add review error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== CART ENDPOINTS ==========

// Get user's cart
app.get("/make-server-75c53d23/cart", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const cartItems = await kv.getByPrefix(`cart:${userId}:`);
    
    // Get product info for each cart item
    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item: any) => {
        const product = await kv.get(`product:${item.sellerId}:${item.productId}`);
        return {
          ...item,
          product: product || null
        };
      })
    );
    
    return c.json(itemsWithProducts.filter((i: any) => i.product !== null));
  } catch (error: any) {
    console.error('Get cart error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Add to cart
app.post("/make-server-75c53d23/cart", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { productId, sellerId, quantity } = await c.req.json();
    
    const cartItem = {
      productId,
      sellerId,
      quantity: quantity || 1,
      addedAt: new Date().toISOString()
    };
    
    await kv.set(`cart:${userId}:${productId}`, cartItem);
    return c.json(cartItem);
  } catch (error: any) {
    console.error('Add to cart error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Remove from cart
app.delete("/make-server-75c53d23/cart/:productId", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('productId');
    await kv.del(`cart:${userId}:${productId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Remove from cart error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== ORDER ENDPOINTS ==========

// Place order
app.post("/make-server-75c53d23/orders", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { products, total, paymentMethod } = await c.req.json();
    
    const orderId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const order = {
      id: orderId,
      buyerId: userId,
      products,
      total,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`order:${userId}:${orderId}`, order);
    
    // Clear cart
    const cartItems = await kv.getByPrefix(`cart:${userId}:`);
    await kv.mdel(cartItems.map((item: any) => `cart:${userId}:${item.productId}`));
    
    return c.json(order);
  } catch (error: any) {
    console.error('Place order error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========== MESSAGING ENDPOINTS ==========

// Get conversations
app.get("/make-server-75c53d23/conversations", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all messages where user is sender or receiver
    const allMessages = await kv.getByPrefix('message:');
    
    // Find unique conversation partners
    const conversationMap = new Map<string, any>();
    
    for (const message of allMessages) {
      if (message.senderId === userId || message.receiverId === userId) {
        const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
        
        if (!conversationMap.has(partnerId) || 
            new Date(message.timestamp) > new Date(conversationMap.get(partnerId).timestamp)) {
          conversationMap.set(partnerId, message);
        }
      }
    }
    
    // Get user info for each partner
    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([partnerId, lastMessage]) => {
        const user = await kv.get(`user:${partnerId}`);
        return {
          userId: partnerId,
          user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
          lastMessage
        };
      })
    );
    
    return c.json(conversations.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    ));
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get messages with a user
app.get("/make-server-75c53d23/messages/:userId", async (c) => {
  try {
    const currentUserId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!currentUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const otherUserId = c.req.param('userId');
    
    // Get all messages
    const allMessages = await kv.getByPrefix('message:');
    
    // Filter messages between these two users
    const conversation = allMessages
      .filter((m: any) => 
        (m.senderId === currentUserId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === currentUserId)
      )
      .sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    
    return c.json(conversation);
  } catch (error: any) {
    console.error('Get messages error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Send message
app.post("/make-server-75c53d23/messages", async (c) => {
  try {
    const userId = await getAuthenticatedUser(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { receiverId, text } = await c.req.json();
    
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = [userId, receiverId].sort().join(':');
    
    const message = {
      id: messageId,
      conversationId,
      senderId: userId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    await kv.set(`message:${conversationId}:${messageId}`, message);
    return c.json(message);
  } catch (error: any) {
    console.error('Send message error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
