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
    // 1. Fetch profile first
    const { data: pData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (pData) {
      profile = pData as Profile;
      // 2. Fetch assigned batch if present
      if (pData.batch_id) {
        const { data: bData } = await supabase
          .from('batches')
          .select('*')
          .eq('id', pData.batch_id)
          .single();
        if (bData && profile) {
          profile.batches = bData;
        }
      }
    }
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
