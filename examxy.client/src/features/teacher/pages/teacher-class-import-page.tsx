import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { AddStudentDialog } from "@/features/teacher/components/add-student-dialog";
import { getClassDashboardRequest } from "@/features/class-content/lib/class-content-api";
import { getErrorMessage } from "@/lib/http/api-error";
import type { ClassDashboard } from "@/types/class-content";

export function TeacherClassImportPage() {
  const { classId = "" } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await getClassDashboardRequest(classId);
        if (isMounted) {
          setDashboard(response);
        }
      } catch (nextError) {
        if (isMounted) {
          setError(getErrorMessage(nextError, "Khong the tai thong tin lop hoc."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  if (!classId) {
    return <Navigate replace to="/teacher/dashboard" />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <Notice tone="error" title="Khong the mo trang nhap hoc sinh">
        {error ?? "Lop hoc khong kha dung."}
      </Notice>
    );
  }

  return (
    <AddStudentDialog
      classId={classId}
      initialView="IMPORT_INPUT"
      joinCode={dashboard.classCode}
      onClose={() => navigate(`/classes/${classId}`)}
      open
    />
  );
}
