import { ClassAssessmentsPageContent } from '@/features/assessments/components/class-assessments-page-content'
import { useClassAssessmentsPage } from '@/features/assessments/hooks/use-class-assessments-page'

export function ClassAssessmentsPage() {
  const controller = useClassAssessmentsPage()

  return <ClassAssessmentsPageContent controller={controller} />
}
