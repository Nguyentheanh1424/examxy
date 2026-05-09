import { ClassDashboardPageContent } from "@/features/class-dashboard/components/class-dashboard-page-content";
import { useClassDashboardPage } from "@/features/class-dashboard/hooks/use-class-dashboard-page";

export function ClassDashboardPage() {
  const controller = useClassDashboardPage();

  return <ClassDashboardPageContent controller={controller} />;
}
