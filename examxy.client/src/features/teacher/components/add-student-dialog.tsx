import type React from "react";
import { useState, useRef } from "react";
import { ArrowLeft, Check, Copy, Globe, Upload, FileUp, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Notice } from "@/components/ui/notice";
import {
  importTeacherRosterRequest,
  previewTeacherRosterImportRequest,
} from "@/features/classrooms/lib/class-api";
import { getErrorMessage } from "@/lib/http/api-error";
import type {
  RosterImportPreview,
  StudentImportBatch,
  StudentRosterRowInput,
} from "@/types/classroom";
import { RosterPreviewTable } from "@/features/classrooms/components/roster-preview-table";
import { cn } from "@/lib/utils/cn";

interface AddStudentDialogProps {
  classId: string;
  joinCode: string;
  onClose: () => void;
  open: boolean;
  initialView?: "SELECTION" | "IMPORT_INPUT";
}

type DialogView = "SELECTION" | "IMPORT_INPUT" | "IMPORT_PREVIEW" | "IMPORT_RESULT";

export function AddStudentDialog({
  classId,
  joinCode,
  onClose,
  open,
  initialView = "SELECTION",
}: AddStudentDialogProps) {
  const [view, setView] = useState<DialogView>(initialView);
  const [sourceFileName, setSourceFileName] = useState("roster.xlsx");
  const [parsedRoster, setParsedRoster] = useState<StudentRosterRowInput[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [result, setResult] = useState<StudentImportBatch | null>(null);
  const [preview, setPreview] = useState<RosterImportPreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(joinCode);
    toast({ title: "Đã sao chép mã tham gia", tone: "success" });
  };

  const handleReset = () => {
    setView("SELECTION");
    setParsedRoster([]);
    setSubmissionError(null);
    setResult(null);
    setPreview(null);
    setSourceFileName("roster.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSourceFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Basic mapping logic: find columns for Name, Email, StudentCode
        // Assuming: Row 0 might be headers, or we just take columns 0, 1, 2
        const rows = json.slice(1).filter(row => row.length > 0); // Skip header row
        
        const students: StudentRosterRowInput[] = rows.map(row => ({
          fullName: String(row[0] || ""),
          studentCode: String(row[1] || ""),
          email: String(row[2] || ""),
        })).filter(s => s.fullName || s.email);

        setParsedRoster(students);
      } catch (err) {
        setSubmissionError("Không thể đọc tệp Excel này. Vui lòng kiểm tra lại định dạng.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  async function handleSubmitPreview(event: React.FormEvent) {
    event.preventDefault();
    setSubmissionError(null);
    setPreview(null);

    if (parsedRoster.length === 0) {
      setSubmissionError("Tải lên tệp Excel có chứa danh sách học sinh trước khi nhập.");
      return;
    }

    setIsPreviewing(true);

    try {
      const nextPreview = await previewTeacherRosterImportRequest(classId, {
        sourceFileName,
        students: parsedRoster,
      });
      setPreview(nextPreview);
      setView("IMPORT_PREVIEW");
    } catch (error) {
      setSubmissionError(getErrorMessage(error, "Không thể xem trước danh sách này."));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function runImport() {
    setSubmissionError(null);
    setIsConfirmOpen(false);
    setIsSubmitting(true);

    try {
      const importData = preview
        ? preview.items.map((item) => ({
            fullName: item.fullName,
            studentCode: item.studentCode,
            email: item.email,
          }))
        : parsedRoster;

      const response = await importTeacherRosterRequest(classId, {
        sourceFileName,
        students: importData,
      });

      setResult(response);
      setView("IMPORT_RESULT");
    } catch (error) {
      setSubmissionError(getErrorMessage(error, "Không thể nhập danh sách này."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog 
      onOpenChange={(val) => {
        if (!val) {
          onClose();
          // Reset view after animation if needed, or just let it stay
          setTimeout(() => handleReset(), 300);
        }
      }} 
      open={open}
    >
      <DialogContent className={cn(
        "transition-all duration-300",
        view === "IMPORT_PREVIEW" ? "max-w-4xl" : "max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle>
            {view === "SELECTION" && "Thêm học sinh vào lớp"}
            {view === "IMPORT_INPUT" && "Nhập danh sách học sinh"}
            {view === "IMPORT_PREVIEW" && "Xem lại danh sách"}
            {view === "IMPORT_RESULT" && "Kết quả nhập"}
          </DialogTitle>
          <DialogDescription>
            {view === "SELECTION" && "Chọn phương thức để mời học sinh tham gia lớp học."}
            {view === "IMPORT_PREVIEW" && "Hệ thống đã phân tích danh sách. Bạn có thể sửa lỗi trực tiếp trên bảng."}
            {view === "IMPORT_RESULT" && "Danh sách học sinh đã được xử lý thành công."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {submissionError && (
            <Notice tone="error" title="Lỗi xử lý" className="mb-4">
              {submissionError}
            </Notice>
          )}

          {view === "SELECTION" && (
            <div className="grid gap-4 py-2">
              <div className="rounded-2xl border border-brand/20 bg-brand-soft/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-brand-strong" />
                    <span className="text-sm font-bold text-ink">Mã tham gia</span>
                  </div>
                  <Badge variant="soft" tone="brand" className="text-[10px]">Cố định</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 font-mono font-bold text-xl tracking-widest text-ink">
                    {joinCode}
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    size="icon"
                    variant="secondary"
                    className="size-12 shrink-0"
                  >
                    <Copy className="size-5" />
                  </Button>
                </div>

                <p className="mt-3 text-xs text-muted leading-relaxed">
                  Học sinh nhập mã này trong phần "Tham gia lớp học" để vào lớp ngay lập tức.
                </p>
              </div>

              <button
                onClick={() => setView("IMPORT_INPUT")}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40 hover:bg-brand-soft/20 group text-left w-full"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-panel text-brand-strong group-hover:bg-brand-soft transition-colors">
                  <Upload className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink">Upload danh sách Excel</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Tải lên tệp Excel để tạo tài khoản và gửi lời mời hàng loạt.
                  </p>
                </div>
              </button>
            </div>
          )}

          {view === "IMPORT_INPUT" && (
            <div className="space-y-6">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-4 text-center cursor-pointer",
                  parsedRoster.length > 0 ? "border-success bg-success-soft/5" : "border-line bg-surface hover:border-brand/40 hover:bg-brand-soft/10"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                
                {parsedRoster.length > 0 ? (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <div className="size-16 rounded-2xl bg-success-soft flex items-center justify-center text-success mb-2">
                       <CheckCircle2 className="size-10" />
                    </div>
                    <p className="font-bold text-ink">Tệp đã sẵn sàng!</p>
                    <p className="text-sm text-muted">{sourceFileName}</p>
                    <Badge tone="success" variant="soft">Đã nhận {parsedRoster.length} học sinh</Badge>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-16 rounded-2xl bg-panel flex items-center justify-center text-brand-strong mb-2 group-hover:scale-110 transition-transform">
                       <FileSpreadsheet className="size-10" />
                    </div>
                    <p className="font-bold text-ink">Tải lên tệp danh sách</p>
                    <p className="text-sm text-muted max-w-[240px]">
                      Hỗ trợ tệp .xlsx, .xls hoặc .csv. Hệ thống sẽ tự động phân tích dữ liệu.
                    </p>
                    <Button variant="secondary" className="mt-2" leftIcon={<FileUp className="size-4" />}>
                       Chọn tệp từ máy tính
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Hướng dẫn định dạng</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt/10 border border-line/50 text-xs">
                    <div className="size-6 rounded-full bg-panel flex items-center justify-center font-bold text-[10px]">1</div>
                    <p className="text-muted flex-1">Cột A: <span className="font-bold text-ink">Họ và tên</span></p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt/10 border border-line/50 text-xs">
                    <div className="size-6 rounded-full bg-panel flex items-center justify-center font-bold text-[10px]">2</div>
                    <p className="text-muted flex-1">Cột B: <span className="font-bold text-ink">Mã học sinh</span> (Không bắt buộc)</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt/10 border border-line/50 text-xs">
                    <div className="size-6 rounded-full bg-panel flex items-center justify-center font-bold text-[10px]">3</div>
                    <p className="text-muted flex-1">Cột C: <span className="font-bold text-ink">Email</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "IMPORT_PREVIEW" && preview && (
            <div className="space-y-6">
              <Notice tone="info" title="Mẹo chỉnh sửa">
                Bạn có thể nhấn trực tiếp vào các ô trong bảng để chỉnh sửa thông tin bị lỗi hoặc thiếu.
              </Notice>

              <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-line">
                <RosterPreviewTable 
                  items={preview.items} 
                  onUpdateItem={(index, updates) => {
                    const nextItems = [...preview.items];
                    nextItems[index] = { ...nextItems[index], ...updates };
                    
                    setPreview({
                      ...preview,
                      items: nextItems,
                      readyCount: nextItems.filter(i => i.status === 'Ready').length,
                      errorCount: nextItems.filter(i => i.status === 'Error').length,
                      warningCount: nextItems.filter(i => i.status === 'Warning').length,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {view === "IMPORT_RESULT" && result && (
            <div className="space-y-4">
              <Notice tone="success" title="Đã nhập danh sách xong">
                Xử lý {result.totalRows} dòng. {result.createdAccountCount} tài khoản mới, {result.sentInviteCount} lời mời đã gửi.
              </Notice>

              <div className="max-h-[40vh] overflow-y-auto">
                <Accordion collapsible type="single">
                  {result.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-sm">
                        Dòng {item.rowNumber}: {item.email}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted">
                        <p className="font-bold text-ink">{item.fullName || "Học sinh"}</p>
                        <p className="mt-1">{item.resultType}: {item.message}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row sm:justify-between items-center border-t border-line pt-4 mt-2">
          {view === "SELECTION" ? (
            <div />
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (view === "IMPORT_INPUT") setView("SELECTION");
                if (view === "IMPORT_PREVIEW") setView("IMPORT_INPUT");
                if (view === "IMPORT_RESULT") setView("SELECTION");
              }}
              disabled={isSubmitting || isPreviewing}
              leftIcon={<ArrowLeft className="size-4" />}
            >
              Quay lại
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
            
            {view === "IMPORT_INPUT" && (
              <Button 
                size="sm" 
                onClick={handleSubmitPreview} 
                isLoading={isPreviewing}
                disabled={parsedRoster.length === 0}
                leftIcon={<Upload className="size-4" />}
              >
                Tiếp tục
              </Button>
            )}

            {view === "IMPORT_PREVIEW" && preview && (
              <Button 
                size="sm" 
                onClick={() => setIsConfirmOpen(true)}
                disabled={preview.errorCount > 0}
                leftIcon={<Check className="size-4" />}
              >
                Nhập {preview.items.length} học sinh
              </Button>
            )}

            {view === "IMPORT_RESULT" && (
              <Button size="sm" onClick={onClose} variant="primary">Xong</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nhập danh sách?</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống sẽ tạo tài khoản và gửi lời mời đến {preview?.items.length} học sinh này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runImport()}>
              <Upload className="size-4 mr-2" />
              Bắt đầu nhập
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function Badge({
  children,
  className,
  tone = "brand",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "brand" | "success" | "warning" | "danger";
  variant?: "soft" | "solid";
}) {
  const toneClasses = {
    brand: "bg-brand-soft text-brand-strong border-brand/20",
    success: "bg-success-soft text-success border-success/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    danger: "bg-danger-soft text-danger border-danger/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
