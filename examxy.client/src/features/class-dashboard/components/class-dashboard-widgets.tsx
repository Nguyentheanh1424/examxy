import type { ReactNode } from "react";
import { ArrowRight, Bell, Calendar, CheckCircle2, ChevronRight, FileText, MessageSquare, Pin, PlusCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CardShell } from "@/components/ui/card-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { ClassMentionCandidate, ClassMentionSummary } from "@/types/class-content";
import type { AttentionItem } from "@/features/class-dashboard/lib/class-dashboard-page-mappers";

export function MentionSummary({
  mentionCandidateByUserId,
  mentions,
}: {
  mentionCandidateByUserId: Map<string, ClassMentionCandidate>;
  mentions: ClassMentionSummary;
}) {
  const hasMentions = mentions.notifyAll || mentions.taggedUserIds.length > 0;
  if (!hasMentions) {
    return null;
  }

  const taggedLabels = mentions.taggedUserIds.map((taggedUserId, index) => {
    const candidate = mentionCandidateByUserId.get(taggedUserId);
    return {
      key: `${taggedUserId}-${index}`,
      label: candidate ? `@${candidate.displayName}` : `@${taggedUserId}`,
    };
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mentions.notifyAll ? (
        <span className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
          Thông báo tất cả
        </span>
      ) : null}
      {taggedLabels.map((item) => (
        <span
          className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-muted"
          key={item.key}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function DashboardMetricCard({
  accentTone,
  icon,
  label,
  value,
  description,
}: {
  accentTone: "brand" | "success" | "warning" | "danger";
  icon: ReactNode;
  label: string;
  value: number | string;
  description?: string;
}) {
  const iconToneClass = {
    brand: "bg-brand-soft text-brand-strong",
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  }[accentTone];

  return (
    <CardShell
      accentTone={accentTone}
      className="p-5"
      interactive
      variant="subtle"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-0.75rem)] ${iconToneClass}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-ink">
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs text-muted leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </CardShell>
  );
}

export function AttentionArea({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <CardShell className="flex flex-col items-center justify-center p-8 text-center" variant="subtle">
        <div className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success mb-3">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="font-semibold text-ink">Lớp học ổn định</h3>
        <p className="mt-1 text-sm text-muted">Hiện không có việc gì cần xử lý gấp.</p>
      </CardShell>
    );
  }

  return (
    <CardShell className="p-0 overflow-hidden" variant="elevated">
      <div className="border-b border-line/60 bg-surface-alt/30 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-warning" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Cần chú ý</h3>
        </div>
        <Badge tone="warning" variant="solid">{items.length}</Badge>
      </div>
      <div className="divide-y divide-line/60">
        {items.map((item) => (
          <div className="group relative flex items-start gap-4 p-4 transition hover:bg-surface-alt/20" key={item.id}>
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              item.severity === "danger" ? "bg-danger-soft text-danger" : 
              item.severity === "warning" ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand-strong"
            )}>
              {item.type === "notification" ? <Bell className="size-5" /> :
               item.type === "schedule" ? <Calendar className="size-5" /> :
               item.type === "pinned" ? <Pin className="size-5" /> : <MessageSquare className="size-5" />}
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm font-bold text-ink leading-tight">{item.title}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">{item.description}</p>
            </div>
            {item.link ? (
              <Link className="absolute inset-0 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity" to={item.link}>
                <div className="flex size-8 items-center justify-center rounded-full bg-surface shadow-sm border border-line">
                  <ChevronRight className="size-4 text-ink" />
                </div>
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function QuickActions({ 
  isTeacher, 
  onAction 
}: { 
  isTeacher: boolean; 
  onAction: (key: string) => void 
}) {
  const actions = isTeacher ? [
    { key: "create-post", label: "Tạo bài viết", icon: <PlusCircle className="size-4" />, description: "Chia sẻ cập nhật lớp học" },
    { key: "create-schedule", label: "Tạo lịch", icon: <Calendar className="size-4" />, description: "Thêm hạn nộp hoặc buổi học" },
    { key: "open-assessments", label: "Bài kiểm tra", icon: <FileText className="size-4" />, description: "Quản lý các bài đánh giá" },
  ] : [
    { key: "view-assessments", label: "Làm bài thi", icon: <Zap className="size-4" />, description: "Xem các bài kiểm tra hiện có" },
    { key: "view-schedule", label: "Xem lịch", icon: <Calendar className="size-4" />, description: "Theo dõi thời gian biểu" },
    { key: "view-pinned", label: "Bài ghim", icon: <Pin className="size-4" />, description: "Xem thông tin quan trọng" },
  ];

  return (
    <CardShell className="p-5" variant="subtle">
      <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4 flex items-center gap-2">
        <Zap className="size-4 text-brand" />
        {isTeacher ? "Hành động nhanh" : "Truy cập nhanh"}
      </h3>
      <div className="grid gap-3">
        {actions.map((action) => (
          <button
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-brand/40 hover:bg-brand-soft/20 hover:shadow-sm"
            key={action.key}
            onClick={() => onAction(action.key)}
            type="button"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-panel text-brand-strong group-hover:bg-brand-soft">
              {action.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{action.label}</p>
              <p className="text-xs text-muted truncate">{action.description}</p>
            </div>
            <ArrowRight className="size-4 text-line ml-auto" />
          </button>
        ))}
      </div>
    </CardShell>
  );
}


export function ClassDashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="border-b border-line/70 pb-5">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-3xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <CardShell className="p-5" key={item}>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-9 w-16" />
          </CardShell>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <CardShell className="p-6" variant="subtle">
          <div className="space-y-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        </CardShell>
        <CardShell className="p-6" variant="subtle">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardShell>
      </div>
    </div>
  );
}
