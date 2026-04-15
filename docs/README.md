# Docs Portal

Muc tieu cua `docs/` la de team vao du an va tim duoc dung tai lieu trong vai phut, khong phai doan context.

## Doc nhanh theo vai tro

1. AI/teammate moi vao task:
   - [ai/onboarding.md](ai/onboarding.md)
   - [architecture/solution-map.md](architecture/solution-map.md)
   - [architecture/database-erd.md](architecture/database-erd.md)
   - [context/current-state.md](context/current-state.md)
2. Backend auth + classroom:
   - [features/README.md](features/README.md)
   - [features/authentication.md](features/authentication.md)
   - [features/identity-class-foundation.md](features/identity-class-foundation.md)
3. Frontend auth/client:
   - [features/client-authentication.md](features/client-authentication.md)
4. Local setup va van hanh:
   - [runbooks/local-development.md](runbooks/local-development.md)
   - [runbooks/test-data-catalog.md](runbooks/test-data-catalog.md)

## Ban do thu muc

- `ai/`: onboarding cho AI va cach vao task nhanh.
- `architecture/`: map project, boundaries, entry points.
  - database ERD: `architecture/database-erd.md`
- `context/`: trang thai hien tai va ghi chu handover.
- `features/`: tai lieu theo feature, API flow, backlog/gaps.
- `runbooks/`: huong dan chay local va verify.
- `conventions/`: quy uoc code/docs/commit.
- `decisions/`: quyet dinh ky thuat quan trong.
- `lessons/`: postmortem ngan sau bug/blocker.
- `templates/`: mau tai lieu de tai su dung.

## Quy tac dieu huong docs

- Moi feature lon phai co 1 file tong quan trong `features/`.
- Moi flow API co tu 3 buoc tro len thi co them file `api-flow-*`.
- Moi thay doi boundary architecture phai cap nhat:
  - `architecture/solution-map.md`
  - `context/current-state.md`
- Moi thay doi auth/classroom phai cap nhat file trong `features/README.md`.

## Quy tac cap nhat sau khi code

- Doi behavior API: cap nhat feature doc + flow doc lien quan.
- Doi error contract/middleware: cap nhat `features/error-handling.md`.
- Doi setup/local env: cap nhat `runbooks/local-development.md`.
- Doi conventions: cap nhat `conventions/documentation-rules.md`.
