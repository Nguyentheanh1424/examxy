import type { ClassFeedItem, ClassScheduleItem, CreateClassCommentRequest, CreateClassPostRequest, CreateClassScheduleItemRequest, UpdateClassCommentRequest, UpdateClassPostRequest, UpdateClassScheduleItemRequest } from '@/types/class-content'

export const reactionTypes = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"] as const;

export const reactionLabels: Record<(typeof reactionTypes)[number], string> = {
  Like: "Thích",
  Love: "Yêu thích",
  Haha: "Haha",
  Wow: "Wow",
  Sad: "Buồn",
  Angry: "Tức giận",
};

export interface PostDraft {
  title: string;
  content: string;
  allowComments: boolean;
  isPinned: boolean;
  notifyAll: boolean;
  taggedUserIds: string[];
}

export interface CommentDraft {
  content: string;
  notifyAll: boolean;
  taggedUserIds: string[];
}

export interface ScheduleDraft {
  type: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  timezoneId: string;
  isAllDay: boolean;
}

export const emptyPostDraft: PostDraft = {
  title: "",
  content: "",
  allowComments: true,
  isPinned: false,
  notifyAll: false,
  taggedUserIds: [],
};

export const emptyCommentDraft: CommentDraft = {
  content: "",
  notifyAll: false,
  taggedUserIds: [],
};

export const emptyScheduleDraft: ScheduleDraft = {
  type: "Event",
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  timezoneId: "",
  isAllDay: false,
};

export function formatUtcDate(value: string | null) {
  if (!value) return "Không có";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toUtc(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function formatStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("active")) return "Đang hoạt động";
  if (normalized.includes("published")) return "Đã xuất bản";
  if (normalized.includes("draft")) return "Bản nháp";
  if (normalized.includes("pending")) return "Đang chờ";
  if (normalized.includes("closed")) return "Đã đóng";
  if (normalized.includes("archived")) return "Đã lưu trữ";

  return status;
}

export function formatScheduleTypeLabel(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("event")) return "Sự kiện";
  if (normalized.includes("deadline")) return "Hạn nộp";
  if (normalized.includes("session")) return "Buổi học";
  if (normalized.includes("reminder")) return "Nhắc nhở";

  return type;
}

export function toCreatePostRequest(draft: PostDraft): CreateClassPostRequest {
  const text = draft.content.trim();
  return {
    type: "Post",
    title: draft.title.trim(),
    contentPlainText: text,
    contentRichText: text,
    allowComments: draft.allowComments,
    isPinned: draft.isPinned,
    notifyAll: draft.notifyAll,
    publishAtUtc: null,
    closeAtUtc: null,
    taggedUserIds: draft.taggedUserIds,
    attachments: [],
  };
}

export function toUpdatePostRequest(
  draft: PostDraft,
  post: ClassFeedItem,
): UpdateClassPostRequest {
  const text = draft.content.trim();
  return {
    title: draft.title.trim(),
    contentPlainText: text,
    contentRichText: text,
    allowComments: draft.allowComments,
    isPinned: draft.isPinned,
    notifyAll: draft.notifyAll,
    publishAtUtc: post.publishAtUtc,
    closeAtUtc: post.closeAtUtc,
    status: post.status,
    taggedUserIds: draft.taggedUserIds,
  };
}

export function toCreateCommentRequest(
  draft: CommentDraft,
): CreateClassCommentRequest {
  const text = draft.content.trim();
  return {
    contentPlainText: text,
    contentRichText: text,
    notifyAll: draft.notifyAll,
    taggedUserIds: draft.taggedUserIds,
  };
}

export function toUpdateCommentRequest(
  draft: CommentDraft,
): UpdateClassCommentRequest {
  const text = draft.content.trim();
  return {
    contentPlainText: text,
    contentRichText: text,
    notifyAll: draft.notifyAll,
    taggedUserIds: draft.taggedUserIds,
  };
}

export function toScheduleRequest(
  draft: ScheduleDraft,
): CreateClassScheduleItemRequest {
  const text = draft.description.trim();
  return {
    type: draft.type,
    title: draft.title.trim(),
    descriptionPlainText: text,
    descriptionRichText: text,
    startAtUtc: toUtc(draft.startAt) ?? new Date().toISOString(),
    endAtUtc: toUtc(draft.endAt),
    timezoneId: draft.timezoneId.trim(),
    isAllDay: draft.isAllDay,
    relatedPostId: null,
    relatedAssessmentId: null,
  };
}

export function toScheduleUpdateRequest(
  draft: ScheduleDraft,
): UpdateClassScheduleItemRequest {
  const text = draft.description.trim();
  return {
    type: draft.type,
    title: draft.title.trim(),
    descriptionPlainText: text,
    descriptionRichText: text,
    startAtUtc: toUtc(draft.startAt) ?? new Date().toISOString(),
    endAtUtc: toUtc(draft.endAt),
    timezoneId: draft.timezoneId.trim(),
    isAllDay: draft.isAllDay,
    relatedPostId: null,
    relatedAssessmentId: null,
  };
}

export type DashboardBadgeTone =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

export function getStatusTone(status: string): DashboardBadgeTone {
  const normalized = status.toLowerCase();

  if (normalized.includes("active") || normalized.includes("published")) {
    return "success";
  }

  if (normalized.includes("draft") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("closed") || normalized.includes("archived")) {
    return "neutral";
  }

  return "info";
}

export function isAnnouncementLike(item: ClassFeedItem) {
  return item.type.toLowerCase().includes("announcement");
}

export function filterFeedItems(items: ClassFeedItem[], tab: string) {
  if (tab === "pinned") {
    return items.filter((item) => item.isPinned);
  }

  if (tab === "announcements") {
    return items.filter(isAnnouncementLike);
  }

  return items;
}

export interface ScheduleGroup {
  label: string;
  items: ClassScheduleItem[];
}

export function groupScheduleItems(items: ClassScheduleItem[]): ScheduleGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const groups: Record<string, ClassScheduleItem[]> = {
    "Hôm nay": [],
    "Tuần này": [],
    "Sau đó": [],
  };

  items.sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());

  items.forEach((item) => {
    const startDate = new Date(item.startAtUtc);
    if (startDate < tomorrow) {
      groups["Hôm nay"].push(item);
    } else if (startDate < nextWeek) {
      groups["Tuần này"].push(item);
    } else {
      groups["Sau đó"].push(item);
    }
  });

  return Object.entries(groups)
    .map(([label, items]) => ({ label, items }))
    .filter((group) => group.items.length > 0);
}

export interface AttentionItem {
  id: string;
  type: "notification" | "schedule" | "pinned" | "comment";
  title: string;
  description: string;
  actionLabel?: string;
  link?: string;
  severity?: "info" | "warning" | "danger";
}
