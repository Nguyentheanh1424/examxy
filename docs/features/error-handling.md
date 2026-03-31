# Error Handling

## Muc tieu

Backend can co mot contract loi thong nhat de controller, service, va client khong phai tu suy doan tung endpoint.

## Thanh phan chinh

- `examxy.Application/Exceptions`: `AppException` va cac class dan xuat
- `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`: map `IdentityError` sang `ConflictException` hoac `ValidationException`
- `examxy.Server/Filters/ValidateModelStateFilter.cs`: chuyen loi DTO/model binding thanh `ValidationException`
- `examxy.Server/Middleware/GlobalExceptionHandlingMiddleware.cs`: bat exception va serialize JSON response
- `examxy.Server/Contracts/ApiErrorResponse.cs`: contract loi chung cua API

## Exception hierarchy hien tai

- `ValidationException`: `400 Bad Request`
- `UnauthorizedException`: `401 Unauthorized`
- `ForbiddenException`: `403 Forbidden`
- `NotFoundException`: `404 Not Found`
- `ConflictException`: `409 Conflict`

Tat ca deu dan xuat tu `AppException` va mang theo `StatusCode` cung `ErrorCode`.

## Mapping hien tai

### Identity va business flow

- `DuplicateUserName`, `DuplicateEmail`, `DuplicateRoleName` -> `ConflictException`
- cac `IdentityError` con lai -> `ValidationException`
- invalid credentials -> `UnauthorizedException`
- access token hoac refresh token khong hop le -> `UnauthorizedException`
- account bi lockout -> `ForbiddenException`
- user khong ton tai -> `NotFoundException`

### Fallback mapping trong middleware

- `KeyNotFoundException` -> `NotFoundException`
- `UnauthorizedAccessException` -> `UnauthorizedException`
- `SecurityTokenException` -> `UnauthorizedException`
- `System.ComponentModel.DataAnnotations.ValidationException` -> `ValidationException`

## Response JSON

```json
{
  "statusCode": 401,
  "code": "unauthorized",
  "message": "Invalid credentials.",
  "traceId": "0HN...",
  "errors": null
}
```

`errors` chi duoc tra ve khi exception la `ValidationException`.

## Pipeline can nho

1. `ValidateModelStateFilter` chay sau model binding va throw `ValidationException` neu DTO invalid.
2. Controller goi abstraction/service.
3. Service uu tien throw `AppException` thay vi built-in exception.
4. `GlobalExceptionHandlingMiddleware` bat exception va doi sang `ApiErrorResponse`.
5. Unhandled exception tra `500 Internal Server Error`; message chi nen tin cay trong Development.

## Quy uoc khi them code moi

- Neu loi da co nghia nghiep vu ro rang, throw truc tiep mot `AppException`.
- Neu dang goi thu vien/framework tra ve built-in exception, map no vao `AppException` gan nhat o service hoac middleware.
- Neu doi response schema, cap nhat doc nay va bat ky feature doc nao bi anh huong.
- Khong de controller vua `return Unauthorized()/NotFound()` vua throw exception trong cung mot flow neu API dang dung shared error contract.

## Ngoai le hien tai

- Loi startup/config/seeding nhu thieu connection string, JWT secret, hoac seed role fail la loi cua host startup, khong phai request pipeline contract nay.
