Migration decision and initial assumptions

Chosen strategy

- Migrate the frontend to Next.js 14 (App Router) for SSR/SEO and long-term maintainability.
- Create a new backend service using Node.js + Express + Socket.io with MongoDB Atlas (Mongoose) as the primary datastore.
- Use NextAuth.js for authentication if we complete the Next.js migration early; fallback: custom JWT + bcrypt on the Express API.

Assumptions

- You want MongoDB Atlas as the canonical database for users/products/orders.
- We will keep the existing frontend code as a reference and port components/pages to Next.js incrementally.
- Cloudinary will be used for file uploads.

Immediate next steps

1. Scaffold backend (done): minimal Express server + Socket.io + MongoDB connection.
2. Implement Phase 1: Auth (register/login, role switch), User schema, basic profile endpoints.
3. Implement Product schema and CRUD endpoints.

How to run the backend locally (once deps installed)

- cd backend
- cp .env.example .env # fill values
- npm install
- npm run dev

If you want me to proceed I'll:

- Create a new git branch `mvp/next-migration` and start migrating pages and wiring NextAuth.
- Or, if you prefer, I can continue implementing the backend APIs first and integrate them into the current Vite app.

Tell me which path you prefer (migrate now vs implement backend APIs first).
