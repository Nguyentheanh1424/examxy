import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";
import { createClassCommentRequest, createClassPostRequest, createClassScheduleItemRequest, getClassDashboardRequest, getClassFeedRequest, getClassMentionCandidatesRequest, getClassScheduleItemsRequest, hideClassCommentRequest, setCommentReactionRequest, setPostReactionRequest, updateClassCommentRequest, updateClassPostRequest, updateClassScheduleItemRequest } from "@/features/class-content/lib/class-content-api";
import { getNotificationsRequest, markNotificationAsReadRequest } from "@/features/notifications/lib/notification-api";
import { getClassAssessmentsRequest } from "@/features/assessments/lib/assessment-api";
import { realtimeEventTypes, realtimeScopeTypes } from "@/features/realtime/lib/realtime-event-types";
import type { RealtimeEventEnvelope } from "@/features/realtime/types/realtime";
import { useRealtime } from "@/features/realtime/use-realtime";
import { cancelTeacherClassInviteRequest, deleteTeacherClassMembershipRequest, deleteTeacherClassRequest, getTeacherClassRequest, resendTeacherClassInviteRequest, updateTeacherClassRequest } from "@/features/classrooms/lib/class-api";
import { getErrorMessage } from "@/lib/http/api-error";
import type { Assessment } from "@/types/assessment";
import type { NotificationInboxList } from "@/types/notification";
import type { ClassDashboard, ClassFeedItem, ClassMentionCandidate, ClassScheduleItem } from "@/types/class-content";
import type { TeacherClassDetail, UpdateTeacherClassRequest } from "@/types/classroom";
import { emptyCommentDraft, emptyPostDraft, emptyScheduleDraft, filterFeedItems, isAnnouncementLike, reactionTypes, toCreateCommentRequest, toCreatePostRequest, toScheduleRequest, toScheduleUpdateRequest, toUpdateCommentRequest, toUpdatePostRequest, type CommentDraft, type PostDraft, type ScheduleDraft } from "@/features/class-dashboard/lib/class-dashboard-page-mappers";

