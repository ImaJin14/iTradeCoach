import { supabase } from "@/lib/supabase";
import CoachProfileContent from "@/components/CoachProfileContent";

// Generate static params for all coach profiles
export async function generateStaticParams() {
  try {
    // Fetch all verified coach IDs from your database
    const { data: coaches, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'coach');

    if (error) {
      console.error('Error fetching coaches for static generation:', error);
      return [];
    }

    // Return array of params objects
    return coaches?.map((coach) => ({
      id: coach.id,
    })) || [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

interface CoachProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachProfilePage({ params }: CoachProfilePageProps) {
  const { id } = await params;
  
  return <CoachProfileContent coachId={id} />;
}