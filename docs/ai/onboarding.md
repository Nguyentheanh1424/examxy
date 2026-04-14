# AI Onboarding

Tai lieu nay giup AI vao repo nhanh va giam thoi gian doan context.

## Bat dau tu dau

1. Doc [docs/README.md](../README.md)
2. Doc [docs/architecture/solution-map.md](../architecture/solution-map.md)
3. Doc [docs/context/current-state.md](../context/current-state.md)
4. Doc [docs/features/README.md](../features/README.md)
5. Neu task lien quan auth, doc [docs/features/authentication.md](../features/authentication.md)
6. Neu task lien quan frontend auth/client routes, doc [docs/features/client-authentication.md](../features/client-authentication.md)
7. Neu task lien quan API status, exception, middleware, hoac validation, doc [docs/features/error-handling.md](../features/error-handling.md)
8. Neu task lien quan setup local hoac migrate, doc [docs/runbooks/local-development.md](../runbooks/local-development.md)
9. Neu task la fix bug hoac blocker, doc [docs/lessons/README.md](../lessons/README.md)

## Nhan dien nhanh repo

- Backend host hien tai: `examxy.Server`
- Application contracts va shared exceptions: `examxy.Application`
- Domain core: `examxy.Domain`
- Infrastructure va Identity: `examxy.Infrastructure`
- Frontend React/Vite: `examxy.client`
- Test projects: `test.Application`, `test.Domain`, `test.Integration`
- Script migrate: `scripts/`

### Nhan dien nhanh backend classroom

- Contracts: `examxy.Application/Features/Classrooms`
- Domain model: `examxy.Domain/Classrooms`
- Infrastructure services: `examxy.Infrastructure/Features/Classrooms`
- EF mappings: `examxy.Infrastructure/Features/Classrooms/Configurations`

## Quy tac lam viec cho AI

- Dung tai lieu trong `docs/` lam context uu tien truoc khi doan theo ten file.
- Quy trinh mac dinh khi nhan task code: doc docs -> tim kiem -> hieu ngu canh -> chinh sua -> viet test neu can -> chay test -> cap nhat docs.
- Truoc khi lam task, AI phai boc tach thanh cac buoc nho, lap plan ro rang (muc tieu, pham vi, thu tu xu ly, cach verify).
- Moi quyet dinh (ky thuat, pham vi, trade-off, uu tien) deu phai dua ra de xuat va cho y kien phe duyet cua nguoi giao task truoc khi chot huong trien khai.
- Neu chua duoc phe duyet, AI chi duoc dung o muc phan tich, khong tu y chot giai phap co anh huong hanh vi he thong.
- Khi thay doi behavior, cap nhat it nhat mot tai lieu trong `docs/` neu no giup lan sau onboard nhanh hon.
- Khong dua gia dinh rang `examxy.API.csproj` la startup chinh. Host dang duoc dung la `examxy.Server.csproj`.
- Neu thay doi auth, exception mapping, middleware, hoac config runtime, note lai trong `features/` hoac `context/`.
- Sau khi fix mot bug khong tam thuong, uu tien ghi lai bai hoc vao `docs/lessons/`.

## Can can than

- Auth/Identity dang duoc day vao Infrastructure va Server, nhung migration chua duoc tao day du.
- Co frontend Vite va backend .NET song song, nen task full-stack thuong can doc ca `examxy.Server` va `examxy.client`.
- Classrooms da duoc tach theo module architecture; tranh dua lai code classroom vao `Identity/Services`.
