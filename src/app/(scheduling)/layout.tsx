import { AuthProvider } from '@/context/AuthContext';

export default function SchedulingLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
