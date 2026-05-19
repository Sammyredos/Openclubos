"use client";

import { useParams, useRouter } from "next/navigation";
import { CreateCourseWizard } from "@/components/courses/CreateCourseWizard";

export default function EditGolfCoursePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  return (
    <CreateCourseWizard
      isPageMode={true}
      courseId={id}
      onClose={() => router.push("/super-admin/golf-courses")}
      onSuccess={() => router.push("/super-admin/golf-courses")}
    />
  );
}
