import type { Dispatch, PointerEvent, ReactNode, RefObject, SetStateAction } from "react";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  Pencil,
  PlusCircle,
  RefreshCcw,
  Search,
  Settings2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { PageHeader } from "@/components/ui/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import {
  MetricPill,
  PaperExamLoadingState,
  TemplateCatalogCard,
  TemplateStatusBadge,
} from "@/features/paper-exams/components/paper-exam-template-cards";
import type { PaperExamTemplatesPageController } from "@/features/paper-exams/hooks/use-paper-exam-templates-page";
import { updateSearchSelection } from "@/features/paper-exams/lib/paper-exam-template-mappers";
import {
  exportTemplateSvgToPdf,
  generateTemplateConfig,
  templateMaster,
  type CircleRoi,
  type IdBubbleField,
  type Point,
  type TemplateSettings,
  TemplateSvgPreview,
} from "@/features/paper-exams/lib/paper-exam-template-generator";
import {
  getVersionSummary,
} from "@/features/paper-exams/lib/paper-exam-display";
import { PaperExamVersionEditor } from "@/features/paper-exams/components/paper-exam-version-editor";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";
import type { PaperExamTemplate, PaperExamTemplateVersion } from "@/types/paper-exam";

type CreateTemplateStep = "INFO" | "METHOD" | "CONFIRM";

