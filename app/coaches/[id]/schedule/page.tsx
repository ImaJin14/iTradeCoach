import { supabase } from "@/lib/supabase";
import CoachScheduleContent from "@/components/CoachScheduleContent";

// Generate static params for all coach schedule pages
export async function generateStaticParams() {
  try {
    // Fetch all coach IDs from your database
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

interface CoachSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachSchedulePage({ params }: CoachSchedulePageProps) {
  const { id } = await params;
  
  return <CoachScheduleContent coachId={id} />;
}