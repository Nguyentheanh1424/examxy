# AI Onboarding

Tai lieu nay giup AI vao repo nhanh va giam thoi gian doan context.

## Bat dau tu dau

1. Doc [docs/README.md](../README.md)
2. Doc [docs/architecture/solution-map.md](../architecture/solution-map.md)
3. Doc [docs/context/current-state.md](../context/current-state.md)
4. Neu task lien quan auth, doc [docs/features/authentication.md](../features/authentication.md)
5. Neu task lien quan frontend auth/client routes, doc [docs/features/client-authentication.md](../features/client-authentication.md)
6. Neu task lien quan API status, exception, middleware, hoac validation, doc [docs/features/error-handling.md](../features/error-handling.md)
7. Neu task lien quan setup local hoac migrate, doc [docs/runbooks/local-development.md](../runbooks/local-development.md)
8. Neu task la fix bug hoac blocker, doc [docs/lessons/README.md](../lessons/README.md)

## Nhan dien nhanh repo

- Backend host hien tai: `examxy.Server`
- Application contracts va shared exceptions: `examxy.Application`
- Domain core: `examxy.Domain`
- Infrastructure va Identity: `examxy.Infrastructure`
- Frontend React/Vite: `examxy.client`
- Test projects: `test.Application`, `test.Domain`, `test.Integration`
- Script migrate: `scripts/`

## Quy tac lam viec cho AI

- Dung tai lieu trong `docs/` lam context uu tien truoc khi doan theo ten file.
- Quy trinh mac dinh khi nhan task code: doc docs -> tim kiem -> hieu ngu canh -> chinh sua -> viet test neu can -> chay test -> cap nhat docs.
- Khi thay doi behavior, cap nhat it nhat mot tai lieu trong `docs/` neu no giup lan sau onboard nhanh hon.
- Khong dua gia dinh rang `examxy.API.csproj` la startup chinh. Host dang duoc dung la `examxy.Server.csproj`.
- Neu thay doi auth, exception mapping, middleware, hoac config runtime, note lai trong `features/` hoac `context/`.
- Sau khi fix mot bug khong tam thuong, uu tien ghi lai bai hoc vao `docs/lessons/`.

## Can can than

- Repo dang o giai doan xay nen, nen co the co file placeholder cu.
- Auth/Identity dang duoc day vao Infrastructure va Server, nhung migration chua duoc tao day du.
- Co frontend Vite va backend .NET song song, nen task full-stack thuong can doc ca `examxy.Server` va `examxy.client`.
