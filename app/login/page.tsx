// app/login/page.tsx (Server Component)
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <a
        href="https://api-avalink.portos.cloud/api/auth/google/signin"
        className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition"
      >
        <img src="/google-logo.png" alt="Google" className="w-5 h-5" />
        <span className="text-sm font-medium text-gray-700">Login with Google</span>
      </a>
    </div>
  );
}
