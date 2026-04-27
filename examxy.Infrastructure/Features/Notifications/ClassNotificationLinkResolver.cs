using examxy.Application.Features.Notifications.DTOs;
using examxy.Domain.Notifications;
using examxy.Domain.Notifications.Enums;
using System.Text.Json;

namespace examxy.Infrastructure.Features.Notifications
{
    internal static class NotificationLinkResolver
    {
        public const string FeedFeatureArea = "feed";
        public const string AssessmentsFeatureArea = "assessments";
        public const string ScheduleFeatureArea = "schedule";

        public static NotificationRoute ForPost(Guid classId, Guid postId)
        {
            return new NotificationRoute(
                $"/classes/{classId}",
                JsonSerializer.Serialize(new
                {
                    featureArea = FeedFeatureArea,
                    classId,
                    postId
                }));
        }

        public static NotificationRoute ForComment(Guid classId, Guid postId, Guid commentId)
        {
            return new NotificationRoute(
                $"/classes/{classId}",
                JsonSerializer.Serialize(new
                {
                    featureArea = FeedFeatureArea,
                    classId,
                    postId,
                    commentId
                }));
        }

        public static NotificationRoute ForAssessment(Guid classId, Guid assessmentId)
        {
            return new NotificationRoute(
                $"/classes/{classId}",
                JsonSerializer.Serialize(new
                {
                    featureArea = AssessmentsFeatureArea,
                    classId,
                    assessmentId
                }));
        }

        public static NotificationRoute ForScheduleItem(
            Guid classId,
            Guid scheduleItemId,
            Guid? assessmentId)
        {
            return new NotificationRoute(
                $"/classes/{classId}",
                JsonSerializer.Serialize(new
                {
                    featureArea = ScheduleFeatureArea,
                    classId,
                    scheduleItemId,
                    assessmentId
                }));
        }

        public static NotificationInboxItemDto Map(UserNotification notification)
        {
            var target = ResolveTarget(notification);

            return new NotificationInboxItemDto
            {
                Id = notification.Id,
                ClassId = notification.ClassId,
                RecipientUserId = notification.RecipientUserId,
                ActorUserId = notification.ActorUserId,
                NotificationType = notification.NotificationType.ToString(),
                SourceType = notification.SourceType.ToString(),
                SourceId = notification.SourceId,
                Title = notification.Title,
                Message = notification.Message,
                LinkPath = notification.LinkPath,
                FeatureArea = target.FeatureArea,
                PostId = target.PostId,
                CommentId = target.CommentId,
                AssessmentId = target.AssessmentId,
                ScheduleItemId = target.ScheduleItemId,
                IsRead = notification.IsRead,
                ReadAtUtc = notification.ReadAtUtc,
                CreatedAtUtc = notification.CreatedAtUtc
            };
        }

        private static NotificationTarget ResolveTarget(UserNotification notification)
        {
            if (!string.IsNullOrWhiteSpace(notification.PayloadJson))
            {
                try
                {
                    using var document = JsonDocument.Parse(notification.PayloadJson);
                    var root = document.RootElement;

                    var featureArea = root.TryGetProperty("featureArea", out var featureAreaElement)
                        ? featureAreaElement.GetString() ?? string.Empty
                        : GetDefaultFeatureArea(notification.SourceType);

                    return new NotificationTarget(
                        featureArea,
                        TryReadGuid(root, "postId"),
                        TryReadGuid(root, "commentId"),
                        TryReadGuid(root, "assessmentId"),
                        TryReadGuid(root, "scheduleItemId"));
                }
                catch (JsonException)
                {
                }
            }

            return notification.SourceType switch
            {
                NotificationSourceType.Post => new NotificationTarget(FeedFeatureArea, notification.SourceId, null, null, null),
                NotificationSourceType.Comment => new NotificationTarget(FeedFeatureArea, null, notification.SourceId, null, null),
                NotificationSourceType.Assessment => new NotificationTarget(AssessmentsFeatureArea, null, null, notification.SourceId, null),
                NotificationSourceType.ScheduleItem => new NotificationTarget(ScheduleFeatureArea, null, null, null, notification.SourceId),
                _ => new NotificationTarget(string.Empty, null, null, null, null)
            };
        }

        private static string GetDefaultFeatureArea(NotificationSourceType sourceType)
        {
            return sourceType switch
            {
                NotificationSourceType.Assessment => AssessmentsFeatureArea,
                NotificationSourceType.ScheduleItem => ScheduleFeatureArea,
                _ => FeedFeatureArea
            };
        }

        private static Guid? TryReadGuid(JsonElement root, string propertyName)
        {
            if (!root.TryGetProperty(propertyName, out var property))
            {
                return null;
            }

            return property.ValueKind switch
            {
                JsonValueKind.String when Guid.TryParse(property.GetString(), out var parsed) => parsed,
                JsonValueKind.Null => null,
                _ when property.TryGetGuid(out var value) => value,
                _ => null
            };
        }

        internal sealed record NotificationRoute(string LinkPath, string PayloadJson);

        private sealed record NotificationTarget(
            string FeatureArea,
            Guid? PostId,
            Guid? CommentId,
            Guid? AssessmentId,
            Guid? ScheduleItemId);
    }
}
