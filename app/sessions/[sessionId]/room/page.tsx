"use client";

import { useParams } from "next/navigation";
import IndividualSessionRoom from "@/components/IndividualSessionRoom";

export default function IndividualSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  return <IndividualSessionRoom sessionId={sessionId} />;
}