export function useClassDashboardPage() {
  const { classId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { addEventListener, subscribeClass, unsubscribeClass } = useRealtime();

  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null);
  const [feedItems, setFeedItems] = useState<ClassFeedItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ClassScheduleItem[]>([]);
  const [mentionCandidates, setMentionCandidates] = useState<
    ClassMentionCandidate[]
  >([]);
  const [classDetail, setClassDetail] = useState<TeacherClassDetail | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [notifications, setNotifications] = useState<NotificationInboxList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [postCreateDraft, setPostCreateDraft] =
    useState<PostDraft>(emptyPostDraft);
  const [postCreateDrawerOpen, setPostCreateDrawerOpen] = useState(false);
  const [postEditId, setPostEditId] = useState<string | null>(null);
  const [postEditDraft, setPostEditDraft] = useState<PostDraft>(emptyPostDraft);
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<
    Record<string, CommentDraft>
  >({});
  const [focusedCommentPostId, setFocusedCommentPostId] = useState<
    string | null
  >(null);
  const [commentEditId, setCommentEditId] = useState<string | null>(null);
  const [commentEditDraft, setCommentEditDraft] =
    useState<CommentDraft>(emptyCommentDraft);
  const [scheduleCreateDraft, setScheduleCreateDraft] =
    useState<ScheduleDraft>(emptyScheduleDraft);
  const [scheduleCreateDrawerOpen, setScheduleCreateDrawerOpen] =
    useState(false);
  const [scheduleEditId, setScheduleEditId] = useState<string | null>(null);
  const [scheduleEditDraft, setScheduleEditDraft] =
    useState<ScheduleDraft>(emptyScheduleDraft);
  const [highlightedScheduleItemId, setHighlightedScheduleItemId] = useState<
    string | null
  >(null);
  const [notice, setNotice] = useState<{
    tone: "error" | "success";
    title: string;
    message: string;
  } | null>(null);
  const [feedTab, setFeedTab] = useState("all");
  const [hideCommentTargetId, setHideCommentTargetId] = useState<string | null>(
    null,
  );
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const scheduleHighlightTimeoutRef = useRef<number | null>(null);
  const scheduleItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const handledScheduleTargetRef = useRef<string | null>(null);
  const refreshDataRef = useRef<(showLoader: boolean) => Promise<void>>(
    async () => undefined,
  );
  const selectedScheduleItemId = searchParams.get("scheduleItemId");

  const isTeacherOwner = useMemo(
    () =>
      Boolean(session?.primaryRole === "Teacher" && dashboard?.isTeacherOwner),
    [dashboard?.isTeacherOwner, session?.primaryRole],
  );
  const canComment = Boolean(
    isTeacherOwner || session?.primaryRole === "Student",
  );
  const mentionCandidateByUserId = useMemo(
    () =>
      new Map(
        mentionCandidates.map(
          (candidate) => [candidate.userId, candidate] as const,
        ),
      ),
    [mentionCandidates],
  );
  const hasAnnouncements = useMemo(
    () => feedItems.some(isAnnouncementLike),
    [feedItems],
  );
  const filteredFeedItems = useMemo(
    () => filterFeedItems(feedItems, feedTab),
    [feedItems, feedTab],
  );
  const pinnedFeedItemCount = useMemo(
    () => feedItems.filter((item) => item.isPinned).length,
    [feedItems],
  );
  const announcementFeedItemCount = useMemo(
    () => feedItems.filter(isAnnouncementLike).length,
    [feedItems],
  );

  useEffect(() => {
    if (feedTab === "announcements" && !hasAnnouncements) {
      setFeedTab("all");
    }
  }, [feedTab, hasAnnouncements]);

  async function loadData() {
    const [dashboardResponse, feedResponse, scheduleResponse, mentionResponse, assessmentsResponse, notificationsResponse] =
      await Promise.all([
        getClassDashboardRequest(classId),
        getClassFeedRequest(classId),
        getClassScheduleItemsRequest(classId),
        getClassMentionCandidatesRequest(classId),
        getClassAssessmentsRequest(classId),
        getNotificationsRequest({ classId, limit: 50 }),
      ]);
    setDashboard(dashboardResponse);
    setFeedItems(feedResponse);
    setScheduleItems(scheduleResponse);
    setMentionCandidates(mentionResponse);
    setAssessments(assessmentsResponse);
    setNotifications(notificationsResponse);

    if (session?.primaryRole === "Teacher") {
      try {
        const detailResponse = await getTeacherClassRequest(classId);
        setClassDetail(detailResponse);
      } catch (e) {
        console.error("Failed to load teacher class detail", e);
      }
    }

    setScheduleCreateDraft((current) => ({
      ...current,
      timezoneId: dashboardResponse.timezoneId,
    }));
  }

  async function refreshData(showLoader: boolean) {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      await loadData();
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Không thể tải bảng điều khiển."));
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }

  refreshDataRef.current = refreshData;

  useEffect(() => {
    if (!classId) {
      setError("Thiếu mã lớp trong đường dẫn.");
      setIsLoading(false);
      return;
    }
    void refreshData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }

      if (scheduleHighlightTimeoutRef.current !== null) {
        window.clearTimeout(scheduleHighlightTimeoutRef.current);
        scheduleHighlightTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedScheduleItemId) {
      handledScheduleTargetRef.current = null;
      setHighlightedScheduleItemId(null);
      return;
    }

    if (handledScheduleTargetRef.current === selectedScheduleItemId) {
      return;
    }

    const node = scheduleItemRefs.current[selectedScheduleItemId];
    if (
      !node ||
      !scheduleItems.some((item) => item.id === selectedScheduleItemId)
    ) {
      return;
    }

    handledScheduleTargetRef.current = selectedScheduleItemId;
    setHighlightedScheduleItemId(selectedScheduleItemId);
    node.scrollIntoView({ behavior: "smooth", block: "center" });

    if (scheduleHighlightTimeoutRef.current !== null) {
      window.clearTimeout(scheduleHighlightTimeoutRef.current);
    }

    scheduleHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedScheduleItemId((current) =>
        current === selectedScheduleItemId ? null : current,
      );
      scheduleHighlightTimeoutRef.current = null;
    }, 2000);
  }, [scheduleItems, selectedScheduleItemId]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    subscribeClass(classId);

    return () => {
      unsubscribeClass(classId);
    };
  }, [classId, subscribeClass, unsubscribeClass]);

  useEffect(() => {
    function scheduleRealtimeRefresh() {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        void refreshDataRef.current(false);
      }, 250);
    }

    function isCurrentClassEvent(event: RealtimeEventEnvelope) {
      return event.classId === classId;
    }

    function shouldRefreshFromRealtime(event: RealtimeEventEnvelope) {
      switch (event.eventType) {
        case realtimeEventTypes.post.created:
        case realtimeEventTypes.post.updated:
        case realtimeEventTypes.comment.created:
        case realtimeEventTypes.comment.updated:
        case realtimeEventTypes.comment.hidden:
        case realtimeEventTypes.reaction.postUpdated:
        case realtimeEventTypes.reaction.commentUpdated:
          return isCurrentClassEvent(event);
        case realtimeEventTypes.notification.created:
        case realtimeEventTypes.notification.read:
          return (
            event.scope === realtimeScopeTypes.user &&
            isCurrentClassEvent(event)
          );
        default:
          return false;
      }
    }

    const removeListener = addEventListener((event) => {
      if (!shouldRefreshFromRealtime(event)) {
        return;
      }

      scheduleRealtimeRefresh();
    });

    return removeListener;
  }, [addEventListener, classId]);

  function getCommentDraft(postId: string) {
    return commentDraftByPostId[postId] ?? emptyCommentDraft;
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadData();
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi làm mới",
        message: getErrorMessage(
          nextError,
          "Không thể làm mới bảng điều khiển lớp học.",
        ),
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSetPostReaction(
    post: ClassFeedItem,
    reactionType: (typeof reactionTypes)[number],
  ) {
    try {
      const summary = await setPostReactionRequest(classId, post.id, {
        reactionType:
          post.reactions.viewerReaction === reactionType ? null : reactionType,
      });

      setFeedItems((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, reactions: summary } : item,
        ),
      );
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi cập nhật cảm xúc",
        message: getErrorMessage(
          nextError,
          "Không thể cập nhật cảm xúc bài viết.",
        ),
      });
    }
  }

  async function handleSetCommentReaction(
    postId: string,
    commentId: string,
    currentReaction: string | null,
    reactionType: (typeof reactionTypes)[number],
  ) {
    try {
      const summary = await setCommentReactionRequest(classId, commentId, {
        reactionType: currentReaction === reactionType ? null : reactionType,
      });

      setFeedItems((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: item.comments.map((candidate) =>
                  candidate.id === commentId
                    ? { ...candidate, reactions: summary }
                    : candidate,
                ),
              }
            : item,
        ),
      );
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi cập nhật cảm xúc",
        message: getErrorMessage(
          nextError,
          "Không thể cập nhật cảm xúc bình luận.",
        ),
      });
    }
  }

  async function runMutation(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    setNotice(null);
    try {
      await action();
      await handleRefresh();
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postCreateDraft.title.trim() || !postCreateDraft.content.trim()) {
      setNotice({
        tone: "error",
        title: "Thiếu nội dung bài viết",
        message: "Vui lòng nhập tiêu đề và nội dung.",
      });
      return;
    }
    try {
      await runMutation("create-post", async () => {
        await createClassPostRequest(
          classId,
          toCreatePostRequest(postCreateDraft),
        );
        setPostCreateDraft(emptyPostDraft);
        setPostCreateDrawerOpen(false);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi tạo bài viết",
        message: getErrorMessage(nextError, "Không thể tạo bài viết."),
      });
    }
  }

  async function handleUpdatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postEditId) return;
    const currentPost = feedItems.find((item) => item.id === postEditId);
    if (!currentPost) return;
    try {
      await runMutation("update-post", async () => {
        await updateClassPostRequest(
          classId,
          postEditId,
          toUpdatePostRequest(postEditDraft, currentPost),
        );
        setPostEditId(null);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi cập nhật bài viết",
        message: getErrorMessage(nextError, "Không thể cập nhật bài viết."),
      });
    }
  }

  async function handleCreateComment(
    event: FormEvent<HTMLFormElement>,
    postId: string,
  ) {
    event.preventDefault();
    const draft = getCommentDraft(postId);
    if (!draft.content.trim()) {
      setNotice({
        tone: "error",
        title: "Thiếu nội dung bình luận",
        message: "Vui lòng nhập nội dung bình luận.",
      });
      return;
    }
    try {
      await runMutation(`create-comment-${postId}`, async () => {
        await createClassCommentRequest(
          classId,
          postId,
          toCreateCommentRequest(draft),
        );
        setCommentDraftByPostId((current) => ({
          ...current,
          [postId]: emptyCommentDraft,
        }));
        setFocusedCommentPostId(null);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi tạo bình luận",
        message: getErrorMessage(nextError, "Không thể tạo bình luận."),
      });
    }
  }

  async function handleUpdateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentEditId) return;
    try {
      await runMutation("update-comment", async () => {
        await updateClassCommentRequest(
          classId,
          commentEditId,
          toUpdateCommentRequest(commentEditDraft),
        );
        setCommentEditId(null);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi cập nhật bình luận",
        message: getErrorMessage(nextError, "Không thể cập nhật bình luận."),
      });
    }
  }

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleCreateDraft.title.trim() || !scheduleCreateDraft.startAt) {
      setNotice({
        tone: "error",
        title: "Thiếu thông tin lịch trình",
        message: "Vui lòng nhập tiêu đề và ngày bắt đầu.",
      });
      return;
    }
    try {
      await runMutation("create-schedule", async () => {
        await createClassScheduleItemRequest(
          classId,
          toScheduleRequest(scheduleCreateDraft),
        );
        setScheduleCreateDraft((current) => ({
          ...emptyScheduleDraft,
          timezoneId: current.timezoneId,
        }));
        setScheduleCreateDrawerOpen(false);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi tạo lịch trình",
        message: getErrorMessage(nextError, "Không thể tạo lịch trình."),
      });
    }
  }

  async function handleUpdateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleEditId) return;
    try {
      await runMutation("update-schedule", async () => {
        await updateClassScheduleItemRequest(
          classId,
          scheduleEditId,
          toScheduleUpdateRequest(scheduleEditDraft),
        );
        setScheduleEditId(null);
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Lỗi cập nhật lịch trình",
        message: getErrorMessage(nextError, "Không thể cập nhật lịch trình."),
      });
    }
  }

  async function handleHideComment(commentId: string) {
    await runMutation(`hide-comment-${commentId}`, async () => {
      await hideClassCommentRequest(classId, commentId);
      setHideCommentTargetId(null);
    });
  }

  async function handleUpdateClass(request: UpdateTeacherClassRequest) {
    await runMutation("update-class", async () => {
      await updateTeacherClassRequest(classId, request);
      setNotice({
        tone: "success",
        title: "Cập nhật thành công",
        message: "Thông tin lớp học đã được cập nhật.",
      });
    });
  }

  async function handleDeleteClass() {
    await runMutation("delete-class", async () => {
      await deleteTeacherClassRequest(classId);
    });
  }

  async function handleDeleteMembership(membershipId: string) {
    await runMutation(`delete-membership-${membershipId}`, async () => {
      await deleteTeacherClassMembershipRequest(classId, membershipId);
      setNotice({
        tone: "success",
        title: "Đã xóa học sinh",
        message: "Học sinh đã được xóa khỏi lớp học.",
      });
    });
  }

  async function handleResendInvite(inviteId: string) {
    await runMutation(`resend-invite-${inviteId}`, async () => {
      await resendTeacherClassInviteRequest(classId, inviteId);
      setNotice({
        tone: "success",
        title: "Đã gửi lại",
        message: "Lời mời đã được gửi lại thành công.",
      });
    });
  }

  async function handleCancelInvite(inviteId: string) {
    await runMutation(`cancel-invite-${inviteId}`, async () => {
      await cancelTeacherClassInviteRequest(classId, inviteId);
      setNotice({
        tone: "success",
        title: "Đã hủy lời mời",
        message: "Lời mời đã được hủy bỏ.",
      });
    });
  }

  async function handleMarkNotificationRead(notificationId: string) {
    try {
      await markNotificationAsReadRequest(notificationId);
      setNotifications(current => {
        if (!current) return null;
        return {
          ...current,
          items: current.items.map(item => item.id === notificationId ? { ...item, isRead: true } : item),
          unreadCount: Math.max(0, current.unreadCount - 1)
        };
      });
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  }

  return { classId, session, dashboard, setDashboard, classDetail, setClassDetail, feedItems, setFeedItems, scheduleItems, setScheduleItems, assessments, setAssessments, notifications, setNotifications, mentionCandidates, setMentionCandidates, mentionCandidateByUserId, isLoading, isRefreshing, busyKey, error, notice, setNotice, isTeacherOwner, canComment, postCreateDrawerOpen, setPostCreateDrawerOpen, postEditId, setPostEditId, postCreateDraft, setPostCreateDraft, postEditDraft, setPostEditDraft, commentDraftByPostId, setCommentDraftByPostId, focusedCommentPostId, setFocusedCommentPostId, commentEditId, setCommentEditId, commentEditDraft, setCommentEditDraft, scheduleCreateDrawerOpen, setScheduleCreateDrawerOpen, scheduleCreateDraft, setScheduleCreateDraft, scheduleEditId, setScheduleEditId, scheduleEditDraft, setScheduleEditDraft, highlightedScheduleItemId, setHighlightedScheduleItemId, hideCommentTargetId, setHideCommentTargetId, scheduleItemRefs, feedTab, setFeedTab, hasAnnouncements, filteredFeedItems, pinnedFeedItemCount, announcementFeedItemCount, handleRefresh, handleSetPostReaction, handleSetCommentReaction, getCommentDraft, handleCreatePost, handleUpdatePost, handleCreateComment, handleUpdateComment, handleCreateSchedule, handleUpdateSchedule, handleHideComment, handleUpdateClass, handleDeleteClass, handleDeleteMembership, handleResendInvite, handleCancelInvite, handleMarkNotificationRead }
}

export type ClassDashboardPageController = ReturnType<typeof useClassDashboardPage>
