import type { Metadata } from 'next';
import LoginForm from '@/features/admin/components/LoginForm';

export const metadata: Metadata = { title: 'Account Login', robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ctiks-cream px-5 py-12">
      <LoginForm />
    </main>
  );
}
