import { createClient } from '@supabase/supabase-js';
import CoachProfileContent from "@/components/CoachProfileContent";

// Generate static params for all coach profiles
export async function generateStaticParams() {
  try {
    // Use service role key for build-time database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This is the key change!
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch all verified coach IDs from your database
    const { data: coaches, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'coach');

    if (error) {
      console.error('Error fetching coaches for static generation:', error);
      return []; // Return empty array instead of letting it crash
    }

    // Return array of params objects
    return coaches?.map((coach) => ({
      id: coach.id,
    })) || [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return []; // Return empty array instead of letting it crash
  }
}

interface CoachProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachProfilePage({ params }: CoachProfilePageProps) {
  const { id } = await params;
  
  return <CoachProfileContent coachId={id} />;
}