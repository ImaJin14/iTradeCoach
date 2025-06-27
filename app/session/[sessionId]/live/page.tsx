"use client";

import { useParams } from "next/navigation";
import LiveSessionRoom from "@/components/LiveSessionRoom";

export default function LiveSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  return <LiveSessionRoom sessionId={sessionId} />;
}