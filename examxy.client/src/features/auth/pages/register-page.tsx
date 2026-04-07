import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  AtSign,
  KeyRound,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage, getFieldErrors } from "@/lib/http/api-error";
import { useAuth } from "@/features/auth/auth-context";
import { AuthEdgeLayout } from "@/features/auth/components/auth-edge-layout";
import {
  hasFieldErrors,
  validateRegister,
} from "@/features/auth/lib/validation";
import type { RegisterRequest } from "@/types/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<RegisterRequest>({
    confirmPassword: "",
    email: "",
    password: "",
    userName: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterRequest, string>>
  >({});

  const [submissionError, setSubmissionError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof RegisterRequest>(
    field: K,
    value: RegisterRequest[K],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });

    setSubmissionError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors = validateRegister(formState);

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await register(formState);
      navigate("/account", { replace: true });
    } catch (error) {
      setSubmissionError(error);
      setFieldErrors(
        getFieldErrors(error) as Partial<Record<keyof RegisterRequest, string>>,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthEdgeLayout>
      <div className="flex flex-col gap-6">
        <header className="space-y-3 pb-2 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Đăng ký
          </p>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Tạo tài khoản mới
            </h1>
            <p className="text-xs sm:text-base leading-relaxed text-muted">
              Điền thông tin bên dưới để bắt đầu sử dụng nền tảng.
            </p>
          </div>
        </header>

        {submissionError ? (
          <Notice tone="error" title="Không thể tạo tài khoản">
            {getErrorMessage(submissionError)}
          </Notice>
        ) : null}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              autoComplete="username"
              error={fieldErrors.userName}
              label="Tên đăng nhập"
              leftIcon={<UserRound className="size-4" />}
              onChange={(event) => {
                updateField("userName", event.target.value);
              }}
              placeholder="Ví dụ: teacher.alex"
              value={formState.userName}
            />

            <TextField
              autoComplete="email"
              error={fieldErrors.email}
              label="Email"
              leftIcon={<AtSign className="size-4" />}
              onChange={(event) => {
                updateField("email", event.target.value);
              }}
              placeholder="you@example.com"
              type="email"
              value={formState.email}
            />

            <TextField
              autoComplete="new-password"
              error={fieldErrors.password}
              label="Mật khẩu"
              leftIcon={<KeyRound className="size-4" />}
              onChange={(event) => {
                updateField("password", event.target.value);
              }}
              placeholder="Chữ hoa, chữ thường, số, ký tự..."
              type="password"
              value={formState.password}
            />

            <TextField
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              label="Xác nhận mật khẩu"
              leftIcon={<KeyRound className="size-4" />}
              onChange={(event) => {
                updateField("confirmPassword", event.target.value);
              }}
              placeholder="Nhập lại mật khẩu"
              type="password"
              value={formState.confirmPassword}
            />
          </div>

          <Button 
            className="mt-4 rounded-2xl shadow-[0_22px_44px_-24px_rgba(42,94,204,0.75)]"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="size-4" />}
            size="lg"
            type="submit"
          >
            Tạo tài khoản
          </Button>
        </form>

        <div className="border-t border-line/80 pt-4 text-center lg:text-left">
          <p className="text-base leading-relaxed text-muted">
            Đã có tài khoản?{" "}
            <Link
              className="inline-flex items-center gap-2 font-semibold text-brand-strong transition hover:opacity-80"
              to="/login"
            >
              Đăng nhập ngay
              <ArrowRight className="size-4" />
            </Link>
          </p>
        </div>
      </div>
    </AuthEdgeLayout>
  );
}