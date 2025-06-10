import { redirect } from "next/navigation";

export default function LearningPath({ 
  params 
}: { 
  params: Promise<{ level: string }> 
}) {
  redirect('/learn');
}