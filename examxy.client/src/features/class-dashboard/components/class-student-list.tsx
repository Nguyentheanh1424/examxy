import { Mail, MoreHorizontal, RotateCcw, UserMinus, UserX, XCircle } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CardShell } from '@/components/ui/card-shell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import type { ClassMembership, ClassInvite } from '@/types/classroom'

interface ClassStudentListProps {
  isTeacher: boolean
  memberships: ClassMembership[]
  invites: ClassInvite[]
  onDeleteMembership?: (membershipId: string) => void
  onResendInvite?: (inviteId: string) => void
  onCancelInvite?: (inviteId: string) => void
}

export function ClassStudentList({ 
  isTeacher, 
  memberships, 
  invites,
  onDeleteMembership,
  onResendInvite,
  onCancelInvite
}: ClassStudentListProps) {
  if (memberships.length === 0 && invites.length === 0) {
    return (
      <EmptyState
        description="Chưa có học sinh nào tham gia lớp học này."
        title="Danh sách trống"
        variant="no-data"
      />
    )
  }

  return (
    <div className="space-y-8">
      {memberships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            Học sinh đang học ({memberships.length})
          </h3>
          <div className="grid gap-3">
            {memberships.map((student) => (
              <CardShell
                className="flex items-center justify-between p-3"
                key={student.id}
                variant="subtle"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-line">
                    <AvatarFallback className="bg-brand-soft text-brand-strong font-bold">
                      {(student.studentFullName || student.studentUserName || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{student.studentFullName || student.studentUserName}</p>
                    <p className="text-xs text-muted truncate">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="success" variant="soft">Đang học</Badge>
                  
                  {isTeacher && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-[var(--radius-input)] text-ink transition hover:bg-brand-soft/60">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Mail className="size-4 text-brand-strong" />
                          Gửi email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-danger"
                          onClick={() => onDeleteMembership?.(student.id)}
                        >
                          <UserMinus className="size-4" />
                          Xóa khỏi lớp
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-danger">
                          <UserX className="size-4" />
                          Chặn học sinh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardShell>
            ))}
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Lời mời đang chờ ({invites.length})
          </h3>
          <div className="grid gap-3">
            {invites.map((invite) => (
              <CardShell
                className="flex items-center justify-between p-3 opacity-80"
                key={invite.id}
                variant="flat"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-alt border border-line text-muted">
                    <Mail className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{invite.email}</p>
                    <p className="text-xs text-muted">Lời mời sẽ hết hạn sớm</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="warning" variant="soft">Chờ chấp nhận</Badge>
                  
                  {isTeacher && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-[var(--radius-input)] text-ink transition hover:bg-brand-soft/60">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onResendInvite?.(invite.id)}>
                          <RotateCcw className="size-4 text-brand-strong" />
                          Gửi lại lời mời
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-danger"
                          onClick={() => onCancelInvite?.(invite.id)}
                        >
                          <XCircle className="size-4" />
                          Hủy lời mời
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardShell>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
