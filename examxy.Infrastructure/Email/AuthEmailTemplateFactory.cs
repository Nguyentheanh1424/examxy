using examxy.Application.Abstractions.Email;
using System.Net;

namespace examxy.Infrastructure.Email
{
    internal static class AuthEmailTemplateFactory
    {
        public static EmailMessage CreateEmailConfirmationMessage(
            string to,
            string appName,
            string confirmationUrl)
        {
            return CreateMessage(
                to,
                $"{appName}: Confirm your email address",
                "Confirm your email address",
                "Finish setting up your account by confirming your email address.",
                "Confirm email",
                confirmationUrl,
                "If you did not create this account, you can safely ignore this email.");
        }

        public static EmailMessage CreatePasswordResetMessage(
            string to,
            string appName,
            string resetPasswordUrl)
        {
            return CreateMessage(
                to,
                $"{appName}: Reset your password",
                "Reset your password",
                "We received a request to reset your password. Use the button below to choose a new password.",
                "Reset password",
                resetPasswordUrl,
                "If you did not request a password reset, you can safely ignore this email.");
        }

        public static EmailMessage CreateStudentActivationInviteMessage(
            string to,
            string appName,
            string className,
            string resetPasswordUrl,
            string inviteCode,
            string joinUrl)
        {
            return CreateMessage(
                to,
                $"{appName}: Activate your student account",
                $"You were invited to join {className}",
                $"A teacher created your student account on {appName}. Choose your password first, then join the class with invite code {inviteCode}.",
                "Set your password",
                resetPasswordUrl,
                $"After setting your password, open {joinUrl} and enter invite code {inviteCode}.");
        }

        public static EmailMessage CreateStudentClassInviteMessage(
            string to,
            string appName,
            string className,
            string inviteCode,
            string joinUrl)
        {
            return CreateMessage(
                to,
                $"{appName}: Join {className}",
                $"You were invited to join {className}",
                $"Open the student dashboard and enter invite code {inviteCode} to join this class.",
                "Open student dashboard",
                joinUrl,
                $"If you already have an account, sign in with the invited email address before entering invite code {inviteCode}.");
        }

        private static EmailMessage CreateMessage(
            string to,
            string subject,
            string heading,
            string intro,
            string actionLabel,
            string actionUrl,
            string outro)
        {
            var encodedHeading = WebUtility.HtmlEncode(heading);
            var encodedIntro = WebUtility.HtmlEncode(intro);
            var encodedOutro = WebUtility.HtmlEncode(outro);
            var encodedActionLabel = WebUtility.HtmlEncode(actionLabel);
            var encodedActionUrl = WebUtility.HtmlEncode(actionUrl);

            var htmlBody =
                $"""
                 <div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6;">
                   <h2 style="margin-bottom: 12px;">{encodedHeading}</h2>
                   <p style="margin: 0 0 16px;">{encodedIntro}</p>
                   <p style="margin: 0 0 20px;">
                     <a href="{encodedActionUrl}" style="display: inline-block; padding: 12px 20px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">{encodedActionLabel}</a>
                   </p>
                   <p style="margin: 0 0 12px;">If the button does not work, copy and paste this link into your browser:</p>
                   <p style="margin: 0 0 16px; word-break: break-all;">
                     <a href="{encodedActionUrl}" style="color: #1d4ed8;">{encodedActionUrl}</a>
                   </p>
                   <p style="margin: 0; color: #6b7280; font-size: 14px;">{encodedOutro}</p>
                 </div>
                 """;

            var textBody =
                $"""
                 {heading}

                 {intro}

                 {actionLabel}: {actionUrl}

                 If the link does not open, copy and paste it into your browser.

                 {outro}
                 """;

            return new EmailMessage
            {
                To = to,
                Subject = subject,
                HtmlBody = htmlBody,
                TextBody = textBody
            };
        }
    }
}
