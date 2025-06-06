import { notFound } from "next/navigation";

const validLevels = ["beginner", "intermediate", "advanced"];

export async function generateStaticParams() {
  return validLevels.map((level) => ({
    level: level,
  }));
}

export default function LearningPath({ params }: { params: { level: string } }) {
  if (!validLevels.includes(params.level)) {
    return notFound();
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">
        {params.level.charAt(0).toUpperCase() + params.level.slice(1)} Learning Path
      </h1>
      <p className="text-muted-foreground">
        Content for {params.level} level coming soon...
      </p>
    </div>
  );
}