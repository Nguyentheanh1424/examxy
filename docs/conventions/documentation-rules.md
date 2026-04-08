# Documentation Rules

## Khi nao can cap nhat docs

- Them feature moi
- Doi luong nghiep vu hoac luong ky thuat
- Doi startup/config/migration
- Doi cau truc repo hoac ten project
- Xuat hien bai hoc quan trong ma AI nen nho cho lan sau
- Vua fix xong mot bug, blocker, hoac huong debug ton thoi gian

## Cach cap nhat nhanh

- Repo map doi: cap nhat `architecture/solution-map.md`
- Feature doi: cap nhat file trong `features/`
- Setup doi: cap nhat `runbooks/local-development.md`
- Quy tac lam viec doi: cap nhat `ai/onboarding.md` hoac `conventions/`
- Bai hoc sau bugfix: them mot file trong `lessons/`

## Muc tieu

- AI vao repo nhanh hon
- Giam viec phai hoi lai context cu
- Giu tai lieu song hanh voi code, khong de thanh ghi chep chet

## Copy/test rule

- Neu mot chuoi UI duoc test assert lai nhieu hon 1 noi, dat no vao mot module copy chung cua feature va cho ca page lẫn test import cung mot nguon.
- Khi doi copy da duoc test bao ve, cap nhat module copy truoc; khong sua test roi bo UI di lai.
- Uu tien test theo semantic role/label/heading, chi assert text literal khi do la contract cua copy chung.

## Checklist sau bugfix

- Ghi lai symptom de lan sau nhin log la nhan ra
- Ghi lai root cause, khong chi mo ta hien tuong
- Ghi lai file/lenh can kiem tra dau tien
- Ghi lai cach verify da fix
- Neu can, them mot muc "how to prevent" de AI biet cap nhat test/runbook/doc nao nua
