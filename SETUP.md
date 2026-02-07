# Citadel of Truth - Quick Start Guide

## 🚀 Easy Setup (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB (local or Atlas account)

### Option 1: Local MongoDB (Windows)

```powershell
# Install MongoDB
winget install MongoDB.Server

# Start MongoDB service
net start MongoDB

# Verify it's running
mongosh --version
```

### Option 2: MongoDB Atlas (Cloud - Easiest)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Create free account
3. Create free cluster (M0)
4. Add your IP to whitelist
5. Create database user
6. Copy connection string

### Project Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Edit .env.local with your MongoDB URI
# For local: MONGODB_URI=mongodb://localhost:27017/citadel-of-truth
# For Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/citadel-of-truth

# 4. Generate auth secret
# Run this command and copy the output to NEXTAUTH_SECRET in .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📧 Email Configuration

### Using Gmail (Recommended for Testing)

1. Enable 2FA on your Google account
2. Create an App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add to `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=noreply@citadeloftruth.com
```

### Alternative Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
```

## 🗂️ Database Auto-Setup

MongoDB will automatically:
- ✅ Create collections on first use
- ✅ Build all indexes
- ✅ Set up TTL for OTP expiration
- ✅ Enable middleware hooks

**No manual migration needed!**

## 🧪 Testing the Setup

```bash
# 1. Start the server
npm run dev

# 2. Test MongoDB connection
# Open http://localhost:3000/api/health
# Should return: {"status": "ok", "database": "connected"}

# 3. Test email (optional)
# Try registering with your .edu email
```

## 📦 Tech Stack Highlights

| Component | Technology | Why? |
|-----------|-----------|------|
| Database | MongoDB | Easy config, no migrations |
| ODM | Mongoose | Type-safe, built-in validation |
| Auth | NextAuth.js | Industry standard |
| Email | Nodemailer | Works with any SMTP |
| Frontend | Next.js 14 | React with SSR |
| Styling | Tailwind | Utility-first CSS |
| Deploy | Vercel | One-click deployment |

## 🔧 Configuration Files

All configuration is centralized:

- `.env.local` - Environment variables (never commit!)
- `src/lib/config.ts` - App configuration
- `src/lib/constants.ts` - Global constants
- `src/lib/mongodb.ts` - Database connection

## 📚 Project Structure

```
CommitCrew/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   ├── components/          # React components
│   ├── lib/                 # Core configuration
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript types
├── database/
│   ├── schemas/             # Mongoose models
│   └── functions/           # Database utilities
└── public/                  # Static assets
```

## 🚨 Common Issues

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB service is running
```powershell
net start MongoDB
```

### Email Not Sending
**Solution:** Check SMTP credentials and enable "Less secure app access" or use App Password

### Port 3000 Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard
# - MONGODB_URI (use Atlas connection string)
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL (your-app.vercel.app)
# - SMTP_* variables
```

## 📖 Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design
2. Read [database/README.md](./database/README.md) for MongoDB schema
3. Check [README.md](./README.md) for project requirements

## 🆘 Need Help?

- MongoDB Issues: [docs.mongodb.com](https://docs.mongodb.com)
- Next.js Issues: [nextjs.org/docs](https://nextjs.org/docs)
- Email Issues: [nodemailer.com](https://nodemailer.com)
