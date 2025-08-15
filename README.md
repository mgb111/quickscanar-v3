# QuickScanAR v3

A modern AR experience creation platform built with Next.js, Supabase, and MindAR.

## Features

- **AR Experience Creation**: Upload videos and custom MindAR files to create interactive AR experiences
- **Real-time Compilation**: Compile MindAR files on-the-fly with progress tracking
- **User Authentication**: Secure user accounts with email/password and Google OAuth
- **Dashboard**: Manage and organize your AR experiences
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Authentication

### Google OAuth ✅ **FULLY IMPLEMENTED**

Google Sign-In is now fully implemented and ready to use:

- **Sign-in/Signup pages** with Google OAuth buttons
- **OAuth callback handling** with proper error management
- **Session management** through Supabase Auth
- **Error display** for OAuth failures
- **Debug page** for testing authentication

#### Setup Required:
1. Configure Google OAuth in Google Cloud Console
2. Enable Google provider in Supabase dashboard
3. Add OAuth credentials to Supabase

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed setup instructions.

### Email/Password Authentication ✅ **IMPLEMENTED**

Traditional email/password authentication is also available as an alternative.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quickscanar-v3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Configure Google OAuth** (optional)
   - Follow the setup guide in [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Visit `/debug` to test authentication
   - Visit `/auth/signin` to test Google OAuth

## Project Structure

```
quickscanar-v3/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## Authentication Flow

1. **User clicks "Sign in with Google"**
2. **Supabase redirects to Google OAuth**
3. **Google redirects back with authorization code**
4. **Callback route exchanges code for session**
5. **User is redirected to dashboard**

## Testing

- **Debug Page**: `/debug` - Test authentication and system status
- **Sign-in Page**: `/auth/signin` - Test Google OAuth flow
- **Sign-up Page**: `/auth/signup` - Create new accounts

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
1. Check the [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for OAuth setup
2. Review the debug page at `/debug`
3. Check browser console and network tabs for errors
4. Verify Supabase configuration and logs 