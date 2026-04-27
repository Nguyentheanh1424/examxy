using examxy.Application.Abstractions.Email;
using examxy.Domain.ClassContent;
using System.Net;

namespace examxy.Infrastructure.Email
{
    internal static class NotificationEmailTemplateFactory
    {
        public static EmailMessage CreateScheduleReminderMessage(
            string to,
            string appName,
            string scheduleTitle,
            ClassScheduleItemType scheduleType,
            int leadTimeHours,
            string scheduleUrl)
        {
            var targetLabel = scheduleType == ClassScheduleItemType.Assessment
                ? "assessment"
                : "deadline";
            var normalizedTitle = string.IsNullOrWhiteSpace(scheduleTitle)
                ? $"Upcoming class {targetLabel}"
                : scheduleTitle.Trim();

            return CreateMessage(
                to,
                $"{appName}: Upcoming {targetLabel} reminder",
                $"Upcoming {targetLabel}: {normalizedTitle}",
                $"A class {targetLabel} is scheduled in {leadTimeHours} hours.",
                "Open class schedule",
                scheduleUrl,
                "You are receiving this because you are an active student in this class.");
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
