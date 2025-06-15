import { redirect } from "next/navigation";

// Add generateStaticParams for static export compatibility
export async function generateStaticParams() {
  // Define the learning levels you want to support
  return [
    { level: 'beginner' },
    { level: 'intermediate' },
    { level: 'advanced' },
  ];
}

export default async function LearningPath({ 
  params 
}: { 
  params: Promise<{ level: string }> 
}) {
  // Await the params if needed (though we're redirecting anyway)
  const { level } = await params;
  
  // You could add validation here if needed
  // const validLevels = ['beginner', 'intermediate', 'advanced'];
  // if (!validLevels.includes(level)) {
  //   redirect('/learn');
  // }
  
  redirect('/learn');
}