export function PaperExamTemplatesPageContent({
  controller,
}: {
  controller: PaperExamTemplatesPageController;
}) {
  const {
    selectedTemplate,
    templateDraft,
    setTemplateDraft,
    selectedVersion,
    isLoading,
    busyKey,
    error,
    notice,
    createDrawerOpen,
    setCreateDrawerOpen,
    cloneDialogOpen,
    setCloneDialogOpen,
    publishDialogOpen,
    setPublishDialogOpen,
    handleCreateTemplate,
    handleCloneVersion,
    handlePublishVersion,
  } = controller;
  const { session } = useAuth();
  const isAdmin = session?.primaryRole === "Admin";
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const selectedPreviewSettings = templateDraft.settings;

  const createPreviewExportRef = useRef<SVGSVGElement>(null);
  const detailPreviewExportRef = useRef<SVGSVGElement>(null);
  const [isExportingCreatePdf, setIsExportingCreatePdf] = useState(false);
  const [isExportingDetailPdf, setIsExportingDetailPdf] = useState(false);
  const [isCreatePdfExportMode, setIsCreatePdfExportMode] = useState(false);
  const [step, setStep] = useState<CreateTemplateStep>("INFO");

  const waitNextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  const handleExportCreatePdf = async () => {
    if (!createPreviewExportRef.current || isExportingCreatePdf) {
      return;
    }

    setIsExportingCreatePdf(true);
    setIsCreatePdfExportMode(true);

    await waitNextFrame();
    await waitNextFrame();

    try {
      if (!createPreviewExportRef.current) {
        return;
      }

      await exportTemplateSvgToPdf(
        createPreviewExportRef.current,
        `${slugifyFileName(templateDraft.code || templateDraft.name || "paper-exam-template")}.pdf`,
      );
    } finally {
      setIsCreatePdfExportMode(false);
      setIsExportingCreatePdf(false);
    }
  };

  const handleExportDetailPdf = async () => {
    if (!detailPreviewExportRef.current || isExportingDetailPdf) {
      return;
    }

    setIsExportingDetailPdf(true);
    try {
      await exportTemplateSvgToPdf(
        detailPreviewExportRef.current,
        `${slugifyFileName(
          `${selectedTemplate?.code || selectedTemplate?.name || "paper-exam-template"}-v${
            selectedVersion?.versionNumber ?? "draft"
          }`,
        )}.pdf`,
      );
    } finally {
      setIsExportingDetailPdf(false);
    }
  };

  const handleBack = () => {
    setStep((current) =>
      current === "CONFIRM" ? "METHOD" : current === "METHOD" ? "INFO" : current,
    );
  };

  const handleNext = () => {
    setStep((current) =>
      current === "INFO" ? "METHOD" : current === "METHOD" ? "CONFIRM" : current,
    );
  };

  if (isLoading) {
    return <PaperExamLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <nav
            aria-label="Thao tác trang bài thi giấy"
            className="flex flex-wrap gap-3"
          >
            <Button
              leftIcon={<PlusCircle className="size-4" />}
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              Tạo mẫu
            </Button>
            <Link to="/teacher/dashboard">
              <Button variant="secondary">Quay lại bảng điều khiển</Button>
            </Link>
          </nav>
        }
        description="Quản lý các mẫu, bản nháp, xác thực và trạng thái xuất bản cho quy trình bài thi giấy của giáo viên."
        eyebrow="Bài thi giấy ngoại tuyến"
        title="Không gian làm việc mẫu"
      />

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Không thể tải không gian mẫu">
          {error}
        </Notice>
      ) : null}

      <Dialog onOpenChange={setCreateDrawerOpen} open={createDrawerOpen}>
        {createDrawerOpen ? (
          <DialogContent className="max-w-[60vw] w-full h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl transition-all duration-300">
            <form
              className="flex h-full flex-col "
              onSubmit={handleCreateTemplate}
            >
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(400px,38%)_1fr] bg-panel">
              {/* Cột trái: Canvas Preview */}
              <section className="relative flex flex-col bg-surface-alt/20 border-r border-line overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
                
                <div className="relative flex-1 flex items-center justify-center p-8 lg:p-12">
                   <div className="relative h-full w-auto aspect-[210/297] bg-white shadow-2xl rounded-sm ring-1 ring-black/5 transition-all duration-500 ease-out">
                    <TemplateSvgPreview
                      ref={createPreviewExportRef}
                      className="block h-full w-full object-contain"
                      settings={templateDraft.settings}
                      showOutlines={!isCreatePdfExportMode}
                    />
                  </div>
                </div>
              </section>

              {/* Cột phải: Sidebar Configuration */}
              <section className="flex flex-col bg-surface overflow-hidden">
                <div className="p-6 border-b border-line bg-surface-alt/5">
                   <div className="flex items-center gap-2 mb-4">
                    <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === 'INFO' ? "bg-brand" : "bg-line")} />
                    <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === 'METHOD' ? "bg-brand" : "bg-line")} />
                    <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === 'CONFIRM' ? "bg-brand" : "bg-line")} />
                  </div>
                  <DialogTitle className="text-xl">
                    {step === 'INFO' ? 'Thông tin mẫu' : step === 'METHOD' ? 'Cấu hình OMR' : 'Xác nhận tạo'}
                  </DialogTitle>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {step === 'INFO' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <ConfigSection title="Định danh mẫu">
                        <div className="flex gap-3">
                          <TextField
                            label="Tên mẫu"
                            placeholder="Ví dụ: Mẫu thi Toán THPT"
                            onChange={(event) =>
                              setTemplateDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            value={templateDraft.name}
                          />

                           <TextField
                            label="Mã mẫu"
                            placeholder="Ví dụ: TH-MATH-V1"
                            onChange={(event) =>
                              setTemplateDraft((current) => ({
                                ...current,
                                code: event.target.value.toUpperCase(),
                              }))
                            }
                            value={templateDraft.code}
                          />
                        </div>
                      </ConfigSection>

                      <ConfigSection title="Mô tả & Ghi chú">
                        <TextareaField
                          label="Mô tả"
                          placeholder="Nhập mô tả về mục đích sử dụng mẫu này..."
                          onChange={(event) =>
                            setTemplateDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          rows={4}
                          value={templateDraft.description}
                        />
                      </ConfigSection>
                    </div>
                  )}

                  {step === 'METHOD' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <ConfigSection title="Cấu hình câu hỏi">
                        <div className="grid grid-cols-[.45fr_.55fr] gap-4">
                          <CompactNumberField
                            label="Số câu hỏi"
                            max={40}
                            min={1}
                            onChange={(value) =>
                              updateTemplateSettings(setTemplateDraft, {
                                numQuestions: value,
                              })
                            }
                            value={templateDraft.settings.numQuestions}
                          />
                          <CompactNumberField
                            label="Số đáp án / câu"
                            max={6}
                            min={2}
                            onChange={(value) =>
                              updateTemplateSettings(setTemplateDraft, {
                                optionsPerQuestion: value,
                              })
                            }
                            value={templateDraft.settings.optionsPerQuestion}
                          />
                        </div>
                      </ConfigSection>
                      
                      <ConfigSection title="Cấu hình OMR">
                        <div className="space-y-4">
                          <IdConfigCard
                            field="studentId"
                            isVisibleField="showStudentIdField"
                            label="Vùng SBD"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                          <IdConfigCard
                            field="quizId"
                            isVisibleField="showQuizIdField"
                            label="Vùng Mã đề"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                        </div>
                      </ConfigSection>

                      <ConfigSection title="Vùng viết tay (Header)">
                        <div className="grid grid-cols-1 gap-3">
                          <HeaderLabelField
                            fieldKey="name"
                            label="Họ và tên"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                          <HeaderLabelField
                            fieldKey="quiz"
                            label="Tên bài thi"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                          <HeaderLabelField
                            fieldKey="class"
                            label="Lớp học"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                          <HeaderLabelField
                            fieldKey="score"
                            label="Điểm số / Chữ ký"
                            setTemplateDraft={setTemplateDraft}
                            templateDraft={templateDraft}
                          />
                        </div>
                      </ConfigSection>
                    </div>
                  )}

                  {step === 'CONFIRM' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                       <Notice tone="info" title="Xác nhận thiết kế">
                          Bạn đang khởi tạo một mẫu bài thi mới. Sau khi tạo, bạn có thể tinh chỉnh tọa độ kỹ thuật trong Visual Editor.
                       </Notice>

                       <div className="rounded-2xl border border-line bg-panel p-5 space-y-4 shadow-sm">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Mã mẫu</p>
                                <p className="font-mono font-bold text-brand-strong">{templateDraft.code || 'CHƯA ĐẶT'}</p>
                             </div>
                             <Badge tone="primary" variant="soft">Phiên bản 1.0</Badge>
                          </div>
                          <div className="pt-4 border-t border-line/50 grid grid-cols-1 gap-4">
                            <div className="p-3 rounded-xl bg-surface border border-line">
                              <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1">Số câu hỏi</p>
                              <p className="text-sm font-bold text-ink">{templateDraft.settings.numQuestions} câu</p>
                            </div>
                            <div className="p-3 rounded-xl bg-surface border border-line">
                              <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-1">Số lựa chọn</p>
                              <p className="text-sm font-bold text-ink">{templateDraft.settings.optionsPerQuestion} đáp án</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-line bg-surface-alt/5 flex items-center justify-between">
                   {step === 'INFO' ? (
                     <Button variant="ghost" onClick={() => setCreateDrawerOpen(false)}>Hủy bỏ</Button>
                   ) : (
                     <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="size-4" />} type="button">Quay lại</Button>
                   )}

                   <div className="flex gap-2">
                     {step === 'CONFIRM' ? (
                        <Button 
                          isLoading={busyKey === "create-template"} 
                          leftIcon={<Check className="size-4" />}
                          className="bg-brand-strong text-white border-none shadow-lg shadow-brand/20"
                          type="submit"
                        >
                          Tạo & Lưu mẫu
                        </Button>
                     ) : (
                        <Button onClick={handleNext} rightIcon={<ArrowRight className="size-4" />} type="button">
                          Tiếp tục
                        </Button>
                     )}
                     <Button
                       isLoading={isExportingCreatePdf}
                       leftIcon={<FileDown className="size-4" />}
                       onClick={() => {
                         void handleExportCreatePdf();
                       }}
                       type="button"
                       variant="secondary"
                     >
                       Xuất PDF
                     </Button>
                   </div>
                </div>
              </section>
            </div>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>

      <CatalogWorkspace
        controller={controller}
        detailDialogOpen={detailDialogOpen}
        detailPreviewExportRef={detailPreviewExportRef}
        handleExportDetailPdf={handleExportDetailPdf}
        isAdmin={isAdmin}
        isExportingDetailPdf={isExportingDetailPdf}
        selectedPreviewSettings={selectedPreviewSettings}
        setDetailDialogOpen={setDetailDialogOpen}
      />

      <AlertDialog onOpenChange={setCloneDialogOpen} open={cloneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Nhân bản phiên bản này thành bản nháp?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Phiên bản đã chọn sẽ được sao chép thành một bản nháp mới có thể
              chỉnh sửa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCloneDialogOpen(false);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busyKey === "clone-version"}
              onClick={() => {
                void handleCloneVersion();
              }}
            >
              Nhân bản thành bản nháp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setPublishDialogOpen} open={publishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xuất bản phiên bản mẫu này?</AlertDialogTitle>
            <AlertDialogDescription>
              Các phiên bản đã xuất bản sẽ khả dụng cho các liên kết bài thi
              giấy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPublishDialogOpen(false);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busyKey === "publish-version"}
              onClick={() => {
                void handlePublishVersion();
              }}
            >
              Xuất bản phiên bản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CatalogWorkspace({
  controller,
  detailDialogOpen,
  detailPreviewExportRef,
  handleExportDetailPdf,
  isAdmin,
  isExportingDetailPdf,
  selectedPreviewSettings,
  setDetailDialogOpen,
}: {
  controller: PaperExamTemplatesPageController;
  detailDialogOpen: boolean;
  detailPreviewExportRef: RefObject<SVGSVGElement | null>;
  handleExportDetailPdf: () => void;
  isAdmin: boolean;
  isExportingDetailPdf: boolean;
  selectedPreviewSettings: TemplateSettings;
  setDetailDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    busyKey,
    catalogMetrics,
    catalogSearch,
    filteredTemplates,
    jsonAssetDrafts,
    newVersionDraft,
    refreshWorkspace,
    selectedTemplate,

    selectedVersion,
    selectedVersionId,
    selectedVersionIsPublished,
    setCatalogSearch,
    setCloneDialogOpen,
    setJsonAssetDrafts,
    setNewVersionDraft,
    setSearchParams,
    setStatusFilter,
    setTemplateDraft,
    statusFilter,
    statusTabs,
    templateDraft,
    templates,
    handleCreateVersion,
    handleSaveBasicTemplateSettings,
  } = controller;

  return (
    <>
      <CardShell
        aria-label="Danh mục mẫu"
        className="p-6"
        role="region"
        variant="subtle"
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Danh mục mẫu
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[0] text-ink">
                Chọn template để xem và xuất PDF
              </h2>
            </div>
            {isAdmin ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
                <MetricPill label="Mẫu" value={catalogMetrics.templateCount} />
                <MetricPill label="Phiên bản" value={catalogMetrics.versionCount} />
                <MetricPill
                  label="Đã xuất bản"
                  value={catalogMetrics.publishedVersionCount}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <TextField
                label="Tìm kiếm mẫu"
                leftIcon={<Search className="size-4" />}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Tìm theo mã, tên, mô tả hoặc trạng thái"
                value={catalogSearch}
              />
            </div>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => {
                void refreshWorkspace();
              }}
              variant="secondary"
            >
              Làm mới
            </Button>
          </div>

          {isAdmin ? (
            <Tabs onValueChange={setStatusFilter} value={statusFilter}>
              <TabsList className="flex flex-wrap">
                {statusTabs.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}

          {templates.length === 0 ? (
            <EmptyState
              className="py-10"
              description="Tạo template đầu tiên trước khi in hoặc quản lý phiên bản bài thi giấy."
              title="Chưa có mẫu nào"
              variant="no-data"
            />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              className="py-10"
              description="Điều chỉnh từ khóa hoặc bộ lọc trạng thái để xem các mẫu từ danh mục."
              title="Không tìm thấy mẫu phù hợp"
              variant="no-results"
            />
          ) : (
            <div
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              data-testid="paper-template-catalog"
            >
              {filteredTemplates.map((template) => (
                <TemplateCatalogCard
                  key={template.id}
                  onSelect={() => {
                    controller.setSelectedTemplate(null);
                    updateSearchSelection(
                      setSearchParams,
                      template.id,
                      template.versions?.[0]?.id ?? null,
                    );
                    setDetailDialogOpen(true);
                  }}
                  showAdminMeta={isAdmin}
                  template={template}
                />
              ))}
            </div>
          )}
        </div>
      </CardShell>

      <Dialog onOpenChange={setDetailDialogOpen} open={detailDialogOpen}>
        <DialogContent className="p-0 max-w-[60vw] w-full h-[90vh] overflow-hidden flex flex-col border-none shadow-2xl transition-all duration-300">
          {selectedTemplate ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(400px,38%)_1fr] flex-1 min-h-0 overflow-hidden">
                {/* Cột trái: Canvas Preview (Full Height) */}
                <section className="relative flex flex-col bg-surface-alt/20 border-r border-line overflow-hidden group h-full">
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
                  
                  <div className="relative flex-1 flex items-center justify-center p-4">
                    <div className="relative max-h-full w-auto aspect-[210/297] bg-white shadow-2xl rounded-sm ring-1 ring-black/5 transition-all duration-500 ease-out flex items-center justify-center">
                      <TemplateSvgPreview className="block w-full h-full object-contain" settings={selectedPreviewSettings} />
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed -left-[10000px] top-0 size-px overflow-hidden"
                  >
                    <TemplateSvgPreview ref={detailPreviewExportRef} settings={selectedPreviewSettings} showOutlines={false} />
                  </div>
                </section>

                {/* Cột phải: Sidebar with Header and Tabs */}
                <div className="flex flex-col h-full overflow-hidden bg-surface">
                  <div className="p-6 border-b border-line bg-surface-alt/5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-muted">
                          {selectedTemplate.description || "Không có mô tả chi tiết cho mẫu này."}
                        </DialogDescription>
                      </div>
                      <Badge tone="primary" variant="soft" className="px-3 py-1 uppercase tracking-widest text-[10px] font-bold">
                        {selectedTemplate.code}
                      </Badge>
                    </div>
                  </div>

                  <Tabs className="flex flex-1 min-h-0 flex-col" defaultValue="overview">
                    <div className="px-6 py-2 border-b border-line bg-surface overflow-x-auto custom-scrollbar">
                      <TabsList className="w-fit flex bg-surface-alt/50 p-1 rounded-full border border-line">
                        <TabsTrigger value="overview" className="rounded-full px-6 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tổng quan</TabsTrigger>
                        {isAdmin && <TabsTrigger value="versions" className="rounded-full px-6 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Phiên bản</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="technical" className="rounded-full px-6 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Cấu hình kỹ thuật</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="visual" className="rounded-full px-6 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Visual Editor</TabsTrigger>}
                      </TabsList>
                    </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                  <TabsContent value="overview" className="h-full mt-0">
                    <TemplateDetailOverview
                      busyKey={busyKey}
                      isExporting={isExportingDetailPdf}
                      onExport={() => {
                        void handleExportDetailPdf();
                      }}
                      onSave={() => {
                        void handleSaveBasicTemplateSettings();
                      }}
                      selectedVersion={selectedVersion}
                      selectedVersionIsPublished={selectedVersionIsPublished}
                      setTemplateDraft={setTemplateDraft}
                      templateDraft={templateDraft}
                    />
                  </TabsContent>

                  {isAdmin && (
                    <>
                      <TabsContent value="versions" className="h-full mt-0 overflow-y-auto p-6 custom-scrollbar">
                        <AdminVersionsPanel
                          busyKey={busyKey}
                          newVersionDraft={newVersionDraft}
                          onClone={() => setCloneDialogOpen(true)}
                          onCreateVersion={() => {
                            void handleCreateVersion();
                          }}
                          onSelectVersion={(versionId) => {
                            updateSearchSelection(
                              setSearchParams,
                              selectedTemplate.id,
                              versionId,
                            );
                          }}
                          selectedTemplate={selectedTemplate}
                          selectedVersionId={selectedVersionId}
                          setNewVersionDraft={setNewVersionDraft}
                        />
                      </TabsContent>

                      <TabsContent value="technical" className="h-full mt-0">
                        <PaperExamVersionEditor controller={controller} />
                      </TabsContent>

                      <TabsContent value="visual" className="h-full mt-0">
                        <VisualGeometryEditor
                          jsonAssetDrafts={jsonAssetDrafts}
                          setJsonAssetDrafts={setJsonAssetDrafts}
                          settings={selectedPreviewSettings}
                        />
                      </TabsContent>
                    </>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <Spinner className="size-8" />
              <p className="text-sm text-muted">Đang tải thông tin mẫu...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TemplateDetailOverview({
  busyKey,
  isExporting,
  onExport,
  onSave,
  selectedVersion,
  selectedVersionIsPublished,
  setTemplateDraft,
  templateDraft,
}: {
  busyKey: string | null;
  isExporting: boolean;
  onExport: () => void;
  onSave: () => void;
  selectedVersion: PaperExamTemplateVersion | null;
  selectedVersionIsPublished: boolean;
  setTemplateDraft: Dispatch<
    SetStateAction<PaperExamTemplatesPageController["templateDraft"]>
  >;
  templateDraft: PaperExamTemplatesPageController["templateDraft"];
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <section className="flex flex-col bg-surface h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {selectedVersionIsPublished && (
            <Notice tone="success" title="Phiên bản đã xuất bản (Chỉ đọc)">
              Hãy nhân bản thành bản nháp trước khi chỉnh và lưu thông số.
            </Notice>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand">
                <Settings2 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Cấu hình mẫu</h3>
                <p className="text-xs text-muted">Thiết lập thông số kỹ thuật cho OMR</p>
              </div>
            </div>
            {!selectedVersionIsPublished && (
              <Button
                size="sm"
                variant={isEditing ? "primary" : "secondary"}
                onClick={() => setIsEditing(!isEditing)}
                leftIcon={isEditing ? <Check className="size-4" /> : <Pencil className="size-4" />}
              >
                {isEditing ? "Hoàn tất xem" : "Chỉnh sửa"}
              </Button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              <ConfigSection title="Thông tin định danh">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-line bg-surface-alt/10">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Tên mẫu</p>
                    <p className="text-sm font-bold text-ink">{templateDraft.name}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-line bg-surface-alt/10">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Mã mẫu</p>
                    <p className="text-sm font-bold text-ink">{templateDraft.code}</p>
                  </div>
                </div>
              </ConfigSection>

              <ConfigSection title="Mô tả & Ghi chú">
                <div className="p-4 rounded-xl border border-line bg-surface-alt/10">
                  <p className="text-sm text-ink leading-relaxed">
                    {templateDraft.description || "Không có mô tả chi tiết."}
                  </p>
                </div>
              </ConfigSection>

              <ConfigSection title="Thông số câu hỏi">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-line bg-surface-alt/10 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted">Số câu hỏi</p>
                    <Badge variant="soft">{templateDraft.settings.numQuestions} câu</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-line bg-surface-alt/10 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted">Số đáp án / câu</p>
                    <Badge variant="soft">{templateDraft.settings.optionsPerQuestion} lựa chọn</Badge>
                  </div>
                </div>
              </ConfigSection>

              <ConfigSection title="Cấu hình OMR">
                <div className="grid grid-cols-1 gap-3">
                  {templateDraft.settings.showStudentIdField ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                       <div className="space-y-0.5">
                          <p className="text-sm font-medium text-ink">Vùng Số báo danh (SBD)</p>
                          <p className="text-[10px] text-muted font-medium">Độ dài: {templateDraft.settings.idBubbles.studentId.n_cols} chữ số</p>
                       </div>
                       <Badge tone="success" variant="soft">Đang hiển thị</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-alt/5 opacity-60">
                       <p className="text-sm font-medium text-muted">Vùng Số báo danh (SBD)</p>
                       <Badge variant="soft">Đã ẩn</Badge>
                    </div>
                  )}
                  {templateDraft.settings.showQuizIdField ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                       <div className="space-y-0.5">
                          <p className="text-sm font-medium text-ink">Vùng Mã đề thi</p>
                          <p className="text-[10px] text-muted font-medium">Độ dài: {templateDraft.settings.idBubbles.quizId.n_cols} chữ số</p>
                       </div>
                       <Badge tone="success" variant="soft">Đang hiển thị</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface-alt/5 opacity-60">
                       <p className="text-sm font-medium text-muted">Vùng Mã đề thi</p>
                       <Badge variant="soft">Đã ẩn</Badge>
                    </div>
                  )}
                </div>
              </ConfigSection>

              <ConfigSection title="Vùng viết tay (Header)">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                    <p className="text-xs font-medium text-ink">Họ và tên</p>
                    {templateDraft.settings.visibleHeaderLabels.name ? (
                      <CheckCircle2 className="size-4 text-brand-strong" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-line" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                    <p className="text-xs font-medium text-ink">Tên bài thi</p>
                    {templateDraft.settings.visibleHeaderLabels.quiz ? (
                      <CheckCircle2 className="size-4 text-brand-strong" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-line" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                    <p className="text-xs font-medium text-ink">Lớp học</p>
                    {templateDraft.settings.visibleHeaderLabels.class ? (
                      <CheckCircle2 className="size-4 text-brand-strong" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-line" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface">
                    <p className="text-xs font-medium text-ink">Điểm / Chữ ký</p>
                    {templateDraft.settings.visibleHeaderLabels.score ? (
                      <CheckCircle2 className="size-4 text-brand-strong" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-line" />
                    )}
                  </div>
                </div>
              </ConfigSection>
            </div>
          ) : (
            <div className="space-y-8">
              <ConfigSection title="Định danh mẫu">
                <div className="flex gap-3">
                  <TextField
                    disabled={selectedVersionIsPublished}
                    label="Tên mẫu"
                    placeholder="Ví dụ: Mẫu thi Toán THPT"
                    onChange={(event) =>
                      setTemplateDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={templateDraft.name}
                  />

                  <TextField
                    disabled={selectedVersionIsPublished}
                    label="Mã mẫu"
                    placeholder="Ví dụ: TH-MATH-V1"
                    onChange={(event) =>
                      setTemplateDraft((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    value={templateDraft.code}
                  />
                </div>
              </ConfigSection>

              <ConfigSection title="Mô tả & Ghi chú">
                <TextareaField
                  disabled={selectedVersionIsPublished}
                  label="Mô tả"
                  placeholder="Nhập mô tả về mục đích sử dụng mẫu này..."
                  onChange={(event) =>
                    setTemplateDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  value={templateDraft.description}
                />
              </ConfigSection>
            </div>
          )}



          {isEditing && (
            <>
              <ConfigSection title="Cấu hình câu hỏi">
                <div className="grid grid-cols-[.45fr_.55fr] gap-4">
                  <CompactNumberField
                    disabled={selectedVersionIsPublished}
                    label="Số câu hỏi"
                    max={40}
                    min={1}
                    onChange={(value) =>
                      updateTemplateSettings(setTemplateDraft, {
                        numQuestions: value,
                      })
                    }
                    value={templateDraft.settings.numQuestions}
                  />
                  <CompactNumberField
                    disabled={selectedVersionIsPublished}
                    label="Số đáp án / câu"
                    max={6}
                    min={2}
                    onChange={(value) =>
                      updateTemplateSettings(setTemplateDraft, {
                        optionsPerQuestion: value,
                      })
                    }
                    value={templateDraft.settings.optionsPerQuestion}
                  />
                </div>
              </ConfigSection>

              <ConfigSection title="Cấu hình OMR">
                <div className="space-y-4">
                  <IdConfigCard
                    disabled={selectedVersionIsPublished}
                    field="studentId"
                    isVisibleField="showStudentIdField"
                    label="Vùng SBD"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                  <IdConfigCard
                    disabled={selectedVersionIsPublished}
                    field="quizId"
                    isVisibleField="showQuizIdField"
                    label="Vùng Mã đề"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                </div>
              </ConfigSection>

              <ConfigSection title="Vùng viết tay (Header)">
                <div className="grid grid-cols-1 gap-3">
                  <HeaderLabelField
                    disabled={selectedVersionIsPublished}
                    fieldKey="name"
                    label="Họ và tên"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                  <HeaderLabelField
                    disabled={selectedVersionIsPublished}
                    fieldKey="quiz"
                    label="Tên bài thi"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                  <HeaderLabelField
                    disabled={selectedVersionIsPublished}
                    fieldKey="class"
                    label="Lớp học"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                  <HeaderLabelField
                    disabled={selectedVersionIsPublished}
                    fieldKey="score"
                    label="Điểm số / Chữ ký"
                    setTemplateDraft={setTemplateDraft}
                    templateDraft={templateDraft}
                  />
                </div>
              </ConfigSection>
            </>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-line bg-surface-alt/5 flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          <Button
            disabled={!selectedVersion}
            isLoading={isExporting}
            leftIcon={<FileDown className="size-4" />}
            onClick={onExport}
            type="button"
            variant="secondary"
          >
            Xuất PDF
          </Button>
        </div>
        <Button
          disabled={!selectedVersion || selectedVersionIsPublished}
          isLoading={busyKey === "save-basic-settings"}
          onClick={onSave}
          type="button"
          className="bg-brand-strong text-white border-none shadow-lg shadow-brand/20"
        >
          Lưu thông số
        </Button>
      </div>
    </section>
  );
}

function AdminVersionsPanel({
  busyKey,
  newVersionDraft,
  onClone,
  onCreateVersion,
  onSelectVersion,
  selectedTemplate,
  selectedVersionId,
  setNewVersionDraft,
}: {
  busyKey: string | null;
  newVersionDraft: PaperExamTemplatesPageController["newVersionDraft"];
  onClone: () => void;
  onCreateVersion: () => void;
  onSelectVersion: (versionId: string) => void;
  selectedTemplate: PaperExamTemplate;
  selectedVersionId: string | null;
  setNewVersionDraft: PaperExamTemplatesPageController["setNewVersionDraft"];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-3">
        {selectedTemplate.versions?.map((version) => {
          const summary = getVersionSummary(version);
          return (
            <button
              className={`w-full rounded-[var(--radius-panel)] border px-4 py-4 text-left shadow-[var(--shadow-subtle)] transition ${
                version.id === selectedVersionId
                  ? "border-brand bg-brand-soft/70"
                  : "border-line/80 bg-panel hover:border-brand/30 hover:bg-surface"
              }`}
              key={version.id}
              onClick={() => onSelectVersion(version.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink">
                      Phiên bản {version.versionNumber}
                    </p>
                    <TemplateStatusBadge status={version.status} />
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {version.questionCount} câu · {version.optionsPerQuestion} lựa chọn ·{" "}
                    {summary.assetCount} tệp · {summary.metadataFieldCount} trường siêu dữ liệu
                  </p>
                </div>
                {version.id === selectedVersionId ? (
                  <CheckCircle2 className="mt-1 size-5 text-brand-strong" />
                ) : null}
              </div>
            </button>
          );
        })}
        <Button leftIcon={<Copy className="size-4" />} onClick={onClone} variant="secondary">
          Nhân bản thành bản nháp
        </Button>
      </div>

      <div className="space-y-4 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
        <p className="text-sm font-semibold text-ink">Tạo bản nháp trống</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Phiên bản lược đồ"
            onChange={(event) =>
              setNewVersionDraft((current) => ({
                ...current,
                schemaVersion: event.target.value,
              }))
            }
            value={newVersionDraft.schemaVersion}
          />
          <TextField
            label="Phiên bản payload"
            onChange={(event) =>
              setNewVersionDraft((current) => ({
                ...current,
                payloadSchemaVersion: event.target.value,
              }))
            }
            value={newVersionDraft.payloadSchemaVersion}
          />
          <TextField
            label="Số câu hỏi"
            onChange={(event) =>
              setNewVersionDraft((current) => ({
                ...current,
                questionCount: event.target.value,
              }))
            }
            type="number"
            value={newVersionDraft.questionCount}
          />
          <TextField
            label="Số lựa chọn mỗi câu"
            onChange={(event) =>
              setNewVersionDraft((current) => ({
                ...current,
                optionsPerQuestion: event.target.value,
              }))
            }
            type="number"
            value={newVersionDraft.optionsPerQuestion}
          />
        </div>
        <Button
          isLoading={busyKey === "create-version"}
          leftIcon={<PlusCircle className="size-4" />}
          onClick={onCreateVersion}
        >
          Tạo bản nháp trống
        </Button>
      </div>
    </div>
  );
}

function VisualGeometryEditor({
  jsonAssetDrafts,
  setJsonAssetDrafts,
  settings,
}: {
  jsonAssetDrafts: PaperExamTemplatesPageController["jsonAssetDrafts"];
  setJsonAssetDrafts: PaperExamTemplatesPageController["setJsonAssetDrafts"];
  settings: TemplateSettings;
}) {
  const [assetType, setAssetType] = useState<GeometryAssetType>("CircleRois");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = useMemo(
    () => parseGeometryAsset(assetType, jsonAssetDrafts[assetType], settings),
    [assetType, jsonAssetDrafts, settings],
  );
  const selected = items[selectedIndex] ?? null;

  const updateAsset = (updater: (items: GeometryItem[]) => GeometryItem[]) => {
    const nextItems = updater(items);
    setJsonAssetDrafts((current) => ({
      ...current,
      [assetType]: JSON.stringify(serializeGeometryAsset(assetType, nextItems), null, 2),
    }));
  };

  const moveItemTo = (index: number, point: Point) => {
    updateAsset((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? moveGeometryItem(assetType, item, point) : item,
      ),
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-panel border border-line rounded-full shadow-sm">
          {(["CircleRois", "MarkerLayout", "IdBubbleFields", "RegionWindows"] as const).map((type) => (
            <Button
              key={type}
              onClick={() => {
                setAssetType(type);
                setSelectedIndex(0);
              }}
              size="sm"
              variant={assetType === type ? "primary" : "ghost"}
              className={cn(
                "rounded-full px-4 transition-all duration-300",
                assetType === type ? "shadow-md" : "text-muted hover:text-ink"
              )}
            >
              {type === "CircleRois" && "Đáp án OMR"}
              {type === "MarkerLayout" && "Điểm định vị"}
              {type === "IdBubbleFields" && "Vùng mã ID"}
              {type === "RegionWindows" && "Vùng cắt ảnh"}
            </Button>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-alt/20 shadow-inner group">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
          <TemplateSvgPreview className="block h-auto w-full opacity-60 grayscale-[30%] blur-[0.5px]" settings={settings} />
          <svg
            className="absolute inset-0 h-full w-full"
            onPointerCancel={() => setDragIndex(null)}
            onPointerLeave={() => setDragIndex(null)}
            onPointerMove={(event) => {
              if (dragIndex === null) {
                return;
              }

              moveItemTo(dragIndex, getSvgPoint(event));
            }}
            onPointerUp={() => setDragIndex(null)}
            preserveAspectRatio="xMidYMid meet"
            viewBox={`0 0 ${templateMaster.width} ${templateMaster.height}`}
          >
            {renderGeometryOverlay({
              items,
              onPointerDown: (event, index) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setSelectedIndex(index);
                setDragIndex(index);
                moveItemTo(index, getSvgPoint(event));
              },
              selectedIndex,
            })}
          </svg>
        </div>
      </div>
      <div className="flex flex-col rounded-2xl border border-line bg-panel overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line bg-surface-alt/5">
          <p className="text-sm font-bold uppercase tracking-widest text-ink">Thanh tra thuộc tính</p>
          <p className="mt-1 text-xs text-muted">
            Chọn một object trên preview hoặc trong danh sách.
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Danh sách đối tượng</p>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 space-y-0.5">
              {items.map((item, index) => (
                <button
                  className={cn(
                    "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-all",
                    index === selectedIndex 
                      ? "bg-brand text-white shadow-brand/20 shadow-md" 
                      : "text-ink hover:bg-panel"
                  )}
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  type="button"
                >
                  <div className={cn(
                    "size-2 rounded-full",
                    index === selectedIndex ? "bg-white" : "bg-brand-strong"
                  )} />
                  {getGeometryLabel(assetType, item, index)}
                </button>
              ))}
              {items.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted italic">Asset này đang rỗng.</p>
              ) : null}
            </div>
          </div>
        {assetType === "RegionWindows" ? (
          <Button
            leftIcon={<PlusCircle className="size-4" />}
            onClick={() => {
              updateAsset((currentItems) => [
                ...currentItems,
                { kind: "region", x1: 100, x2: 300, y1: 100, y2: 220 },
              ]);
              setSelectedIndex(items.length);
            }}
            variant="secondary"
          >
            Thêm window
          </Button>
        ) : null}
        <GeometryInspector
          assetType={assetType}
          item={selected}
          onChange={(nextItem) => {
            updateAsset((items) =>
              items.map((item, index) => (index === selectedIndex ? nextItem : item)),
            );
          }}
        />
        <div className="p-4 bg-surface-alt/10 border-t border-line mt-auto">
          <Notice tone="success" title="Lưu bằng tài nguyên JSON">
            Giao diện trực quan này chỉ cập nhật nháp. Hãy sử dụng tab "Cấu hình kỹ thuật" để lưu lên hệ thống.
          </Notice>
        </div>
        </div>
      </div>
    </div>
  );
}

type GeometryAssetType = "MarkerLayout" | "CircleRois" | "IdBubbleFields" | "RegionWindows";

type MarkerGeometryItem = {
  id: string;
  kind: "marker";
  x: number;
  y: number;
};

type RegionWindowGeometryItem = {
  kind: "region";
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

type GeometryItem =
  | (CircleRoi & { kind: "circle" })
  | (IdBubbleField & { kind: "idBubble" })
  | MarkerGeometryItem
  | RegionWindowGeometryItem;

function parseGeometryAsset(
  assetType: GeometryAssetType,
  draft: string,
  settings: TemplateSettings,
): GeometryItem[] {
  const generated = generateTemplateConfig(settings);
  const fallback =
    assetType === "MarkerLayout"
      ? generated.template_marker_layout
      : assetType === "CircleRois"
        ? generated.circle_rois
        : assetType === "IdBubbleFields"
          ? generated.id_bubble_fields
          : generated.region_windows;

  let parsed: unknown = fallback;
  if (draft.trim()) {
    try {
      parsed = JSON.parse(draft);
    } catch {
      parsed = fallback;
    }
  }

  if (assetType === "MarkerLayout") {
    return Object.entries((parsed ?? {}) as Record<string, Point>).map(
      ([id, point]) => ({
        id,
        kind: "marker",
        x: Number(point?.[0]) || 0,
        y: Number(point?.[1]) || 0,
      }),
    );
  }

  if (assetType === "CircleRois") {
    const circleItems = Array.isArray(parsed) ? parsed : generated.circle_rois;
    return circleItems.map((item) => ({
      ...item,
      cx: Number(item.cx) || 0,
      cy: Number(item.cy) || 0,
      kind: "circle" as const,
      option: Number(item.option) || 1,
      question: Number(item.question) || 1,
      r: Number(item.r) || 1,
    }));
  }

  if (assetType === "IdBubbleFields") {
    const fieldItems = Array.isArray(parsed) ? parsed : generated.id_bubble_fields;
    return fieldItems.map((item) => ({
      ...item,
      dx: Number(item.dx) || 0,
      dy: Number(item.dy) || 0,
      kind: "idBubble" as const,
      n_cols: Number(item.n_cols) || 1,
      n_rows: Number(item.n_rows) || 1,
      origin: normalizePoint(item.origin),
      radius: Number(item.radius) || 1,
    }));
  }

  const regionItems = Array.isArray(parsed) ? parsed : generated.region_windows;
  return regionItems.map((item) => {
    const windowValue = Array.isArray(item) ? item : [item.x1, item.y1, item.x2, item.y2];
    return {
      kind: "region",
      x1: Number(windowValue[0]) || 0,
      x2: Number(windowValue[2]) || 0,
      y1: Number(windowValue[1]) || 0,
      y2: Number(windowValue[3]) || 0,
    };
  });
}

function serializeGeometryAsset(assetType: GeometryAssetType, items: GeometryItem[]) {
  if (assetType === "MarkerLayout") {
    return items.reduce<Record<string, Point>>((result, item) => {
      if (item.kind === "marker") {
        result[item.id] = [roundGeometryNumber(item.x), roundGeometryNumber(item.y)];
      }

      return result;
    }, {});
  }

  if (assetType === "RegionWindows") {
    return items
      .filter((item): item is RegionWindowGeometryItem => item.kind === "region")
      .map((item) => [
        roundGeometryNumber(item.x1),
        roundGeometryNumber(item.y1),
        roundGeometryNumber(item.x2),
        roundGeometryNumber(item.y2),
      ]);
  }

  if (assetType === "IdBubbleFields") {
    return items
      .filter((item): item is IdBubbleField & { kind: "idBubble" } => item.kind === "idBubble")
      .map((item) => ({
        dx: roundGeometryNumber(item.dx),
        dy: roundGeometryNumber(item.dy),
        id: item.id,
        label: item.label,
        n_cols: item.n_cols,
        n_rows: item.n_rows,
        origin: [
          roundGeometryNumber(item.origin[0]),
          roundGeometryNumber(item.origin[1]),
        ],
        radius: roundGeometryNumber(item.radius),
        row_values: item.row_values,
      }));
  }

  return items
    .filter((item): item is CircleRoi & { kind: "circle" } => item.kind === "circle")
    .map((item) => ({
      cx: roundGeometryNumber(item.cx),
      cy: roundGeometryNumber(item.cy),
      option: item.option,
      question: item.question,
      r: roundGeometryNumber(item.r),
    }));
}

function renderGeometryOverlay({
  items,
  onPointerDown,
  selectedIndex,
}: {
  items: GeometryItem[];
  onPointerDown: (
    event: PointerEvent<SVGCircleElement | SVGRectElement>,
    index: number,
  ) => void;
  selectedIndex: number;
}) {
  return (
    <g>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const stroke = isSelected ? "#2563eb" : "rgba(37, 99, 235, 0.5)";
        const fill = isSelected ? "rgba(37, 99, 235, 0.25)" : "rgba(37, 99, 235, 0.08)";
        if (item.kind === "marker") {
          return (
            <circle
              aria-label={`Marker ${item.id}`}
              cx={item.x}
              cy={item.y}
              fill={fill}
              key={`marker-${item.id}`}
              onPointerDown={(event) => onPointerDown(event, index)}
              r={26}
              stroke={stroke}
              strokeWidth={isSelected ? 8 : 5}
            />
          );
        }

        if (item.kind === "circle") {
          return (
            <circle
              aria-label={`Question ${item.question} option ${item.option}`}
              cx={item.cx}
              cy={item.cy}
              fill={fill}
              key={`circle-${item.question}-${item.option}-${index}`}
              onPointerDown={(event) => onPointerDown(event, index)}
              r={Math.max(item.r, 8)}
              stroke={stroke}
              strokeWidth={isSelected ? 6 : 3}
            />
          );
        }

        if (item.kind === "idBubble") {
          return (
            <rect
              aria-label={item.label || item.id}
              fill={fill}
              height={Math.max((item.n_rows - 1) * item.dy + item.radius * 2, 24)}
              key={`id-${item.id}-${index}`}
              onPointerDown={(event) => onPointerDown(event, index)}
              rx={12}
              stroke={stroke}
              strokeWidth={isSelected ? 6 : 3}
              width={Math.max((item.n_cols - 1) * item.dx + item.radius * 2, 24)}
              x={item.origin[0] - item.radius}
              y={item.origin[1] - item.radius}
            />
          );
        }

        return (
          <rect
            aria-label={`Region window ${index + 1}`}
            fill={fill}
            height={Math.abs(item.y2 - item.y1)}
            key={`region-${index}`}
            onPointerDown={(event) => onPointerDown(event, index)}
            rx={12}
            stroke={stroke}
            strokeWidth={isSelected ? 6 : 3}
            width={Math.abs(item.x2 - item.x1)}
            x={Math.min(item.x1, item.x2)}
            y={Math.min(item.y1, item.y2)}
          />
        );
      })}
    </g>
  );
}

function GeometryInspector({
  assetType,
  item,
  onChange,
}: {
  assetType: GeometryAssetType;
  item: GeometryItem | null;
  onChange: (item: GeometryItem) => void;
}) {
  if (!item) {
    return (
      <EmptyState
        className="py-6"
        description="Asset rỗng hoặc chưa chọn object nào."
        title="Chưa có object"
        variant="no-data"
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Thuộc tính tọa độ</p>
        <Badge tone="primary" variant="soft" className="text-[9px]">Live Sync</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {assetType === "MarkerLayout" && item.kind === "marker" ? (
          <>
            <GeometryNumberField label="X" onChange={(x) => onChange({ ...item, x })} value={item.x} />
            <GeometryNumberField label="Y" onChange={(y) => onChange({ ...item, y })} value={item.y} />
          </>
        ) : null}

        {assetType === "CircleRois" && item.kind === "circle" ? (
          <>
            <GeometryNumberField label="CX" onChange={(cx) => onChange({ ...item, cx })} value={item.cx} />
            <GeometryNumberField label="CY" onChange={(cy) => onChange({ ...item, cy })} value={item.cy} />
            <GeometryNumberField label="Bán kính (R)" onChange={(r) => onChange({ ...item, r })} value={item.r} />
          </>
        ) : null}

        {assetType === "IdBubbleFields" && item.kind === "idBubble" ? (
          <>
            <GeometryNumberField
              label="Gốc X"
              onChange={(x) => onChange({ ...item, origin: [x, item.origin[1]] })}
              value={item.origin[0]}
            />
            <GeometryNumberField
              label="Gốc Y"
              onChange={(y) => onChange({ ...item, origin: [item.origin[0], y] })}
              value={item.origin[1]}
            />
            <GeometryNumberField label="DX (Khoảng cách X)" onChange={(dx) => onChange({ ...item, dx })} value={item.dx} />
            <GeometryNumberField label="DY (Khoảng cách Y)" onChange={(dy) => onChange({ ...item, dy })} value={item.dy} />
          </>
        ) : null}

        {assetType === "RegionWindows" && item.kind === "region" ? (
          <>
            <GeometryNumberField label="X1" onChange={(x1) => onChange({ ...item, x1 })} value={item.x1} />
            <GeometryNumberField label="Y1" onChange={(y1) => onChange({ ...item, y1 })} value={item.y1} />
            <GeometryNumberField label="X2" onChange={(x2) => onChange({ ...item, x2 })} value={item.x2} />
            <GeometryNumberField label="Y2" onChange={(y2) => onChange({ ...item, y2 })} value={item.y2} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function GeometryNumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      <span>{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3 text-sm text-ink outline-none transition hover:border-brand/30 focus:border-brand focus:ring-4 focus:ring-focus/20"
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        type="number"
        value={roundGeometryNumber(value)}
      />
    </label>
  );
}

function getGeometryLabel(assetType: GeometryAssetType, item: GeometryItem, index: number) {
  if (assetType === "MarkerLayout" && item.kind === "marker") {
    return `Marker ${item.id}`;
  }

  if (assetType === "CircleRois" && item.kind === "circle") {
    return `Q${item.question} - option ${item.option}`;
  }

  if (assetType === "IdBubbleFields" && item.kind === "idBubble") {
    return item.label || item.id || `ID field ${index + 1}`;
  }

  return `Window ${index + 1}`;
}

function moveGeometryItem(
  assetType: GeometryAssetType,
  item: GeometryItem,
  [x, y]: Point,
): GeometryItem {
  if (assetType === "MarkerLayout" && item.kind === "marker") {
    return { ...item, x, y };
  }

  if (assetType === "CircleRois" && item.kind === "circle") {
    return { ...item, cx: x, cy: y };
  }

  if (assetType === "IdBubbleFields" && item.kind === "idBubble") {
    return { ...item, origin: [x, y] };
  }

  if (assetType === "RegionWindows" && item.kind === "region") {
    const width = item.x2 - item.x1;
    const height = item.y2 - item.y1;
    return { ...item, x1: x, x2: x + width, y1: y, y2: y + height };
  }

  return item;
}

function getSvgPoint(event: PointerEvent<SVGCircleElement | SVGRectElement | SVGSVGElement>): Point {
  const svg = event.currentTarget.ownerSVGElement ?? event.currentTarget;
  const rect = svg.getBoundingClientRect();

  return [
    roundGeometryNumber(((event.clientX - rect.left) / rect.width) * templateMaster.width),
    roundGeometryNumber(((event.clientY - rect.top) / rect.height) * templateMaster.height),
  ];
}

function normalizePoint(value: unknown): Point {
  return Array.isArray(value)
    ? [Number(value[0]) || 0, Number(value[1]) || 0]
    : [0, 0];
}

function roundGeometryNumber(value: number) {
  return Math.round(value * 100) / 100;
}

function slugifyFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "paper-exam-template";
}

function ConfigSection({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">{title}</h3>
        {action}
      </div>
      <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm space-y-4">
        {children}
      </div>
    </section>
  );
}

function CompactNumberField({
  disabled = false,
  label,
  max,
  min,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const safeValue = clampNumber(value, min, max);

  return (
    <div className="flex items-center gap-3 justify-between rounded-[var(--radius-input)] border border-line/80 bg-surface px-3 py-1.5 min-h-[42px]">
      <span className="text-[13px] font-medium text-ink leading-tight">{label}</span>
      <input
        className="h-7 w-12 rounded border border-line bg-panel text-center text-xs font-bold tabular-nums text-ink outline-none transition hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-focus/25 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) =>
          onChange(clampNumber(Number(event.target.value), min, max))
        }
        type="number"
        value={safeValue}
      />
    </div>
  );
}

function IdConfigCard({
  disabled = false,
  field,
  isVisibleField,
  label,
  setTemplateDraft,
  templateDraft,
}: {
  disabled?: boolean;
  field: keyof TemplateSettings["idBubbles"];
  isVisibleField: "showStudentIdField" | "showQuizIdField";
  label: string;
  setTemplateDraft: Dispatch<
    SetStateAction<PaperExamTemplatesPageController["templateDraft"]>
  >;
  templateDraft: PaperExamTemplatesPageController["templateDraft"];
}) {
  const isVisible = templateDraft.settings[isVisibleField];
  const fieldSettings = templateDraft.settings.idBubbles[field];

  return (
    <div className={cn(
      "space-y-4 rounded-xl border p-4 transition-all",
      isVisible ? "border-brand bg-brand-soft/10 ring-1 ring-brand shadow-sm" : "border-line bg-surface opacity-80"
    )}>
      <CheckboxField
        checked={isVisible}
        disabled={disabled}
        label={label}
        className="font-bold text-ink"
        onChange={(event) =>
          updateTemplateSettings(setTemplateDraft, {
            [isVisibleField]: event.target.checked,
          })
        }
      />

      <div className={cn("space-y-3 transition-all duration-300", !isVisible && "pointer-events-none opacity-40")}>
        <TextField
          disabled={disabled || !isVisible}
          label="Nhãn hiển thị"
          onChange={(event) =>
            setTemplateDraft((current) => ({
              ...current,
              settings: {
                ...current.settings,
                idBubbles: {
                  ...current.settings.idBubbles,
                  [field]: {
                    ...current.settings.idBubbles[field],
                    label: event.target.value,
                  },
                },
              },
            }))
          }
          value={fieldSettings.label}
        />

        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[120px]">
            <CompactNumberField
              disabled={disabled || !isVisible}
              label="Cột"
              max={10}
              min={1}
              onChange={(value) =>
                setTemplateDraft((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    idBubbles: {
                      ...current.settings.idBubbles,
                      [field]: {
                        ...current.settings.idBubbles[field],
                        n_cols: value,
                      },
                    },
                  },
                }))
              }
              value={fieldSettings.n_cols}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <CompactNumberField
              disabled={disabled || !isVisible}
              label="Hàng"
              max={10}
              min={1}
              onChange={(value) =>
                setTemplateDraft((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    idBubbles: {
                      ...current.settings.idBubbles,
                      [field]: {
                        ...current.settings.idBubbles[field],
                        n_rows: value,
                      },
                    },
                  },
                }))
              }
              value={fieldSettings.n_rows}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderLabelField({
  disabled = false,
  fieldKey,
  label,
  setTemplateDraft,
  templateDraft,
}: {
  disabled?: boolean;
  fieldKey: keyof TemplateSettings["headerLabels"];
  label: string;
  setTemplateDraft: Dispatch<
    SetStateAction<PaperExamTemplatesPageController["templateDraft"]>
  >;
  templateDraft: PaperExamTemplatesPageController["templateDraft"];
}) {
  const isVisible = templateDraft.settings.visibleHeaderLabels[fieldKey];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-panel p-2.5 transition-all",
        isVisible ? "border-brand bg-white shadow-sm" : "border-line opacity-60"
      )}
    >
      <div className="flex-1">
        <CheckboxField
          checked={isVisible}
          className="font-bold [&_label]:items-center [&_span.block]:text-xs [&_span.block]:leading-tight"
          disabled={disabled}
          label={label}
          onChange={(event) =>
            setTemplateDraft((current) => ({
              ...current,
              settings: {
                ...current.settings,
                visibleHeaderLabels: {
                  ...current.settings.visibleHeaderLabels,
                  [fieldKey]: event.target.checked,
                },
              },
            }))
          }
        />
      </div>

      <input
        aria-label={label}
        className="h-9 w-full flex-1 rounded-lg border border-line bg-surface px-3 text-xs text-ink outline-none transition placeholder:text-muted/60 hover:border-brand/30 focus:border-brand focus:ring-4 focus:ring-focus/20 disabled:cursor-not-allowed"
        disabled={disabled || !isVisible}
        onChange={(event) =>
          setTemplateDraft((current) => ({
            ...current,
            settings: {
              ...current.settings,
              headerLabels: {
                ...current.settings.headerLabels,
                [fieldKey]: event.target.value,
              },
            },
          }))
        }
        placeholder={label}
        value={templateDraft.settings.headerLabels[fieldKey]}
      />
    </div>
  );
}

function updateTemplateSettings(
  setTemplateDraft: Dispatch<
    SetStateAction<PaperExamTemplatesPageController["templateDraft"]>
  >,
  patch: Partial<TemplateSettings>,
) {
  setTemplateDraft((current) => ({
    ...current,
    settings: {
      ...current.settings,
      ...patch,
    },
  }));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}
