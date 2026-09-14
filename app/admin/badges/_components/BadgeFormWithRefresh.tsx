"use client";

import { useRouter } from "next/navigation";
import BadgeForm from "./BadgeForm";

export default function BadgeFormWithRefresh() {
  const router = useRouter();
  return <BadgeForm onCreated={() => router.refresh()} />;
}
