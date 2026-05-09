import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import type { ClassDashboardPageController } from "@/features/class-dashboard/hooks/use-class-dashboard-page";
import { MentionCandidatePicker } from "@/features/mentions/components/mention-candidate-picker";

export function ClassDashboardDrawers({ controller }: { controller: ClassDashboardPageController }) {
  const { busyKey, mentionCandidates, postCreateDrawerOpen, setPostCreateDrawerOpen, postCreateDraft, setPostCreateDraft, postEditId, setPostEditId, postEditDraft, setPostEditDraft, commentEditId, setCommentEditId, commentEditDraft, setCommentEditDraft, scheduleCreateDrawerOpen, setScheduleCreateDrawerOpen, scheduleCreateDraft, setScheduleCreateDraft, scheduleEditId, setScheduleEditId, scheduleEditDraft, setScheduleEditDraft, handleCreatePost, handleUpdatePost, handleUpdateComment, handleCreateSchedule, handleUpdateSchedule } = controller;

  return (
    <>
      <Drawer
        onOpenChange={setPostCreateDrawerOpen}
        open={postCreateDrawerOpen}
      >
        {postCreateDrawerOpen ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Tạo bài viết</DrawerTitle>
              <DrawerDescription>
                Chia sẻ cập nhật lớp học thông qua API nội dung lớp hiện có.
              </DrawerDescription>
            </DrawerHeader>
            <form className="space-y-3" onSubmit={handleCreatePost}>
              <TextField
                label="Tiêu đề bài viết"
                onChange={(event) =>
                  setPostCreateDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                value={postCreateDraft.title}
              />
              <TextareaField
                label="Nội dung bài viết"
                onChange={(event) =>
                  setPostCreateDraft((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                rows={4}
                value={postCreateDraft.content}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <CheckboxField
                  checked={postCreateDraft.allowComments}
                  label="Cho phép bình luận"
                  onChange={(event) =>
                    setPostCreateDraft((current) => ({
                      ...current,
                      allowComments: event.target.checked,
                    }))
                  }
                />
                <CheckboxField
                  checked={postCreateDraft.isPinned}
                  label="Ghim"
                  onChange={(event) =>
                    setPostCreateDraft((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                    }))
                  }
                />
                <CheckboxField
                  checked={postCreateDraft.notifyAll}
                  label="Thông báo tất cả"
                  onChange={(event) =>
                    setPostCreateDraft((current) => ({
                      ...current,
                      notifyAll: event.target.checked,
                    }))
                  }
                />
              </div>
              <MentionCandidatePicker
                candidates={mentionCandidates}
                onChange={(nextUserIds) =>
                  setPostCreateDraft((current) => ({
                    ...current,
                    taggedUserIds: nextUserIds,
                  }))
                }
                selectedUserIds={postCreateDraft.taggedUserIds}
              />
              <DrawerFooter>
                <Button isLoading={busyKey === "create-post"} type="submit">
                  Tạo bài viết
                </Button>
                <Button
                  onClick={() => setPostCreateDrawerOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer
        onOpenChange={(open) => {
          if (!open) setPostEditId(null);
        }}
        open={postEditId !== null}
      >
        {postEditId !== null ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Sửa bài viết</DrawerTitle>
              <DrawerDescription>
                Cập nhật bài viết đã chọn mà không làm rối bảng tin.
              </DrawerDescription>
            </DrawerHeader>
            <form className="space-y-3" onSubmit={handleUpdatePost}>
              <TextField
                label="Sửa tiêu đề"
                onChange={(event) =>
                  setPostEditDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                value={postEditDraft.title}
              />
              <TextareaField
                label="Sửa nội dung"
                onChange={(event) =>
                  setPostEditDraft((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                rows={3}
                value={postEditDraft.content}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <CheckboxField
                  checked={postEditDraft.allowComments}
                  label="Cho phép bình luận"
                  onChange={(event) =>
                    setPostEditDraft((current) => ({
                      ...current,
                      allowComments: event.target.checked,
                    }))
                  }
                />
                <CheckboxField
                  checked={postEditDraft.isPinned}
                  label="Ghim"
                  onChange={(event) =>
                    setPostEditDraft((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                    }))
                  }
                />
                <CheckboxField
                  checked={postEditDraft.notifyAll}
                  label="Thông báo tất cả"
                  onChange={(event) =>
                    setPostEditDraft((current) => ({
                      ...current,
                      notifyAll: event.target.checked,
                    }))
                  }
                />
              </div>
              <MentionCandidatePicker
                candidates={mentionCandidates}
                onChange={(nextUserIds) =>
                  setPostEditDraft((current) => ({
                    ...current,
                    taggedUserIds: nextUserIds,
                  }))
                }
                selectedUserIds={postEditDraft.taggedUserIds}
              />
              <DrawerFooter>
                <Button isLoading={busyKey === "update-post"} type="submit">
                  Lưu bài viết
                </Button>
                <Button
                  onClick={() => setPostEditId(null)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer
        onOpenChange={(open) => {
          if (!open) setCommentEditId(null);
        }}
        open={commentEditId !== null}
      >
        {commentEditId ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,36rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Sửa bình luận đã chọn</DrawerTitle>
              <DrawerDescription>
                Chỉnh sửa bình luận trong khung riêng mà vẫn giữ ngữ cảnh bảng
                tin.
              </DrawerDescription>
            </DrawerHeader>
            <form className="space-y-3" onSubmit={handleUpdateComment}>
              <TextareaField
                label="Nội dung bình luận"
                onChange={(event) =>
                  setCommentEditDraft((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                rows={3}
                value={commentEditDraft.content}
              />
              <CheckboxField
                checked={commentEditDraft.notifyAll}
                label="Thông báo tất cả"
                onChange={(event) =>
                  setCommentEditDraft((current) => ({
                    ...current,
                    notifyAll: event.target.checked,
                  }))
                }
              />
              <MentionCandidatePicker
                candidates={mentionCandidates}
                onChange={(nextUserIds) =>
                  setCommentEditDraft((current) => ({
                    ...current,
                    taggedUserIds: nextUserIds,
                  }))
                }
                selectedUserIds={commentEditDraft.taggedUserIds}
              />
              <DrawerFooter>
                <Button isLoading={busyKey === "update-comment"} type="submit">
                  Lưu bình luận
                </Button>
                <Button
                  onClick={() => setCommentEditId(null)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer
        onOpenChange={setScheduleCreateDrawerOpen}
        open={scheduleCreateDrawerOpen}
      >
        {scheduleCreateDrawerOpen ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Tạo lịch trình</DrawerTitle>
              <DrawerDescription>
                Thêm hạn nộp, buổi học hoặc nhắc nhở vào lịch của lớp.
              </DrawerDescription>
            </DrawerHeader>
            <form className="space-y-3" onSubmit={handleCreateSchedule}>
              <TextField
                label="Loại"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                value={scheduleCreateDraft.type}
              />
              <TextField
                label="Tiêu đề"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                value={scheduleCreateDraft.title}
              />
              <TextareaField
                label="Mô tả"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                value={scheduleCreateDraft.description}
              />
              <TextField
                label="Bắt đầu lúc"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    startAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={scheduleCreateDraft.startAt}
              />
              <TextField
                label="Kết thúc lúc"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    endAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={scheduleCreateDraft.endAt}
              />
              <TextField
                label="Múi giờ"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    timezoneId: event.target.value,
                  }))
                }
                value={scheduleCreateDraft.timezoneId}
              />
              <CheckboxField
                checked={scheduleCreateDraft.isAllDay}
                label="Cả ngày"
                onChange={(event) =>
                  setScheduleCreateDraft((current) => ({
                    ...current,
                    isAllDay: event.target.checked,
                  }))
                }
              />
              <DrawerFooter>
                <Button isLoading={busyKey === "create-schedule"} type="submit">
                  Tạo lịch trình
                </Button>
                <Button
                  onClick={() => setScheduleCreateDrawerOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        ) : null}
      </Drawer>

      <Drawer
        onOpenChange={(open) => {
          if (!open) setScheduleEditId(null);
        }}
        open={scheduleEditId !== null}
      >
        {scheduleEditId !== null ? (
          <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
            <DrawerHeader>
              <DrawerTitle>Sửa sự kiện</DrawerTitle>
              <DrawerDescription>
                Cập nhật lịch trình đã chọn trong khung riêng.
              </DrawerDescription>
            </DrawerHeader>
            <form className="space-y-3" onSubmit={handleUpdateSchedule}>
              <TextField
                label="Loại"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                value={scheduleEditDraft.type}
              />
              <TextField
                label="Tiêu đề"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                value={scheduleEditDraft.title}
              />
              <TextareaField
                label="Mô tả"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                value={scheduleEditDraft.description}
              />
              <TextField
                label="Bắt đầu lúc"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    startAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={scheduleEditDraft.startAt}
              />
              <TextField
                label="Kết thúc lúc"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    endAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={scheduleEditDraft.endAt}
              />
              <TextField
                label="Múi giờ"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    timezoneId: event.target.value,
                  }))
                }
                value={scheduleEditDraft.timezoneId}
              />
              <CheckboxField
                checked={scheduleEditDraft.isAllDay}
                label="Cả ngày"
                onChange={(event) =>
                  setScheduleEditDraft((current) => ({
                    ...current,
                    isAllDay: event.target.checked,
                  }))
                }
              />
              <DrawerFooter>
                <Button isLoading={busyKey === "update-schedule"} type="submit">
                  Lưu
                </Button>
                <Button
                  onClick={() => setScheduleEditId(null)}
                  type="button"
                  variant="secondary"
                >
                  Hủy
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        ) : null}
      </Drawer>
    </>
  );
}
