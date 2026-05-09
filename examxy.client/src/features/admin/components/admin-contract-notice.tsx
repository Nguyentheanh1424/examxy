import { Badge } from '@/components/ui/badge'
import { Notice } from '@/components/ui/notice'

export function AdminContractNotice() {
  return (
    <Notice
      actions={(
        <Badge dot tone="success" variant="soft">
          API ready
        </Badge>
      )}
      tone="success"
      title="Đã kết nối API Admin UI"
    >
      Màn hình này sử dụng các API Admin UI an toàn đã được xác thực.
      Các endpoint bảo trì bí mật chia sẻ nội bộ vẫn chỉ có trên máy chủ.
    </Notice>
  )
}
