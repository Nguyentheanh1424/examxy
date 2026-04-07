# Docs Map

Thu muc `docs/` duoc to chuc de ca nguoi va AI vao repo la co the dinh vi nhanh, chon tai lieu can doc, va cap nhat lai sau khi doi code.

## Doc theo thu tu nay

1. [ai/onboarding.md](ai/onboarding.md)
2. [architecture/solution-map.md](architecture/solution-map.md)
3. [context/current-state.md](context/current-state.md)
4. [features/authentication.md](features/authentication.md)
5. [features/client-authentication.md](features/client-authentication.md)
6. [features/error-handling.md](features/error-handling.md)
7. [runbooks/local-development.md](runbooks/local-development.md)

## Muc dich tung nhom tai lieu

- `ai/`: huong dan de AI vao task nhanh, biet doc file nao truoc, va biet cach trinh bay context.
- `architecture/`: so do repo, ranh gioi project, va entry point quan trong.
- `context/`: trang thai hien tai cua he thong, cac phan dang lam do, va cac diem can can than.
- `lessons/`: bai hoc rut ra sau moi lan gap loi, blocker, hoac fix bug khong ro nguyen nhan.
- `features/`: tai lieu theo chuc nang. Hien tai uu tien auth/identity va backend error handling.
- `features/`: tai lieu theo chuc nang. Hien tai co ca auth backend va auth client.
- `runbooks/`: cach chay local, build, test, migrate, va kiem tra nhanh.
- `conventions/`: quy uoc commit, cap nhat docs, va nguyen tac lam viec chung.
- `decisions/`: noi luu cac quyet dinh ky thuat quan trong sau nay.
- `templates/`: mau prompt, task brief, va checklist de giao viec cho AI.

## Nguyen tac cap nhat docs

- Doi code o project nao thi xem lai tai lieu lien quan cua project do.
- Them feature moi thi them mot file trong `features/`.
- Doi exception tree, middleware, hoac API error response thi cap nhat `features/error-handling.md`.
- Neu doi auth behavior, cap nhat `features/authentication.md`.
- Neu doi auth client route/session/UI, cap nhat `features/client-authentication.md`.
- Neu quyet dinh ky thuat lam doi huong phat trien, them mot note trong `decisions/`.
- Sau mot bugfix hoac blocker dang nho, them hoac cap nhat mot note trong `lessons/`.
- Neu AI can context moi de code nhanh hon, uu tien bo sung vao `ai/` hoac `context/` truoc.
