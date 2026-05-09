import { Check, Copy, Upload, Users } from "lucide-react";
import { Link } from "react-router-dom";
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

interface ClassCreationSuccessDialogProps {
  classId: string | null;
  joinCode: string | null;
  method: "JoinCode" | "Excel" | null;
  onClose: () => void;
  onShowImport?: () => void;
  open: boolean;
}

export function ClassCreationSuccessDialog({
  classId,
  joinCode,
  method,
  onClose,
  onShowImport,
  open,
}: ClassCreationSuccessDialogProps) {
  const handleCopyCode = () => {
    if (joinCode) {
      void navigator.clipboard.writeText(joinCode);
      toast({ title: "Đã sao chép mã tham gia", tone: "success" });
    }
  };

  return (
    <Dialog onOpenChange={(val) => !val && onClose()} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success mb-4 scale-110 animate-in zoom-in duration-300">
            <Check className="size-8" />
          </div>
          <DialogTitle className="text-2xl">Tạo lớp thành công!</DialogTitle>
          <DialogDescription>
            Lớp học đã sẵn sàng.{" "}
            {method === "JoinCode"
              ? "Học sinh có thể tham gia ngay bằng mã bên dưới."
              : "Vui lòng tải danh sách học sinh để gửi lời mời."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {method === "JoinCode" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-brand/30 bg-brand-soft/10 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-strong mb-2">
                  Mã tham gia
                </p>
                <p className="text-4xl font-mono font-black tracking-widest text-ink select-all">
                  {joinCode}
                </p>
              </div>
              <Button
                fullWidth
                onClick={handleCopyCode}
                leftIcon={<Copy className="size-4" />}
                variant="primary"
                size="lg"
              >
                Sao chép mã tham gia
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-surface-alt/20 p-5 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-white border border-line text-brand">
                  <Users className="size-6" />
                </div>
                <div>
                  <p className="font-bold text-ink">Danh sách học sinh</p>
                  <p className="text-sm text-muted">
                    Hệ thống sẽ xử lý tệp Excel và gửi lời mời qua email ngay sau khi bạn tải lên.
                  </p>
                </div>
              </div>
              <Button
                fullWidth
                onClick={onShowImport}
                leftIcon={<Upload className="size-4" />}
                variant="primary"
                size="lg"
              >
                Nhập danh sách học sinh
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="grid w-full gap-2">
            <Link to={`/classes/${classId}`}>
              <Button fullWidth variant="secondary">
                Vào bảng điều khiển lớp học
              </Button>
            </Link>
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
