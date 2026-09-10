import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import OfflineBanner from '@/components/OfflineBanner';
import { Profile } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*, batches(*)')
      .eq('id', user.id)
      .single();
    profile = data as Profile | null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <OfflineBanner />
      <Navbar profile={profile} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
