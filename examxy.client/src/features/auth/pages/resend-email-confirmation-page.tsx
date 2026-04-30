import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, Mail, SendHorizonal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import { AuthEdgeLayout } from "@/features/auth/components/auth-edge-layout";
import { resendEmailConfirmationRequest } from "@/features/auth/lib/auth-api";
import {
  hasFieldErrors,
  validateResendEmailConfirmation,
} from "@/features/auth/lib/validation";
import type { ResendEmailConfirmationRequest } from "@/types/auth";

const privacySafeMessage =
  "Nếu địa chỉ này thuộc về một tài khoản chưa xác nhận, Examxy sẽ gửi một email xác thực khác. Vui lòng kiểm tra hộp thư đến và cả hòm thư rác.";

export function ResendEmailConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState<ResendEmailConfirmationRequest>({
    email: searchParams.get("email") ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ResendEmailConfirmationRequest, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateResendEmailConfirmation(formState);

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await resendEmailConfirmationRequest(formState);
      setSuccessMessage(privacySafeMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthEdgeLayout>
      <header className="flex flex-col gap-5 text-center lg:text-left pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
          Xác nhận Email
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Gửi lại email xác nhận
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Sử dụng cùng địa chỉ email mà bạn đã đăng ký. Chỉ những tài khoản
            chưa xác thực mới nhận được tin nhắn mới.
          </p>
        </div>
      </header>

      {successMessage ? (
        <Notice tone="success" title="Hãy kiểm tra hộp thư">
          {successMessage}
        </Notice>
      ) : null}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          autoComplete="email"
          error={fieldErrors.email}
          label="Email"
          leftIcon={<Mail className="size-4" />}
          onChange={(event) => {
            setFormState({ email: event.target.value });
            setFieldErrors({});
          }}
          placeholder="you@example.com"
          type="email"
          value={formState.email}
        />

        <Button
          className="mt-4 rounded-2xl shadow-[0_22px_44px_-24px_rgba(42,94,204,0.75)]"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<SendHorizonal className="size-4" />}
          size="lg"
          type="submit"
        >
          Gửi lại email xác nhận
        </Button>
      </form>

      <div className="flex flex-col gap-5 border-t border-line/80 pt-4 text-center lg:text-left">
        <Link
          className="inline-flex items-center justify-center lg:justify-start gap-2 text-base font-semibold text-brand-strong transition hover:text-brand"
          to="/login"
        >
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthEdgeLayout>
  );
}
