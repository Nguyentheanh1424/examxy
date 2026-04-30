import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import {
  getFieldErrors,
  isApiError,
  isEmailConfirmationRequiredError,
} from "@/lib/http/api-error";
import { consumeFlashNotice } from "@/lib/utils/flash-notice";
import { useAuth } from "@/features/auth/auth-context";
import { authCopy } from "@/features/auth/lib/auth-copy";
import { getDefaultRouteForRole } from "@/features/auth/lib/auth-role-routing";

import { hasFieldErrors, validateLogin } from "@/features/auth/lib/validation";
import type { LoginRequest } from "@/types/auth";
import { AuthEdgeLayout } from "@/features/auth/components/auth-edge-layout";

type SocialProvider = "facebook" | "google";

const socialCopy: Record<
  SocialProvider,
  {
    description: string;
    helper: string;
    title: string;
  }
> = {
  facebook: {
    description:
      "Đăng nhập với Facebook sẽ sớm có mặt. Bạn vẫn có thể vào ngay bằng email hoặc tên đăng nhập để tiếp tục học tập trên Examxy.",
    helper:
      "Khi tính năng sẵn sàng, bạn sẽ có thêm một cách đăng nhập nhanh mà không cần thay đổi tài khoản hiện tại.",
    title: authCopy.login.socialPopupTitle,
  },
  google: {
    description:
      "Đăng nhập với Google sẽ sớm có mặt. Bạn vẫn có thể vào ngay bằng email hoặc tên đăng nhập để tiếp tục học tập trên Examxy.",
    helper:
      "Khi tính năng sẵn sàng, bạn sẽ có thêm một cách đăng nhập nhanh mà không cần thay đổi tài khoản hiện tại.",
    title: authCopy.login.socialPopupTitle,
  },
};

