// app/login/page.tsx (Server Component)

import { Card, CardContent } from '@/components/ui/card';

// Simple Google icon component
const GoogleIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#161616] relative overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/Avalink.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60" />

      <Card className="w-96 text-center bg-white/5 backdrop-blur-md border border-white/20 shadow-xl relative z-10">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
              <p className="text-gray-300">Sign in to continue to your account</p>
            </div>
            
            <a
              href="http://localhost:3000/api/auth/google/signin"
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 transition-all duration-300 hover:shadow-lg group"
            >
              <GoogleIcon />
              <span className="text-sm font-medium text-white group-hover:text-gray-100">
                Continue with Google
              </span>
            </a>
            
            <div className="text-xs text-gray-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
