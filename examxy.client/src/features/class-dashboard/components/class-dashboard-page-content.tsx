import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, CalendarDays, ChevronDown, ChevronUp, Clock, Edit3, FileText, MessageSquare, MoreHorizontal, Pin, PlusCircle, RefreshCcw, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { PageHeader } from "@/components/ui/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Trophy } from "lucide-react";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils/cn";
import type { ClassDashboardPageController } from "@/features/class-dashboard/hooks/use-class-dashboard-page";
import { ClassDashboardDrawers } from "@/features/class-dashboard/components/class-dashboard-drawers";
import { AttentionArea, ClassDashboardLoadingState, DashboardMetricCard, MentionSummary, QuickActions } from "@/features/class-dashboard/components/class-dashboard-widgets";
import { formatStatusLabel, formatUtcDate, getStatusTone, groupScheduleItems, isAnnouncementLike, reactionLabels, reactionTypes, toLocalInput, type AttentionItem } from "@/features/class-dashboard/lib/class-dashboard-page-mappers";
import { MentionCandidatePicker } from "@/features/mentions/components/mention-candidate-picker";
import { ClassStudentList } from "./class-student-list";
import { AddStudentDialog } from "@/features/teacher/components/add-student-dialog";
import { Copy } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export function ClassDashboardPageContent({ controller }: { controller: ClassDashboardPageController }) {
  const { classId, session, dashboard, feedItems, scheduleItems, mentionCandidates, mentionCandidateByUserId, isLoading, isRefreshing, busyKey, error, notice, isTeacherOwner, canComment, setPostCreateDrawerOpen, setPostEditId, setPostEditDraft, setCommentDraftByPostId, focusedCommentPostId, setFocusedCommentPostId, setCommentEditId, setCommentEditDraft, setScheduleCreateDrawerOpen, setScheduleEditId, setScheduleEditDraft, highlightedScheduleItemId, hideCommentTargetId, setHideCommentTargetId, scheduleItemRefs, feedTab, setFeedTab, hasAnnouncements, filteredFeedItems, pinnedFeedItemCount, announcementFeedItemCount, handleRefresh, handleSetPostReaction, handleSetCommentReaction, getCommentDraft, handleCreateComment, handleHideComment } = controller

  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [deleteTargetMembershipId, setDeleteTargetMembershipId] = useState<string | null>(null);
  const [cancelTargetInviteId, setCancelTargetInviteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    code: "",
    status: "Active" as 'Active' | 'Archived',
  });

  useEffect(() => {
    if (!dashboard) return;

    setSettingsForm({
      name: dashboard.className,
      code: dashboard.classCode,
      status: dashboard.classStatus as 'Active' | 'Archived',
    });
  }, [dashboard]);

  const attentionItems = useMemo(() => {
    if (!dashboard) return [];
    const items: AttentionItem[] = [];

    if (dashboard.unreadNotificationCount > 0) {
      items.push({
        id: "unread-notifications",
        type: "notification",
        title: `${dashboard.unreadNotificationCount} thông báo mới`,
        description: "Bạn có các cập nhật quan trọng từ lớp học cần xem ngay.",
        actionLabel: "Xem tất cả",
        link: `/notifications?classId=${classId}`,
        severity: "warning",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todaySchedules = scheduleItems.filter(item => {
      const start = new Date(item.startAtUtc);
      return start >= today && start < tomorrow;
    });

    todaySchedules.forEach(item => {
      items.push({
        id: `schedule-${item.id}`,
        type: "schedule",
        title: item.title,
        description: `Sự kiện diễn ra hôm nay lúc ${new Date(item.startAtUtc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        actionLabel: "Xem chi tiết",
        link: `?scheduleItemId=${item.id}`,
        severity: "info",
      });
    });

    const pinnedItems = feedItems.filter(item => item.isPinned);
    if (pinnedItems.length > 0) {
      items.push({
        id: "pinned-posts",
        type: "pinned",
        title: `${pinnedItems.length} bài viết quan trọng`,
        description: "Các nội dung quan trọng được giáo viên ghim lên đầu bảng tin.",
        actionLabel: "Xem ngay",
        severity: "info",
      });
    }

    return items;
  }, [dashboard, classId, scheduleItems, feedItems]);

  const groupedSchedules = useMemo(() => groupScheduleItems(scheduleItems), [scheduleItems]);

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }, [dashboard]); // Update when dashboard data changes

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleQuickAction = (key: string) => {
    switch (key) {
      case "create-post": setPostCreateDrawerOpen(true); break;
      case "create-schedule": setScheduleCreateDrawerOpen(true); break;
      // Other actions could be added here or handled by links
    }
  };

  if (isLoading) {
    return <ClassDashboardLoadingState />;
  }

  if (error || !dashboard) {
    return (
      <Notice tone="error" title="Không thể tải bảng điều khiển lớp học">
        {error ?? "Bảng điều khiển lớp học không khả dụng."}
      </Notice>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
             {isTeacherOwner && (
               <Button 
                onClick={() => setIsAddStudentOpen(true)}
                variant="primary" 
                size="md"
                leftIcon={<PlusCircle className="size-4" />}
               >
                 Thêm học sinh
               </Button>
             )}
             <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex size-10 items-center justify-center rounded-[var(--radius-input)] border border-line bg-surface text-ink transition hover:bg-brand-soft/60">
                   <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                   <Link to={session?.primaryRole === "Teacher" ? "/teacher/dashboard" : "/student/dashboard"}>
                   <DropdownMenuItem>
                      <ArrowLeft className="size-4" /> Bảng điều khiển chính
                   </DropdownMenuItem>
                   </Link>
                   <Link to={`/classes/${classId}/assessments`}>
                   <DropdownMenuItem>
                      <FileText className="size-4" /> Bài kiểm tra
                   </DropdownMenuItem>
                   </Link>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        }
        description="Quản lý bảng tin, học sinh và các hoạt động học tập."
        eyebrow={
          <span className="flex flex-wrap items-center gap-3">
            <Badge
              dot
              tone={getStatusTone(dashboard.classStatus)}
              variant="soft"
            >
              {formatStatusLabel(dashboard.classStatus)}
            </Badge>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-0.5 text-xs font-mono font-bold text-brand-strong">
              {dashboard.classCode}
              <button 
                onClick={() => {
                  void navigator.clipboard.writeText(dashboard.classCode);
                  toast({ title: "Đã sao chép mã tham gia", tone: "success" });
                }}
                className="ml-1 text-muted hover:text-brand-strong p-0.5 transition"
              >
                <Copy className="size-3" />
              </button>
            </div>
          </span>
        }
        title={dashboard.className}
      />

      <Tabs onValueChange={setActiveTab} value={activeTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-line h-auto p-0 bg-transparent gap-6 rounded-none">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="students" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Học sinh
          </TabsTrigger>
          <TabsTrigger 
            value="lessons" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Bài học
          </TabsTrigger>
          <TabsTrigger 
            value="exams" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Bài kiểm tra
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Thông báo
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent px-2 py-3 font-bold text-sm"
          >
            Cài đặt
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {activeTab === "overview" ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <AttentionArea items={attentionItems} />

              <section
                aria-label="Tổng quan bảng điều khiển lớp học"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <DashboardMetricCard
                  accentTone="success"
                  icon={<Users className="size-5" />}
                  label="Học sinh"
                  value={dashboard.activeStudentCount}
                  description="Thành viên đang tham gia lớp học"
                />
                <DashboardMetricCard
                  accentTone="brand"
                  icon={<MessageSquare className="size-5" />}
                  label="Bài viết"
                  value={dashboard.feedItemCount}
                  description="Tổng số thảo luận và thông báo"
                />
                <DashboardMetricCard
                  accentTone="warning"
                  icon={<CalendarDays className="size-5" />}
                  label="Lịch trình"
                  value={dashboard.upcomingScheduleCount}
                  description={dashboard.upcomingScheduleCount > 0 
                    ? `Có ${dashboard.upcomingScheduleCount} sự kiện sắp tới cần lưu ý` 
                    : "Không có lịch trình sắp tới"}
                />
                <DashboardMetricCard
                  accentTone="danger"
                  icon={<Bell className="size-5" />}
                  label="Thông báo"
                  value={dashboard.unreadNotificationCount}
                  description={dashboard.unreadNotificationCount > 0 
                    ? `Bạn có ${dashboard.unreadNotificationCount} thông báo chưa đọc` 
                    : "Bạn đã xem hết thông báo"}
                />
              </section>
            </div>

            <aside className="space-y-6">
              <QuickActions 
                isTeacher={session?.primaryRole === "Teacher"} 
                onAction={handleQuickAction} 
              />
              <div className="flex items-center justify-between rounded-2xl bg-surface-alt/40 px-4 py-2 border border-line/40">
                 <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-muted">
                   <RefreshCcw className={cn("size-3", isRefreshing && "animate-spin")} />
                   Cập nhật: {lastUpdated}
                 </div>
                 <Button 
                   size="sm" 
                   variant="ghost" 
                   className="h-7 text-xs px-2"
                   onClick={() => void handleRefresh()}
                   isLoading={isRefreshing}
                 >
                   Làm mới
                 </Button>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <CardShell
              aria-label="Bảng tin lớp học"
              className="p-6"
              role="region"
              variant="elevated"
            >
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink">Bảng tin mới nhất</h2>
                  <p className="mt-1 text-sm text-muted">
                    Cập nhật các thảo luận, tài liệu và thông báo từ lớp học.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Tabs onValueChange={setFeedTab} value={feedTab}>
                    <TabsList className="flex flex-wrap">
                      <TabsTrigger value="all">
                        Tất cả ({feedItems.length})
                      </TabsTrigger>
                      <TabsTrigger value="pinned">
                        Đã ghim ({pinnedFeedItemCount})
                      </TabsTrigger>
                      {hasAnnouncements ? (
                        <TabsTrigger value="announcements">
                          Thông báo ({announcementFeedItemCount})
                        </TabsTrigger>
                      ) : null}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {isTeacherOwner ? (
                <div className="mb-6 overflow-hidden rounded-2xl border border-brand/20 bg-brand-soft/10 group">
                  <button
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-brand-soft/20"
                    onClick={() => setPostCreateDrawerOpen(true)}
                    type="button"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong shadow-sm group-hover:scale-110 transition-transform">
                      <PlusCircle className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Bạn muốn chia sẻ điều gì?</p>
                      <p className="text-xs text-muted">Đăng tài liệu, thông báo hoặc bài thảo luận mới cho lớp.</p>
                    </div>
                  </button>
                </div>
              ) : null}

              {feedItems.length === 0 ? (
                <EmptyState
                  className="py-12"
                  description={
                    isTeacherOwner
                      ? "Bắt đầu bằng cách đăng bài viết đầu tiên để chia sẻ với học sinh."
                      : "Hiện chưa có cập nhật nào từ giáo viên."
                  }
                  title="Bảng tin trống"
                  variant="no-data"
                />
              ) : filteredFeedItems.length === 0 ? (
                <EmptyState
                  className="py-12"
                  description="Hãy thử chuyển sang các tab khác để xem nội dung."
                  title="Không tìm thấy bài viết"
                  variant="no-results"
                />
              ) : (
                <div className="space-y-6">
                  {filteredFeedItems.map((post) => (
                    <article
                      className={cn(
                        "relative overflow-hidden rounded-2xl border bg-surface transition-all duration-300",
                        post.isPinned
                          ? "border-brand/40 bg-brand-soft/5 ring-1 ring-brand/20 shadow-sm"
                          : "border-line hover:border-brand/30 hover:shadow-md",
                      )}
                      key={post.id}
                    >
                      {post.isPinned ? (
                        <div className="absolute top-0 right-0 flex items-center gap-1 bg-brand-strong px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-bl-xl shadow-sm">
                          <Pin className="size-3" />
                          Đã ghim
                        </div>
                      ) : null}

                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-alt border border-line text-muted">
                               <Users className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                 <p className="font-bold text-ink truncate">{post.title}</p>
                                 {isAnnouncementLike(post) ? (
                                  <Badge tone="warning" variant="soft" className="h-5 px-1.5 text-[10px] font-bold uppercase">
                                    Thông báo
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted flex items-center gap-2">
                                <span>{post.authorName}</span>
                                <span className="size-1 rounded-full bg-line" />
                                <Clock className="size-3" />
                                <span>{formatUtcDate(post.publishedAtUtc ?? post.createdAtUtc)}</span>
                              </p>
                            </div>
                          </div>
                          <Badge tone={getStatusTone(post.status)} variant="soft" className="mt-1">
                            {formatStatusLabel(post.status)}
                          </Badge>
                        </div>

                        <p className="text-sm leading-7 text-ink/90 line-clamp-3 group-hover:line-clamp-none transition-all">
                          {post.contentPlainText || "(Không có nội dung)"}
                        </p>

                        <MentionSummary
                          mentionCandidateByUserId={mentionCandidateByUserId}
                          mentions={post.mentions}
                        />

                        <div className="flex items-center justify-between pt-2 border-t border-line/40">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                               {reactionTypes.slice(0, 3).map((reactionType) => (
                                 <button
                                   key={reactionType}
                                   onClick={() => void handleSetPostReaction(post, reactionType)}
                                   className={cn(
                                     "flex size-8 items-center justify-center rounded-full border-2 border-surface bg-panel text-xs transition hover:scale-110 hover:z-10",
                                     post.reactions.viewerReaction === reactionType ? "bg-brand-soft border-brand/30" : ""
                                   )}
                                 >
                                   {reactionLabels[reactionType]}
                                 </button>
                               ))}
                            </div>
                            <span className="text-xs font-medium text-muted">
                              {post.reactions.totalCount} cảm xúc
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isTeacherOwner ? (
                              <DropdownMenu align="end">
                                <DropdownMenuTrigger
                                  aria-label={`Thao tác với bài viết ${post.title}`}
                                  className="focus-ring flex size-9 items-center justify-center rounded-full border border-line bg-panel transition hover:bg-brand-soft/60"
                                >
                                  <MoreHorizontal className="size-4 text-ink" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPostEditId(post.id);
                                      setPostEditDraft({
                                        allowComments: post.allowComments,
                                        content: post.contentPlainText,
                                        isPinned: post.isPinned,
                                        notifyAll: post.notifyAll,
                                        taggedUserIds: post.mentions.taggedUserIds,
                                        title: post.title,
                                      });
                                    }}
                                  >
                                    <Edit3 className="size-4 text-brand-strong" />
                                    Sửa bài viết
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                            
                            <Button 
                              onClick={() => togglePostExpansion(post.id)}
                              variant="ghost" 
                              size="sm"
                              className="h-9 px-3 text-xs font-bold gap-2 text-brand-strong"
                            >
                              {expandedPosts[post.id] ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                              {post.comments.length} bình luận
                            </Button>
                          </div>
                        </div>

                        {expandedPosts[post.id] && (
                          <div className="mt-2 space-y-4 pt-4 border-t border-line/60 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-3">
                              {post.comments.map((comment) => (
                                <div
                                  className="group relative rounded-xl border border-line/60 bg-panel/50 p-3 transition hover:bg-panel"
                                  key={comment.id}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-1">
                                    <p className="text-[13px] font-bold text-ink">
                                      {comment.authorName}
                                    </p>
                                    {comment.authorUserId === session?.userId || (isTeacherOwner && !comment.isHidden) ? (
                                      <DropdownMenu align="end">
                                        <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-surface-alt border border-line">
                                          <MoreHorizontal className="size-3.5" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          {comment.authorUserId === session?.userId ? (
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setCommentEditId(comment.id);
                                                setCommentEditDraft({
                                                  content: comment.contentPlainText,
                                                  notifyAll: comment.notifyAll,
                                                  taggedUserIds: comment.mentions.taggedUserIds,
                                                });
                                              }}
                                            >
                                              <Edit3 className="size-4 text-brand-strong" />
                                              Sửa bình luận
                                            </DropdownMenuItem>
                                          ) : null}
                                          {isTeacherOwner && !comment.isHidden ? (
                                            <DropdownMenuItem
                                              className="text-danger"
                                              onClick={() => setHideCommentTargetId(comment.id)}
                                            >
                                              Ẩn bình luận
                                            </DropdownMenuItem>
                                          ) : null}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : null}
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm text-ink/90 leading-6">
                                    {comment.contentPlainText || "(Bình luận trống)"}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <MentionSummary
                                      mentionCandidateByUserId={mentionCandidateByUserId}
                                      mentions={comment.mentions}
                                    />
                                    <div className="flex gap-1">
                                      {reactionTypes.slice(0, 1).map((reactionType) => (
                                        <button
                                          key={reactionType}
                                          onClick={() => void handleSetCommentReaction(post.id, comment.id, comment.reactions.viewerReaction, reactionType)}
                                          className={cn(
                                            "flex size-7 items-center justify-center rounded-full border border-line bg-surface text-[10px] transition hover:bg-brand-soft",
                                            comment.reactions.viewerReaction === reactionType ? "bg-brand-soft border-brand/20 text-brand-strong" : ""
                                          )}
                                        >
                                          {reactionLabels[reactionType]}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {canComment && post.allowComments && (
                              <div className="pt-2">
                                 {focusedCommentPostId !== post.id ? (
                                    <Button
                                      leftIcon={<MessageSquare className="size-3.5" />}
                                      onClick={() => setFocusedCommentPostId(post.id)}
                                      size="sm"
                                      variant="secondary"
                                      className="w-full h-10 rounded-xl justify-start text-xs text-muted"
                                    >
                                      Viết bình luận hoặc trả lời...
                                    </Button>
                                 ) : (
                                   <form
                                      className="space-y-3 rounded-xl border border-brand/20 bg-brand-soft/10 p-3"
                                      onSubmit={(event) => void handleCreateComment(event, post.id)}
                                    >
                                      <TextareaField
                                        label="Bình luận"
                                        placeholder="Nội dung bình luận..."
                                        onChange={(event) =>
                                          setCommentDraftByPostId((current) => ({
                                            ...current,
                                            [post.id]: { ...getCommentDraft(post.id), content: event.target.value },
                                          }))
                                        }
                                        rows={2}
                                        value={getCommentDraft(post.id).content}
                                        className="bg-surface border-line/60"
                                      />
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                          <CheckboxField
                                            checked={getCommentDraft(post.id).notifyAll}
                                            label="Thông báo tất cả"
                                            onChange={(event) =>
                                              setCommentDraftByPostId((current) => ({
                                                ...current,
                                                [post.id]: { ...getCommentDraft(post.id), notifyAll: event.target.checked },
                                              }))
                                            }
                                          />
                                          <MentionCandidatePicker
                                            candidates={mentionCandidates}
                                            onChange={(nextUserIds) =>
                                              setCommentDraftByPostId((current) => ({
                                                ...current,
                                                [post.id]: { ...getCommentDraft(post.id), taggedUserIds: nextUserIds },
                                              }))
                                            }
                                            selectedUserIds={getCommentDraft(post.id).taggedUserIds}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button onClick={() => setFocusedCommentPostId(null)} size="sm" variant="ghost" type="button">Hủy</Button>
                                          <Button isLoading={busyKey === `create-comment-${post.id}`} size="sm" type="submit">Gửi</Button>
                                        </div>
                                      </div>
                                    </form>
                                 )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardShell>

            <div className="space-y-6">
              <CardShell className="p-6 overflow-hidden" variant="elevated">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-ink">Lịch trình</h2>
                    <p className="mt-1 text-sm text-muted">Hạn nộp và sự kiện quan trọng.</p>
                  </div>
                  {isTeacherOwner ? (
                    <Button
                      leftIcon={<PlusCircle className="size-4" />}
                      onClick={() => setScheduleCreateDrawerOpen(true)}
                      size="sm"
                      variant="secondary"
                      className="h-8"
                    >
                      Tạo lịch
                    </Button>
                  ) : null}
                </div>

                {scheduleItems.length === 0 ? (
                  <EmptyState
                    description="Lớp học hiện chưa có lịch trình hoặc sự kiện nào."
                    title="Chưa có lịch"
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-8">
                    {groupedSchedules.map((group) => (
                      <div key={group.label} className="space-y-3">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted whitespace-nowrap">{group.label}</span>
                           <div className="h-px w-full bg-line/60" />
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) => (
                            <div
                              className={cn(
                                "group relative rounded-2xl border bg-surface p-4 transition-all duration-200",
                                highlightedScheduleItemId === item.id
                                  ? "border-brand bg-brand-soft/10 ring-2 ring-brand/10 shadow-sm"
                                  : "border-line hover:border-brand/30 hover:bg-surface-alt/10",
                              )}
                              data-schedule-item-id={item.id}
                              key={item.id}
                              ref={(node) => { scheduleItemRefs.current[item.id] = node; }}
                            >
                              <div className="flex items-start gap-3">
                                 <div className={cn(
                                   "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                   item.type === "Deadline" ? "bg-danger-soft text-danger" : "bg-info-soft text-info"
                                 )}>
                                   {item.type === "Deadline" ? <Clock className="size-5" /> : <CalendarDays className="size-5" />}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-ink leading-tight group-hover:text-brand-strong transition-colors">{item.title}</p>
                                    <p className="mt-1 text-[11px] text-muted flex items-center gap-1.5">
                                       <CalendarDays className="size-3" />
                                       {formatUtcDate(item.startAtUtc)}
                                    </p>
                                 </div>
                                 {isTeacherOwner ? (
                                   <button 
                                     onClick={() => {
                                       setScheduleEditId(item.id);
                                       setScheduleEditDraft({
                                         type: item.type,
                                         title: item.title,
                                         description: item.descriptionPlainText,
                                         startAt: toLocalInput(item.startAtUtc),
                                         endAt: toLocalInput(item.endAtUtc),
                                         timezoneId: item.timezoneId,
                                         isAllDay: item.isAllDay,
                                       });
                                     }}
                                     className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted hover:text-brand-strong"
                                   >
                                     <Edit3 className="size-3.5" />
                                   </button>
                                 ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardShell>
            </div>
          </div>
        </div>
      ) : activeTab === "students" ? (
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
           <ClassStudentList 
            invites={controller.classDetail?.invites ?? []}
            isTeacher={isTeacherOwner} 
            memberships={controller.classDetail?.memberships ?? []} 
            onCancelInvite={(id) => setCancelTargetInviteId(id)}
            onDeleteMembership={(id) => setDeleteTargetMembershipId(id)}
            onResendInvite={(id) => void controller.handleResendInvite(id)}
           />
        </div>
      ) : activeTab === "lessons" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Bài học & Tài liệu</h3>
                <p className="text-xs text-muted">Danh sách các bài giảng và tài liệu đính kèm.</p>
              </div>
           </div>

           {controller.feedItems.filter(i => i.type === "Post" && !isAnnouncementLike(i)).length === 0 ? (
             <EmptyState 
              title="Chưa có bài học"
              description="Giáo viên chưa đăng bài học hoặc tài liệu nào."
              className="py-12"
             />
           ) : (
             <div className="grid gap-4">
                {controller.feedItems.filter(i => i.type === "Post" && !isAnnouncementLike(i)).map(lesson => (
                  <CardShell key={lesson.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                        <FileText className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink truncate">{lesson.title}</h4>
                        <p className="mt-1 text-xs text-muted flex items-center gap-2">
                           <span>{lesson.authorName}</span>
                           <span className="size-1 rounded-full bg-line" />
                           <span>{formatUtcDate(lesson.publishedAtUtc ?? lesson.createdAtUtc)}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => {
                      setActiveTab("overview");
                      // In a real app we'd scroll to the post or open a detail view
                    }}>Xem bài học</Button>
                  </CardShell>
                ))}
             </div>
           )}
        </div>
      ) : activeTab === "notifications" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Thông báo ({controller.notifications?.unreadCount ?? 0} chưa đọc)</h3>
                <p className="text-xs text-muted">Các cập nhật quan trọng từ lớp học.</p>
              </div>
           </div>

           {!controller.notifications || controller.notifications.items.length === 0 ? (
             <EmptyState 
              title="Không có thông báo"
              description="Bạn đã xem hết các thông báo mới."
              className="py-12"
             />
           ) : (
             <div className="space-y-3">
                {controller.notifications.items.map(note => (
                  <CardShell 
                    key={note.id} 
                    className={cn(
                      "p-4 border-l-4 transition",
                      note.isRead ? "border-l-transparent bg-surface opacity-80" : "border-l-brand bg-brand-soft/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                       <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                            note.isRead ? "bg-surface-alt text-muted" : "bg-brand-soft text-brand-strong"
                          )}>
                            <Bell className="size-4" />
                          </div>
                          <div className="min-w-0">
                             <p className={cn("text-sm leading-6", note.isRead ? "text-muted" : "text-ink font-medium")}>
                                {note.message}
                             </p>
                             <p className="mt-1 text-[10px] uppercase font-bold tracking-wider text-muted">
                               {formatUtcDate(note.createdAtUtc)}
                             </p>
                          </div>
                       </div>
                       {!note.isRead && (
                         <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[10px] px-2 uppercase font-bold"
                          onClick={() => void controller.handleMarkNotificationRead(note.id)}
                         >
                           Đánh dấu đã đọc
                         </Button>
                       )}
                    </div>
                  </CardShell>
                ))}
             </div>
           )}
        </div>
      ) : activeTab === "exams" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Bài kiểm tra ({controller.assessments.length})</h3>
                <p className="text-xs text-muted">Các bài đánh giá năng lực trong lớp học.</p>
              </div>
              {isTeacherOwner && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  leftIcon={<PlusCircle className="size-4" />}
                >
                  Tạo bài mới
                </Button>
              )}
           </div>

           {controller.assessments.length === 0 ? (
             <EmptyState 
              title="Chưa có bài kiểm tra"
              description="Giáo viên chưa tạo bài kiểm tra nào cho lớp này."
              className="py-12"
             />
           ) : (
             <div className="grid gap-4">
                {controller.assessments.map(exam => (
                  <CardShell key={exam.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                        exam.status === "Published" ? "bg-brand-soft text-brand-strong" : "bg-panel text-muted"
                      )}>
                        <FileText className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-ink truncate">{exam.title}</h4>
                          <Badge 
                            tone={exam.status === "Published" ? "success" : "warning"} 
                            variant="soft"
                            className="text-[10px]"
                          >
                            {exam.status === "Published" ? "Đã xuất bản" : "Bản nháp"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted line-clamp-1">{exam.descriptionPlainText || "Không có mô tả"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted uppercase tracking-wider">
                           <span className="flex items-center gap-1"><Clock className="size-3" /> {exam.timeLimitMinutes ? `${exam.timeLimitMinutes} phút` : "Không giới hạn"}</span>
                           <span className="size-1 rounded-full bg-line" />
                           <span className="flex items-center gap-1"><Users className="size-3" /> {exam.attemptLimit} lượt làm</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                       {isTeacherOwner ? (
                         <>
                           <Button size="sm" variant="ghost" leftIcon={<Edit3 className="size-4" />}>Sửa</Button>
                           <Button size="sm" variant="ghost" leftIcon={<Trophy className="size-4" />}>Kết quả</Button>
                         </>
                       ) : (
                         exam.status === "Published" && (
                            <Button size="sm" variant="primary" leftIcon={<Edit3 className="size-4" />}>Làm bài</Button>
                         )
                       )}
                       
                       {exam.assessmentKind === "OfflineScan" && (
                         <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-brand-strong text-white border-none hover:bg-brand-strong/90"
                          leftIcon={<Scan className="size-4" />}
                         >
                           Quét OMR
                         </Button>
                       )}

                       <DropdownMenu>
                         <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-xl border border-line bg-panel hover:bg-brand-soft/60 transition">
                           <MoreHorizontal className="size-4" />
                         </DropdownMenuTrigger>
                         <DropdownMenuContent>
                            <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                            {isTeacherOwner && <DropdownMenuItem className="text-danger">Xóa bài</DropdownMenuItem>}
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </CardShell>
                ))}
             </div>
           )}
        </div>
      ) : activeTab === "settings" ? (
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
           <CardShell className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-ink">Thông tin cơ bản</h3>
                <p className="text-sm text-muted">Cập nhật tên lớp và mã tham gia.</p>
              </div>

              <div className="space-y-4">
                <TextField 
                  label="Tên lớp học"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField 
                  label="Mã tham gia"
                  value={settingsForm.code}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  hint="Học sinh sử dụng mã này để tham gia lớp."
                />
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => void controller.handleUpdateClass(settingsForm)}
                    isLoading={busyKey === "update-class"}
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
           </CardShell>

           <CardShell className="p-6 border-danger/20 bg-danger-soft/5 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-danger">Khu vực nguy hiểm</h3>
                <p className="text-sm text-muted">Các hành động này không thể hoàn tác.</p>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-danger/20 bg-surface">
                 <div>
                    <p className="font-bold text-ink">Xóa lớp học</p>
                    <p className="text-xs text-muted">Xóa vĩnh viễn lớp học và toàn bộ dữ liệu liên quan.</p>
                 </div>
                 <Button 
                  variant="danger" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                 >
                   Xóa lớp
                 </Button>
              </div>
           </CardShell>
        </div>
      ) : (
        <CardShell className="p-12 text-center animate-in fade-in duration-500" variant="subtle">
           <EmptyState
             title="Tính năng đang được phát triển"
             description={`Tab ${activeTab} sẽ sớm được ra mắt trong bản cập nhật tiếp theo.`}
           />
        </CardShell>
      )}

      <AddStudentDialog 
        classId={classId}
        joinCode={dashboard.classCode}
        onClose={() => setIsAddStudentOpen(false)}
        open={isAddStudentOpen}
      />

      <ClassDashboardDrawers controller={controller} />


      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setHideCommentTargetId(null);
        }}
        open={hideCommentTargetId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ẩn bình luận này?</AlertDialogTitle>
            <AlertDialogDescription>
              Bình luận sẽ được ẩn thông qua API nội dung lớp hiện có.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setHideCommentTargetId(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                !hideCommentTargetId ||
                busyKey === `hide-comment-${hideCommentTargetId}`
              }
              onClick={() => {
                if (hideCommentTargetId) {
                  void handleHideComment(hideCommentTargetId);
                }
              }}
            >
              Ẩn bình luận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTargetMembershipId !== null}
        onOpenChange={(open) => !open && setDeleteTargetMembershipId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa học sinh?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh này sẽ không còn quyền truy cập vào lớp học.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger-strong"
              onClick={() => {
                if (deleteTargetMembershipId) {
                  void controller.handleDeleteMembership(deleteTargetMembershipId);
                  setDeleteTargetMembershipId(null);
                }
              }}
            >
              Xóa học sinh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelTargetInviteId !== null}
        onOpenChange={(open) => !open && setCancelTargetInviteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy lời mời này?</AlertDialogTitle>
            <AlertDialogDescription>
              Email lời mời sẽ không còn hiệu lực.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTargetInviteId) {
                  void controller.handleCancelInvite(cancelTargetInviteId);
                  setCancelTargetInviteId(null);
                }
              }}
            >
              Hủy lời mời
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn lớp học?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Mọi dữ liệu về học sinh, bài tập và thảo luận sẽ bị xóa sạch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger-strong"
              onClick={() => {
                void controller.handleDeleteClass();
                setIsDeleteDialogOpen(false);
              }}
            >
              Tôi hiểu, xóa lớp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
