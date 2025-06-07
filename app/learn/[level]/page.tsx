import { redirect } from "next/navigation";

export default function LearningPath({ params }: { params: { level: string } }) {
  redirect('/learn');
}