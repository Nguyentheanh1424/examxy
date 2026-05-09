import {
  BookOpenText,
  ClipboardPaste,
  PlusCircle,
  RefreshCcw,
  Search,
  Tags,
  X,
  Archive,
  CheckCircle2,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { PageHeader } from '@/components/ui/page-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import {
  FilterChip,
  QuestionFormCard,
  QuestionListCard,
  QuestionPreviewPanel,
} from '@/features/question-bank/components/question-bank-components'
import {
  archiveQuestionRequest,
  completeQuestionBankAttachmentUploadRequest,
  createQuestionBankAttachmentUploadUrlRequest,
  createQuestionRequest,
  deleteQuestionPermanentlyRequest,
  getQuestionsRequest,
  previewQuestionImportRequest,
  restoreQuestionRequest,
  searchQuestionsRequest,
  updateQuestionRequest,
} from '@/features/question-bank/lib/question-bank-api'
import {
  applyQuestionTypeDefaults,
  emptyDraft,
  getCurrentVersion,
  getQuestionTypeLabel,
  mergeImportedDraft,
  normalizeQuestionType,
  normalizeStatus,
  questionTypeOptions,
  questionMatchesQuery,
  toCreateRequest,
  toDraftState,
  toDraftStateFromCreateRequest,
  toUpdateRequest,
  validateQuestionDraft,
  type DraftImageAttachment,
  type QuestionDraftState,
  type QuestionTypeValue,
  type StatusTab,
} from '@/features/question-bank/lib/question-bank-display'
import { getErrorMessage } from '@/lib/http/api-error'
import { cn } from '@/lib/utils/cn'
import type { Question, QuestionImportPreviewResponse } from '@/types/question-bank'

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [draft, setDraft] = useState<QuestionDraftState>(emptyDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<QuestionDraftState>(emptyDraft)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [statusTab, setStatusTab] = useState<StatusTab>('Active')
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | QuestionTypeValue>('All')
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; message: string } | null>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createMode, setCreateMode] = useState<'manual' | 'import'>('manual')
  const [importQuestionType, setImportQuestionType] = useState<QuestionTypeValue>('SingleChoice')
  const [importRawText, setImportRawText] = useState('')
  const [importPreview, setImportPreview] = useState<QuestionImportPreviewResponse | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState<string | null>(null)
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkMode, setIsBulkMode] = useState(false)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    questions.forEach((question) => {
      question.tags.forEach((tag) => tags.add(tag))
    })

    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [questions])

  const typeFilters = useMemo(() => {
    const types = new Set<QuestionTypeValue>()
    questions.forEach((question) => {
      const currentVersion = getCurrentVersion(question)
      if (currentVersion?.questionType) {
        types.add(normalizeQuestionType(currentVersion.questionType))
      }
    })

    return questionTypeOptions.filter((option) => types.has(option.value))
  }, [questions])

  const difficultyFilters = useMemo(() => {
    const difficulties = new Set<string>()
    questions.forEach((question) => {
      const currentVersion = getCurrentVersion(question)
      const difficulty = currentVersion?.difficulty.trim()
      if (difficulty) {
        difficulties.add(difficulty)
      }
    })

    return Array.from(difficulties).sort((a, b) => a.localeCompare(b))
  }, [questions])

  const counts = useMemo(() => ({
    Active: questions.filter((question) => normalizeStatus(question.status) === 'Active').length,
    Archived: questions.filter((question) => normalizeStatus(question.status) === 'Archived').length,
    All: questions.length,
  }), [questions])

  const filteredQuestions = useMemo(() => (
    questions.filter((question) => {
      if (statusTab !== 'All' && normalizeStatus(question.status) !== statusTab) {
        return false
      }

      const currentVersion = getCurrentVersion(question)

      if (selectedTags.length > 0 && !selectedTags.every((tag) => question.tags.includes(tag))) {
        return false
      }

      if (
        selectedTypeFilter !== 'All' &&
        normalizeQuestionType(currentVersion?.questionType) !== selectedTypeFilter
      ) {
        return false
      }

      if (
        selectedDifficultyFilter !== 'All' &&
        currentVersion?.difficulty !== selectedDifficultyFilter
      ) {
        return false
      }

      return questionMatchesQuery(question, query)
    })
  ), [query, questions, selectedDifficultyFilter, selectedTags, selectedTypeFilter, statusTab])

  const selectedQuestion = selectedQuestionId
    ? questions.find((question) => question.id === selectedQuestionId) ?? null
    : null

  async function loadQuestions() {
    try {
      // Try fetching via search with no status to get all questions (Active + Archived)
      const searchResult = await searchQuestionsRequest({
        pageSize: 1000,
      })
      setQuestions(searchResult.items)
    } catch {
      // Fallback to basic list if search fails
      const response = await getQuestionsRequest()
      setQuestions(response)
    }
  }

  function beginEdit(question: Question) {
    setSelectedQuestionId(question.id)
    setEditId(question.id)
    setEditDraft(toDraftState(question))
  }

  function closeEditDrawer() {
    setEditId(null)
    setEditDraft(emptyDraft)
  }

  function closeCreateDrawer() {
    setCreateDrawerOpen(false)
    setCreateMode('manual')
    setImportQuestionType('SingleChoice')
    setImportRawText('')
    setImportPreview(null)
  }

  function resetFilters() {
    setStatusTab('Active')
    setQuery('')
    setSelectedTags([])
    setSelectedTypeFilter('All')
    setSelectedDifficultyFilter('All')
    setSelectedIds([])
    setIsBulkMode(false)
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((candidate) => candidate !== tag)
        : [...current, tag]
    ))
  }

  function handlePreviewQuestion(questionId: string) {
    if (isBulkMode) {
      toggleSelection(questionId)
      return
    }
    setSelectedQuestionId(questionId)
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 1279px)').matches
    ) {
      setPreviewDrawerOpen(true)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredQuestions.map((q) => q.id))
    }
  }

  async function handleBulkArchive() {
    setBusyKey('bulk-archive')
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const q = questions.find((item) => item.id === id)
          if (q) await archiveQuestionRequest(id, toUpdateRequest(q, toDraftState(q)))
        }),
      )
      await loadQuestions()
      setSelectedIds([])
      setIsBulkMode(false)
      setNotice({ tone: 'success', title: 'Đã lưu trữ hàng loạt', message: `Đã lưu trữ ${selectedIds.length} câu hỏi.` })
    } catch (err) {
      setNotice({ tone: 'error', title: 'Lỗi lưu trữ hàng loạt', message: getErrorMessage(err, 'Không thể lưu trữ một số câu hỏi.') })
    } finally {
      setBusyKey(null)
    }
  }

  async function uploadStemImage(file: File, target: 'create' | 'edit') {
    const reservation = await createQuestionBankAttachmentUploadUrlRequest({
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    })
    const completed = await completeQuestionBankAttachmentUploadRequest({
      attachmentId: reservation.attachmentId,
      base64Content: await readFileAsBase64(file),
    })
    const nextAttachment: DraftImageAttachment = {
      id: completed.id,
      fileName: completed.fileName,
      contentType: completed.contentType,
      fileSizeBytes: completed.fileSizeBytes,
      downloadUrl: URL.createObjectURL(file),
      altText: file.name,
      caption: '',
    }
    const updateDraft = (current: QuestionDraftState) => ({
      ...current,
      imageAttachments: [...current.imageAttachments, nextAttachment],
    })

    if (target === 'create') {
      setDraft(updateDraft)
      return
    }

    setEditDraft(updateDraft)
  }

  async function handleImportPreview() {
    if (!importRawText.trim()) {
      setImportPreview({
        status: 'Failed',
        questionType: importQuestionType,
        draft: toCreateRequest(applyImportedType(emptyDraft, importQuestionType)),
        warnings: [],
        errors: [
          {
            code: 'RawTextRequired',
            message: 'Dán nội dung một câu trước khi parse.',
            path: 'rawText',
          },
        ],
      })
      return
    }

    setBusyKey('import-preview')
    setImportPreview(null)
    setNotice(null)

    try {
      const response = await previewQuestionImportRequest({
        questionType: importQuestionType,
        sourceFormat: 'LatexText',
        rawText: importRawText,
      })
      setImportPreview(response)
      if (response.status !== 'Failed') {
        const importedDraft = toDraftStateFromCreateRequest(response.draft)
        setDraft((current) => mergeImportedDraft(current, importedDraft))
      }
    } catch (nextError) {
      setImportPreview({
        status: 'Failed',
        questionType: importQuestionType,
        draft: toCreateRequest(applyImportedType(emptyDraft, importQuestionType)),
        warnings: [],
        errors: [
          {
            code: 'ImportPreviewFailed',
            message: getErrorMessage(nextError, 'Không thể parse nội dung đã dán.'),
            path: 'rawText',
          },
        ],
      })
    } finally {
      setBusyKey(null)
    }
  }

  useEffect(() => {
    void (async () => {
      setError(null)

      try {
        await loadQuestions()
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'Không thể tải ngân hàng câu hỏi.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationMessage = validateQuestionDraft(draft)
    if (validationMessage) {
      setNotice({
        tone: 'error',
        title: 'Chưa thể tạo câu hỏi',
        message: validationMessage,
      })
      return
    }

    setBusyKey('create-question')
    setNotice(null)

    try {
      await createQuestionRequest(toCreateRequest(draft))
      setDraft(emptyDraft)
      await loadQuestions()
      setCreateDrawerOpen(false)
      setNotice({
        tone: 'success',
        title: 'Câu hỏi đã tạo',
        message: 'Câu hỏi mới đã sẵn sàng cho bài kiểm tra.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể tạo câu hỏi',
        message: getErrorMessage(nextError, 'Kiểm tra dữ liệu câu hỏi và thử lại.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editId) return

    const question = questions.find((candidate) => candidate.id === editId)
    if (!question) return

    const validationMessage = validateQuestionDraft(editDraft)
    if (validationMessage) {
      setNotice({
        tone: 'error',
        title: 'Chưa thể cập nhật câu hỏi',
        message: validationMessage,
      })
      return
    }

    setBusyKey(`update-${editId}`)
    setNotice(null)

    try {
      await updateQuestionRequest(editId, toUpdateRequest(question, editDraft))
      closeEditDrawer()
      await loadQuestions()
      setNotice({
        tone: 'success',
        title: 'Câu hỏi đã cập nhật',
        message: 'Phiên bản mới đã được thêm vào lịch sử câu hỏi.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể cập nhật câu hỏi',
        message: getErrorMessage(nextError, 'Không thể cập nhật câu hỏi.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleArchive(questionId: string) {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    setBusyKey(`archive-${questionId}`)
    setNotice(null)

    try {
      const draft = toDraftState(question)
      await archiveQuestionRequest(questionId, toUpdateRequest(question, draft))
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null)
      }
      if (editId === questionId) {
        closeEditDrawer()
      }
      await loadQuestions()
      setDeleteTargetId(null)
      setNotice({
        tone: 'success',
        title: 'Đã lưu trữ',
        message: 'Câu hỏi đã được chuyển vào mục Đã lưu trữ.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể lưu trữ',
        message: getErrorMessage(nextError, 'Đã xảy ra lỗi khi lưu trữ câu hỏi.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDeletePermanently(questionId: string) {
    setBusyKey(`delete-${questionId}`)
    setNotice(null)

    try {
      await deleteQuestionPermanentlyRequest(questionId)
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null)
      }
      if (editId === questionId) {
        closeEditDrawer()
      }
      await loadQuestions()
      setPermanentDeleteTargetId(null)
      setNotice({
        tone: 'success',
        title: 'Đã xóa vĩnh viễn',
        message: 'Câu hỏi đã bị xóa hoàn toàn khỏi hệ thống.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể xóa vĩnh viễn',
        message: getErrorMessage(nextError, 'Đã xảy ra lỗi khi xóa vĩnh viễn câu hỏi.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleRestore(questionId: string) {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    setBusyKey(`restore-${questionId}`)
    setNotice(null)

    try {
      const draft = toDraftState(question)
      await restoreQuestionRequest(questionId, toUpdateRequest(question, draft))
      await loadQuestions()
      setNotice({
        tone: 'success',
        title: 'Đã khôi phục',
        message: 'Câu hỏi đã quay lại danh sách hoạt động.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể khôi phục',
        message: getErrorMessage(nextError, 'Đã xảy ra lỗi khi khôi phục câu hỏi.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 max-w-2xl" />
          </div>
        </CardShell>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <CardShell className="p-5" key={index}>
                <Skeleton className="mb-3 h-4 w-28" />
                <Skeleton className="mb-3 h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardShell>
            ))}
          </div>
          <CardShell className="hidden p-5 lg:block">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="mb-3 h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardShell>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <nav aria-label="Ngân hàng câu hỏi page actions" className="flex flex-wrap gap-3">
              <Button
                leftIcon={<PlusCircle className="size-4" />}
                onClick={() => { setCreateDrawerOpen(true) }}
              >
                Tạo câu hỏi
              </Button>
              <Link to="/teacher/dashboard">
                <Button variant="secondary">Quay lại</Button>
              </Link>
          </nav>
        }
        description="Quản lý và tái sử dụng câu hỏi trắc nghiệm cho các bài kiểm tra."
        eyebrow="Ngân hàng học liệu"
        title="Ngân hàng câu hỏi"
      />

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <StatsCard icon={<BookOpenText className="size-5 text-brand" />} label="Tổng số câu" value={counts.All} />
        <StatsCard icon={<CheckCircle2 className="size-5 text-success" />} label="Đang hoạt động" value={counts.Active} />
        <StatsCard icon={<Archive className="size-5 text-warning" />} label="Đã lưu trữ" value={counts.Archived} />
        <StatsCard icon={<Tags className="size-5 text-info" />} label="Tổng số thẻ" value={allTags.length} />
      </div>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Không thể tải ngân hàng câu hỏi">
          {error}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-6">
          <CardShell className="p-2 border-none bg-transparent shadow-none">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-surface rounded-2xl border border-line shadow-sm">
                <Tabs
                  className="space-y-0 bg-panel p-1 rounded-full border border-line"
                  onValueChange={(value) => setStatusTab(value as StatusTab)}
                  value={statusTab}
                >
                  <TabsList className="bg-transparent border-none">
                    {(['Active', 'Archived', 'All'] as const).map((tab) => (
                      <TabsTrigger key={tab} value={tab} className="rounded-full px-6 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        {tab === 'Active' ? 'Hoạt động' : tab === 'Archived' ? 'Lưu trữ' : 'Tất cả'} 
                        <Badge tone="neutral" variant="soft" className="ml-2 font-mono text-[10px]">{counts[tab]}</Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="flex-1 max-w-md relative group">
                  <TextField
                    label="Tìm kiếm câu hỏi"
                    aria-label="Tìm kiếm câu hỏi"
                    className="pl-10 pr-4 h-11 rounded-full border-line group-focus-within:border-brand group-focus-within:ring-4 group-focus-within:ring-brand/10 transition-all"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm nội dung, mã hoặc thẻ..."
                    value={query}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted group-focus-within:text-brand transition-colors" />
                </div>

                <div className="flex items-center gap-2">
                   <Button
                    leftIcon={<RefreshCcw className="size-4" />}
                    onClick={() => { void loadQuestions() }}
                    variant="secondary"
                    className="rounded-full h-11 px-6"
                  >
                    Làm mới
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {allTags.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/45">
                      <Tags className="size-4 text-brand-strong" />
                      Thẻ
                      {selectedTags.length > 0 ? (
                        <Badge tone="primary" variant="soft">{selectedTags.length}</Badge>
                      ) : null}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-80 overflow-auto">
                      {allTags.map((tag) => (
                        <DropdownMenuCheckboxItem
                          checked={selectedTags.includes(tag)}
                          key={tag}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                {typeFilters.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/45">
                      Loại
                      {selectedTypeFilter !== 'All' ? (
                        <Badge tone="primary" variant="soft">{getQuestionTypeLabel(selectedTypeFilter)}</Badge>
                      ) : null}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-80 overflow-auto">
                      <DropdownMenuCheckboxItem
                        checked={selectedTypeFilter === 'All'}
                        onClick={() => setSelectedTypeFilter('All')}
                      >
                        Tất cả loại
                      </DropdownMenuCheckboxItem>
                      {typeFilters.map((option) => (
                        <DropdownMenuCheckboxItem
                          checked={selectedTypeFilter === option.value}
                          key={option.value}
                          onClick={() => setSelectedTypeFilter(option.value)}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                {difficultyFilters.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/45">
                      Độ khó
                      {selectedDifficultyFilter !== 'All' ? (
                        <Badge tone="primary" variant="soft">{selectedDifficultyFilter}</Badge>
                      ) : null}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-80 overflow-auto">
                      <DropdownMenuCheckboxItem
                        checked={selectedDifficultyFilter === 'All'}
                        onClick={() => setSelectedDifficultyFilter('All')}
                      >
                        Tất cả độ khó
                      </DropdownMenuCheckboxItem>
                      {difficultyFilters.map((difficulty) => (
                        <DropdownMenuCheckboxItem
                          checked={selectedDifficultyFilter === difficulty}
                          key={difficulty}
                          onClick={() => setSelectedDifficultyFilter(difficulty)}
                        >
                          {difficulty}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                {selectedTags.map((tag) => (
                  <FilterChip
                    active
                    key={tag}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </FilterChip>
                ))}

                {selectedTypeFilter !== 'All' ? (
                  <FilterChip active onClick={() => setSelectedTypeFilter('All')}>
                    {getQuestionTypeLabel(selectedTypeFilter)}
                  </FilterChip>
                ) : null}

                {selectedDifficultyFilter !== 'All' ? (
                  <FilterChip active onClick={() => setSelectedDifficultyFilter('All')}>
                    {selectedDifficultyFilter}
                  </FilterChip>
                ) : null}

                {query || selectedTags.length > 0 || selectedTypeFilter !== 'All' || selectedDifficultyFilter !== 'All' || statusTab !== 'Active' ? (
                  <Button
                    leftIcon={<X className="size-4" />}
                    onClick={resetFilters}
                    type="button"
                    variant="ghost"
                  >
                    Xóa bộ lọc
                  </Button>
                ) : null}
              </div>
            </div>
          </CardShell>

          {questions.length === 0 ? (
            <EmptyState
              action={{
                label: 'Tạo câu hỏi',
                onClick: () => {
                  setCreateDrawerOpen(true)
                },
                leftIcon: <PlusCircle className="size-4" />,
              }}
              description="Tạo câu hỏi tái sử dụng đầu tiên, sau đó thêm thẻ và dữ liệu đáp án JSON cho việc soạn bài kiểm tra."
              title="Chưa có câu hỏi nào"
              variant="no-data"
            />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              action={{
                label: 'Xóa bộ lọc',
                onClick: resetFilters,
                leftIcon: <RefreshCcw className="size-4" />,
              }}
              description="Thử từ khóa tìm kiếm, trạng thái hoặc bộ lọc thẻ khác."
              title="Không có câu hỏi phù hợp"
              variant="no-results"
            />
          ) : (
            <>
              <div className="flex items-center justify-between rounded-2xl bg-brand-soft/20 px-5 py-3 border border-brand/10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="size-4 rounded border-line text-brand focus:ring-brand"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredQuestions.length}
                      onChange={toggleSelectAll}
                    />
                    <p className="text-sm font-bold text-ink">
                      Chọn tất cả <span className="font-mono text-brand-strong">({filteredQuestions.length})</span>
                    </p>
                  </div>
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                       <Badge tone="primary" variant="solid" className="rounded-full px-3">{selectedIds.length} đã chọn</Badge>
                       <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 rounded-full"
                        leftIcon={<Archive className="size-3.5" />}
                        onClick={handleBulkArchive}
                        isLoading={busyKey === 'bulk-archive'}
                       >
                         Lưu trữ hàng loạt
                       </Button>
                    </div>
                  )}
                </div>
                <p className="hidden sm:block text-xs font-bold text-muted uppercase tracking-widest">
                  Ngân hàng câu hỏi • {statusTab}
                </p>
              </div>

              {filteredQuestions.map((question) => (
                <QuestionListCard
                  isSelected={question.id === selectedQuestionId}
                  isBulkMode={isBulkMode || selectedIds.length > 0}
                  isItemSelected={selectedIds.includes(question.id)}
                  onToggleSelection={toggleSelection}
                  key={question.id}
                  onArchive={(id) => setDeleteTargetId(id)}
                  onDeletePermanently={(id) => setPermanentDeleteTargetId(id)}
                  onEdit={beginEdit}
                  onPreview={handlePreviewQuestion}
                  onRestore={(id) => handleRestore(id)}
                  onSelect={(id) => handlePreviewQuestion(id)}
                  question={question}
                />
              ))}
            </>
          )}

        </div>

        <aside className="hidden space-y-6 xl:sticky xl:top-6 xl:block self-start max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar pr-1">
          {selectedQuestion && !previewDrawerOpen ? (
            <QuestionPreviewPanel
              busyKey={busyKey}
              editId={editId}
              onArchive={(questionId) => { setDeleteTargetId(questionId) }}
              onDeletePermanently={(id) => setPermanentDeleteTargetId(id)}
              onEdit={beginEdit}
              onRestore={(questionId) => handleRestore(questionId)}
              question={selectedQuestion}
            />
          ) : (
            <CardShell className="p-6">
              <div className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-[var(--radius-input)] bg-brand-soft text-brand-strong">
                  <BookOpenText className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                    Chọn câu hỏi
                  </h2>
                  <p className="text-base leading-7 text-muted">
                    Chọn một câu hỏi từ danh sách để xem phiên bản hiện tại,
                    thẻ, tệp đính kèm và dữ liệu JSON.
                  </p>
                </div>
              </div>
            </CardShell>
          )}
        </aside>
      </div>

      <Drawer onOpenChange={setCreateDrawerOpen} open={createDrawerOpen}>
        {createDrawerOpen ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Tạo câu hỏi</DrawerTitle>
              <DrawerDescription>
                Thêm câu hỏi tái sử dụng; hệ thống sẽ tự chuẩn hóa lựa chọn và đáp án khi lưu.
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-5 border-b border-line px-6 pb-5">
              <Tabs
                className="space-y-0"
                onValueChange={(value) => {
                  setCreateMode(value as 'manual' | 'import')
                  setImportPreview(null)
                }}
                value={createMode}
              >
                <TabsList>
                  <TabsTrigger value="manual">Tạo thủ công</TabsTrigger>
                  <TabsTrigger value="import">Nhập từ LaTeX/text</TabsTrigger>
                </TabsList>
              </Tabs>

              {createMode === 'import' ? (
                <QuestionImportPanel
                  busyKey={busyKey}
                  importPreview={importPreview}
                  importQuestionType={importQuestionType}
                  importRawText={importRawText}
                  onImportQuestionTypeChange={(questionType) => {
                    setImportQuestionType(questionType)
                    setDraft((current) => applyQuestionTypeDefaults(current, questionType))
                    setImportPreview(null)
                  }}
                  onImportRawTextChange={(value) => {
                    setImportRawText(value)
                    setImportPreview(null)
                  }}
                  onPreviewImport={() => { void handleImportPreview() }}
                />
              ) : null}
            </div>
            {createMode === 'manual' && (
              <QuestionFormCard
                availableTags={allTags}
                busyKey={busyKey}
                draft={draft}
                heading="Thêm câu hỏi tái sử dụng"
                onDraftChange={setDraft}
                onImageUpload={(file) => uploadStemImage(file, 'create')}
                onSubmit={handleCreate}
                submitLabel="Tạo câu hỏi"
                title="Tạo câu hỏi"
                unframed
              />
            )}
            <DrawerFooter>
              <Button onClick={closeCreateDrawer} variant="secondary">
                Đóng
              </Button>
            </DrawerFooter>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer onOpenChange={(open) => { if (!open) closeEditDrawer() }} open={editId !== null}>
        {editId !== null ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Sửa câu hỏi</DrawerTitle>
              <DrawerDescription>
                Lưu phiên bản mới mà vẫn giữ nguyên thông tin câu hỏi.
              </DrawerDescription>
            </DrawerHeader>
            <QuestionFormCard
              availableTags={allTags}
              busyKey={busyKey}
              draft={editDraft}
              heading="Lưu phiên bản mới với trạng thái giữ nguyên"
              onDraftChange={setEditDraft}
              onImageUpload={(file) => uploadStemImage(file, 'edit')}
              onSubmit={handleUpdate}
              submitLabel="Lưu phiên bản mới"
              title="Sửa câu hỏi hiện tại"
              unframed
            />
            <DrawerFooter>
              <Button onClick={closeEditDrawer} variant="secondary">
                Hủy chỉnh sửa
              </Button>
            </DrawerFooter>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer onOpenChange={setPreviewDrawerOpen} open={previewDrawerOpen && selectedQuestion !== null}>
        {previewDrawerOpen && selectedQuestion ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Xem trước câu hỏi</DrawerTitle>
              <DrawerDescription>
                Xem câu hỏi đã chọn mà không rời khỏi danh sách.
              </DrawerDescription>
            </DrawerHeader>
            <QuestionPreviewPanel
              busyKey={busyKey}
              editId={editId}
              onArchive={(questionId) => { setDeleteTargetId(questionId) }}
              onDeletePermanently={(id) => setPermanentDeleteTargetId(id)}
              onEdit={beginEdit}
              onRestore={(questionId) => handleRestore(questionId)}
              question={selectedQuestion}
            />
            <DrawerFooter>
              <Button onClick={() => setPreviewDrawerOpen(false)} variant="secondary">
                Đóng xem trước
              </Button>
            </DrawerFooter>
          </DrawerContent>
        ) : null}
      </Drawer>

      <AlertDialog
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
        open={deleteTargetId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lưu trữ câu hỏi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Câu hỏi sẽ được chuyển vào mục Đã lưu trữ. Bạn có thể khôi phục lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTargetId(null) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteTargetId || busyKey === `archive-${deleteTargetId}`}
              onClick={() => {
                if (deleteTargetId) {
                  void handleArchive(deleteTargetId)
                }
              }}
            >
              Lưu trữ câu hỏi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => { if (!open) setPermanentDeleteTargetId(null) }}
        open={permanentDeleteTargetId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn câu hỏi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Câu hỏi sẽ bị xóa hoàn toàn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPermanentDeleteTargetId(null) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 text-white"
              disabled={!permanentDeleteTargetId || busyKey === `delete-${permanentDeleteTargetId}`}
              onClick={() => {
                if (permanentDeleteTargetId) {
                  void handleDeletePermanently(permanentDeleteTargetId)
                }
              }}
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatsCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <CardShell className="p-4 flex items-center gap-4 border-line shadow-sm transition-all hover:shadow-md bg-surface">
      <div className="size-10 rounded-2xl bg-panel flex items-center justify-center border border-line/50 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-ink leading-none">{value}</p>
      </div>
    </CardShell>
  )
}

const importSamples: Array<{
  title: string
  questionType: QuestionTypeValue
  value: string
}> = [
  {
    title: 'Một đáp án',
    questionType: 'SingleChoice',
    value: 'Câu 1. Tính \\\\(1+1\\\\)?\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: B',
  },
  {
    title: 'Nhiều đáp án',
    questionType: 'MultipleChoice',
    value: 'Câu 1. Chọn các số chẵn.\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: B, D',
  },
  {
    title: 'Đúng / Sai',
    questionType: 'TrueFalse',
    value: 'Mệnh đề: Số 2 là số nguyên tố.\nĐáp án: Đúng',
  },
]

function QuestionImportPanel({
  busyKey,
  importPreview,
  importQuestionType,
  importRawText,
  onImportQuestionTypeChange,
  onImportRawTextChange,
  onPreviewImport,
}: {
  busyKey: string | null
  importPreview: QuestionImportPreviewResponse | null
  importQuestionType: QuestionTypeValue
  importRawText: string
  onImportQuestionTypeChange: (questionType: QuestionTypeValue) => void
  onImportRawTextChange: (value: string) => void
  onPreviewImport: () => void
}) {
  const importTypes = questionTypeOptions.filter((option) => (
    option.value === 'SingleChoice' ||
    option.value === 'MultipleChoice' ||
    option.value === 'TrueFalse'
  ))

  return (
    <section className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3 p-1 bg-panel border border-line rounded-xl">
        {importTypes.map((option) => (
          <button
            aria-pressed={importQuestionType === option.value}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-h-[70px] rounded-lg border transition-all duration-300",
              importQuestionType === option.value 
                ? "bg-white border-line shadow-sm text-brand-strong ring-1 ring-brand/5" 
                : "border-transparent text-muted hover:text-ink hover:bg-white/50"
            )}
            key={option.value}
            onClick={() => onImportQuestionTypeChange(option.value)}
            type="button"
          >
            <span className="block font-semibold">{option.label}</span>
          </button>
        ))}
      </div>

      <TextareaField
        label="Nội dung LaTeX/text của một câu"
        onChange={(event) => onImportRawTextChange(event.target.value)}
        placeholder={'Câu 1. Tính \\\\(1+1\\\\)?\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: B'}
        rows={8}
        value={importRawText}
      />

      <Accordion collapsible>
        <AccordionItem value="import-samples">
          <AccordionTrigger>Mẫu nhập</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              {importSamples.map((sample) => (
                <button
                  className="rounded-[var(--radius-input)] border border-line bg-surface p-3 text-left transition hover:border-brand/30 hover:bg-brand-soft/35"
                  key={sample.title}
                  onClick={() => {
                    onImportQuestionTypeChange(sample.questionType)
                    onImportRawTextChange(sample.value)
                  }}
                  type="button"
                >
                  <span className="font-semibold text-ink">{sample.title}</span>
                  <span className="mt-2 block whitespace-pre-line text-xs leading-5 text-muted">
                    {sample.value}
                  </span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          isLoading={busyKey === 'import-preview'}
          leftIcon={<ClipboardPaste className="size-4" />}
          onClick={onPreviewImport}
          type="button"
          variant="secondary"
        >
          Phân tích nội dung
        </Button>
        {importPreview ? (
          <Badge
            tone={importPreview.status === 'Failed' ? 'error' : importPreview.status === 'ParsedWithWarnings' ? 'warning' : 'success'}
            variant="soft"
          >
            {getImportStatusLabel(importPreview.status)}
          </Badge>
        ) : null}
      </div>

      {importPreview && importPreview.status !== 'Failed' ? (
        <Notice tone="success" title="Đã đổ nội dung vào form bên dưới">
          Bạn có thể chỉnh lại nội dung, lựa chọn, đáp án, thẻ và thời gian trước khi lưu.
        </Notice>
      ) : null}

      {importPreview ? (
        <div className="space-y-3 rounded-[var(--radius-input)] border border-line bg-surface-alt/45 p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Nội dung câu hỏi</p>
            <p className="rounded-[var(--radius-input)] border border-line bg-surface p-3 text-sm leading-6 text-ink">
              {getImportStem(importPreview) || 'Chưa nhận diện được nội dung câu hỏi.'}
            </p>
          </div>
          {importPreview.draft.choices?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Lựa chọn</p>
              <div className="grid gap-2">
                {importPreview.draft.choices.map((choice) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-input)] border border-line bg-surface px-3 py-2 text-sm text-ink"
                    key={choice.id ?? choice.text}
                  >
                    <span>
                      <span className="font-semibold">{choice.id}.</span> {choice.text}
                    </span>
                    {isImportCorrectChoice(importPreview, choice.id) ? (
                      <Badge tone="success" variant="soft">Đáp án đúng</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {getImportExplanation(importPreview) ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Lời giải</p>
              <p className="rounded-[var(--radius-input)] border border-line bg-surface p-3 text-sm leading-6 text-muted">
                {getImportExplanation(importPreview)}
              </p>
            </div>
          ) : null}
          {!importPreview.draft.choices?.length && typeof importPreview.draft.answerKey?.value === 'boolean' ? (
            <div className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
              <p className="text-sm font-semibold text-ink">
                Đáp án đúng: {formatImportAnswerKey(importPreview)}
              </p>
            </div>
          ) : null}
          <ImportDiagnostics title="Cảnh báo" diagnostics={importPreview.warnings} tone="warning" />
          <ImportDiagnostics title="Lỗi" diagnostics={importPreview.errors} tone="error" />
        </div>
      ) : null}
    </section>
  )
}

function ImportDiagnostics({
  diagnostics,
  title,
  tone,
}: {
  diagnostics: QuestionImportPreviewResponse['warnings']
  title: string
  tone: 'warning' | 'error'
}) {
  if (diagnostics.length === 0) {
    return null
  }

  return (
    <Notice tone={tone} title={title}>
      <ul className="list-disc space-y-1 pl-5">
        {diagnostics.map((diagnostic) => (
          <li key={`${diagnostic.code}-${diagnostic.path}`}>
            {formatImportDiagnosticMessage(diagnostic.code, diagnostic.message)}
          </li>
        ))}
      </ul>
    </Notice>
  )
}

function getImportStatusLabel(status: QuestionImportPreviewResponse['status']) {
  if (status === 'Parsed') return 'Đã phân tích'
  if (status === 'ParsedWithWarnings') return 'Có cảnh báo'
  return 'Chưa phân tích được'
}

function getImportStem(importPreview: QuestionImportPreviewResponse) {
  return importPreview.draft.stemPlainText ||
    importPreview.draft.stemText ||
    extractImportDocumentText(importPreview.draft.stem)
}

function getImportExplanation(importPreview: QuestionImportPreviewResponse) {
  return extractImportDocumentText(importPreview.draft.explanation) ||
    importPreview.draft.explanationRichText.replace(/<\/?p>/g, '').trim()
}

function isImportCorrectChoice(
  importPreview: QuestionImportPreviewResponse,
  choiceId: string | undefined,
) {
  if (!choiceId) return false
  return importPreview.draft.answerKey?.correctChoiceIds?.includes(choiceId) ?? false
}

function extractImportDocumentText(document: QuestionImportPreviewResponse['draft']['stem']) {
  if (!document?.blocks?.length) return ''

  return document.blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return block.inline?.map((node) => node.type === 'mathInline'
          ? node.latex ?? ''
          : node.text ?? node.value ?? '').join('') ?? ''
      }

      return block.type === 'mathBlock' ? block.latex ?? '' : ''
    })
    .filter(Boolean)
    .join(' ')
    .trim()
}

function formatImportDiagnosticMessage(code: string, fallback: string) {
  const messages: Record<string, string> = {
    AnswerKeyMissing: 'Chưa tìm thấy đáp án. Bạn có thể chọn đáp án đúng bên dưới.',
    AnswerKeyUnmatched: 'Đáp án phát hiện được chưa khớp với lựa chọn nào. Hãy kiểm tra lại đáp án.',
    ChoicesRequired: 'Cần ít nhất 2 lựa chọn để tạo câu hỏi.',
    DuplicateChoiceId: 'Các nhãn lựa chọn không được trùng nhau.',
    RawTextRequired: 'Dán nội dung một câu trước khi phân tích.',
    StemRequired: 'Chưa tìm thấy nội dung câu hỏi.',
    SingleChoiceAnswerTrimmed: 'Câu một đáp án chỉ giữ đáp án đầu tiên đã phát hiện.',
    UnrecognizedLine: 'Có dòng chưa được nhận diện. Hãy kiểm tra lại nội dung đã dán.',
    UnsupportedQuestionType: 'Chỉ hỗ trợ Một đáp án, Nhiều đáp án, và Đúng / Sai trong bản nhập hiện tại.',
    UnsupportedSourceFormat: 'Chỉ hỗ trợ nhập bằng LaTeX/text trong bản hiện tại.',
  }

  return messages[code] ?? fallback
}

function formatImportAnswerKey(importPreview: QuestionImportPreviewResponse) {
  const answerKey = importPreview.draft.answerKey
  if (answerKey?.correctChoiceIds?.length) {
    return answerKey.correctChoiceIds.join(', ')
  }

  if (typeof answerKey?.value === 'boolean') {
    return answerKey.value ? 'Đúng' : 'Sai'
  }

  return 'N/A'
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function applyImportedType(state: QuestionDraftState, questionType: QuestionTypeValue) {
  return applyQuestionTypeDefaults(state, questionType)
}