function getLoginSubmissionMessage(error: unknown) {
  if (isEmailConfirmationRequiredError(error)) {
    return "Tài khoản của bạn chưa hoàn tất bước xác nhận email. Hãy kiểm tra hộp thư hoặc yêu cầu gửi lại email xác nhận.";
  }

  if (isApiError(error)) {
    if (error.statusCode === 401) {
      return "Email, tên đăng nhập hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.";
    }

    if (error.statusCode >= 500) {
      return "Hệ thống đang bận. Vui lòng thử lại sau ít phút.";
    }

    return error.message;
  }

  return "Đăng nhập chưa thành công. Vui lòng thử lại.";
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

function SocialProviderIcon({ provider }: { provider: SocialProvider }) {
  const isGoogle = provider === "google";
  const fallbackClassName = isGoogle
    ? "bg-white text-[#1f2937] ring-1 ring-black/8"
    : "bg-[#1877f2] text-white";

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${fallbackClassName}`}
    >
      {isGoogle ? (
        <GoogleIcon className="size-[0.8rem]" />
      ) : (
        <FacebookIcon className="size-[0.8rem]" />
      )}
    </span>
  );
}

function SocialPopup({
  onClose,
  provider,
}: {
  onClose: () => void;
  provider: SocialProvider | null;
}) {
  useEffect(() => {
    if (!provider) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, provider]);

  if (!provider) {
    return null;
  }

  const config = socialCopy[provider];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <CardShell
        aria-modal="true"
        className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_40px_90px_-46px_rgba(17,24,39,0.5)] sm:p-7"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-brand/12 bg-brand-soft/65">
              <SocialProviderIcon provider={provider} />
            </span>

            <div>
              <p className="text-xs sm:text-base font-semibold uppercase tracking-[0.2em] text-brand-strong">
                Đăng nhập nhanh
              </p>
              <h2 className="mt-1 text-lg sm:text-2xl font-semibold tracking-[-0.03em] text-ink">
                {config.title}
              </h2>
            </div>
          </div>

          <button
            aria-label="Đóng thông báo"
            className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-6 text-base leading-7 text-muted">
          {config.description}
        </p>

        <div className="mt-5 rounded-[1.5rem] border border-brand/12 bg-brand-soft/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-[0.125rem] size-5 shrink-0 text-brand-strong" />
            <p className="text-base leading-relaxed text-muted">
              {config.helper}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button 
            className="min-w-[8rem] sm:min-w-[8rem] md:min-w-[10rem] lg:min-w-[12rem]"
            size="lg" 
            type="button" 
            onClick={onClose}
          >
            Đã hiểu
          </Button>
        </div>
      </CardShell>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [flashNotice] = useState(() => consumeFlashNotice());
  const [formState, setFormState] = useState<LoginRequest>({
    password: "",
    userNameOrEmail: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginRequest, string>>
  >({});
  const [submissionError, setSubmissionError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [socialPopup, setSocialPopup] = useState<SocialProvider | null>(null);

  const fromLocation =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : null;

  const resendConfirmationHref = formState.userNameOrEmail.includes("@")
    ? `/resend-email-confirmation?email=${encodeURIComponent(formState.userNameOrEmail)}`
    : "/resend-email-confirmation";

  function updateField<K extends keyof LoginRequest>(
    field: K,
    value: LoginRequest[K],
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
    const nextFieldErrors = validateLogin(formState);

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const nextSession = await login(formState, { rememberMe });
      navigate(
        fromLocation ?? getDefaultRouteForRole(nextSession.primaryRole),
        { replace: true },
      );
    } catch (error) {
      setSubmissionError(error);
      setFieldErrors(
        getFieldErrors(error) as Partial<Record<keyof LoginRequest, string>>,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuthEdgeLayout>
        <header className="flex flex-col gap-5 text-center lg:text-left pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Chào mừng trở lại
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Đăng nhập
            </h1>
          </div>
        </header>

        {flashNotice ? (
          <Notice tone={flashNotice.tone} title={flashNotice.title}>
            {flashNotice.message}
          </Notice>
        ) : null}

        {submissionError ? (
          <Notice
            actions={
              isEmailConfirmationRequiredError(submissionError) ? (
                <Link
                  className="font-semibold text-brand-strong transition hover:text-brand"
                  to={resendConfirmationHref}
                >
                  Gửi lại email xác nhận
                </Link>
              ) : null
            }
            tone={
              isEmailConfirmationRequiredError(submissionError)
                ? "warning"
                : "error"
            }
            title={
              isEmailConfirmationRequiredError(submissionError)
                ? "Vui lòng xác nhận email"
                : "Chưa thể đăng nhập"
            }
          >
            {getLoginSubmissionMessage(submissionError)}
          </Notice>
        ) : null}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <TextField
            autoComplete="username"
            error={fieldErrors.userNameOrEmail}
            label="Email hoặc tên đăng nhập"
            leftIcon={<Mail className="size-4" />}
            onChange={(event) => {
              updateField("userNameOrEmail", event.target.value);
            }}
            placeholder="tenban@example.com"
            value={formState.userNameOrEmail}
          />

          <TextField
            autoComplete="current-password"
            error={fieldErrors.password}
            label="Mật khẩu"
            labelAction={
              <Link
                className="text-sm font-semibold text-brand-strong transition hover:text-brand"
                to="/forgot-password"
              >
                Quên mật khẩu?
              </Link>
            }
            leftIcon={<KeyRound className="size-4" />}
            onChange={(event) => {
              updateField("password", event.target.value);
            }}
            onRightIconClick={() => {
              setIsPasswordVisible((currentState) => !currentState);
            }}
            placeholder="Nhập mật khẩu"
            rightIcon={
              isPasswordVisible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )
            }
            rightIconLabel={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            type={isPasswordVisible ? "text" : "password"}
            value={formState.password}
          />

          <CheckboxField
            checked={rememberMe}
            label="Ghi nhớ đăng nhập"
            onChange={(event) => {
              setRememberMe(event.target.checked);
            }}
          />

          <Button
            className="mt-4 rounded-2xl shadow-[0_22px_44px_-24px_rgba(42,94,204,0.75)]"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<LogIn className="size-4" />}
            size="lg"
            type="submit"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-muted">
              {authCopy.login.socialDivider}
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="flex flex-col gap-3 flex-row">
            <Button
              className="w-full justify-center rounded-2xl border border-line bg-surface text-ink hover:border-brand/25 hover:bg-brand-soft/40 md:flex-1"
              leftIcon={<SocialProviderIcon provider="google" />}
              onClick={() => setSocialPopup("google")}
              size="lg"
              type="button"
              variant="secondary"
            >
              {authCopy.login.socialProviderLabel}
            </Button>

            <Button
              className="w-full justify-center rounded-2xl border border-line bg-surface text-ink hover:border-brand/25 hover:bg-brand-soft/40 md:flex-1"
              leftIcon={<SocialProviderIcon provider="facebook" />}
              onClick={() => setSocialPopup("facebook")}
              size="lg"
              type="button"
              variant="secondary"
            >
              Facebook
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line/80 pt-4 text-center lg:text-left">
          <p className="text-base leading-relaxed text-muted">
            Chưa có tài khoản?{" "}
            <Link
              className="inline-flex items-center gap-2 font-semibold text-brand-strong transition hover:text-brand"
              to="/register"
            >
              Đăng ký ngay
              <ArrowRight className="size-4" />
            </Link>
          </p>
        </div>
      </AuthEdgeLayout>

      <SocialPopup
        onClose={() => {
          setSocialPopup(null);
        }}
        provider={socialPopup}
      />
    </>
  );
}
