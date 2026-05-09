import { PaperExamTemplatesPageContent } from '@/features/paper-exams/components/paper-exam-templates-page-content'
import { usePaperExamTemplatesPage } from '@/features/paper-exams/hooks/use-paper-exam-templates-page'

export function PaperExamTemplatesPage() {
  const controller = usePaperExamTemplatesPage()

  return <PaperExamTemplatesPageContent controller={controller} />
}
