import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, Mail, SendHorizonal } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import { AuthEdgeLayout } from "@/features/auth/components/auth-edge-layout";
import { authCopy } from "@/features/auth/lib/auth-copy";
import { forgotPasswordRequest } from "@/features/auth/lib/auth-api";
import {
  hasFieldErrors,
  validateForgotPassword,
} from "@/features/auth/lib/validation";
import type { ForgotPasswordRequest } from "@/types/auth";

export function ForgotPasswordPage() {
  const [formState, setFormState] = useState<ForgotPasswordRequest>({
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordRequest, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateForgotPassword(formState);

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPasswordRequest(formState);
      setSuccessMessage(authCopy.forgotPassword.successMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthEdgeLayout>
      <header className="flex flex-col gap-5 text-center lg:text-left pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
          Khôi phục mật khẩu
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Quên mật khẩu?
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn để bạn có thể đặt
            lại mật khẩu của mình.
          </p>
        </div>
      </header>

      {successMessage ? (
        <Notice tone="success" title="Kiểm tra email của bạn">
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
          {authCopy.forgotPassword.submitButton}
        </Button>
      </form>

      <div className="flex flex-col gap-5 border-t border-line/80 pt-4 text-center lg:text-left">
        <Link
          className="inline-flex items-center justify-center lg:justify-start gap-2 text-base font-semibold text-brand-strong transition hover:text-white"
          to="/login"
        >
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthEdgeLayout>
  );
}
