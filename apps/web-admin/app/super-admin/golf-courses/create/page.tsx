"use client";

import { CreateCourseWizard } from "@/components/courses/CreateCourseWizard";
import { useRouter } from "next/navigation";

export default function CreateGolfCoursePage() {
  const router = useRouter();
  return (
    <CreateCourseWizard
      isPageMode={true}
      onClose={() => router.push("/super-admin/golf-courses")}
      onSuccess={() => router.push("/super-admin/golf-courses")}
    />
  );
}
