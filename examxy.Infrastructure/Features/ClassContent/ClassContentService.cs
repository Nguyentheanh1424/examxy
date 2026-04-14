using examxy.Application.Features.ClassContent;
using examxy.Application.Features.ClassContent.DTOs;
using examxy.Application.Exceptions;
using examxy.Domain.ClassContent;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace examxy.Infrastructure.Features.ClassContent
{
    public sealed class ClassContentService : IClassContentService
    {
        private readonly AppDbContext _dbContext;

        public ClassContentService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ClassDashboardDto> GetClassDashboardAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);
            var now = DateTime.UtcNow;

            var activeStudentCount = await _dbContext.ClassMemberships.CountAsync(
                membership => membership.ClassId == classId && membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            var feedQuery = _dbContext.ClassPosts
                .Where(post => post.ClassId == classId && post.DeletedAtUtc == null);

            if (!access.IsTeacherOwner)
            {
                feedQuery = feedQuery.Where(post =>
                    post.Status == ClassPostStatus.Published &&
                    (!post.PublishAtUtc.HasValue || post.PublishAtUtc <= now) &&
                    (!post.CloseAtUtc.HasValue || post.CloseAtUtc > now));
            }

            var feedItemCount = await feedQuery.CountAsync(cancellationToken);

            var upcomingScheduleCount = await _dbContext.ClassScheduleItems.CountAsync(
                item =>
                    item.ClassId == classId &&
                    item.DeletedAtUtc == null &&
                    item.StartAtUtc >= now,
                cancellationToken);

            var unreadNotificationCount = await _dbContext.ClassNotifications.CountAsync(
                notification =>
                    notification.ClassId == classId &&
                    notification.RecipientUserId == userId &&
                    !notification.IsRead,
                cancellationToken);

            return new ClassDashboardDto
            {
                ClassId = access.Classroom.Id,
                ClassName = access.Classroom.Name,
                ClassCode = access.Classroom.Code,
                ClassStatus = access.Classroom.Status.ToString(),
                TimezoneId = access.Classroom.TimezoneId,
                IsTeacherOwner = access.IsTeacherOwner,
                ActiveStudentCount = activeStudentCount,
                FeedItemCount = feedItemCount,
                UpcomingScheduleCount = upcomingScheduleCount,
                UnreadNotificationCount = unreadNotificationCount
            };
        }

        public async Task<IReadOnlyCollection<ClassFeedItemDto>> GetFeedAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);
            var now = DateTime.UtcNow;

            var postsQuery = _dbContext.ClassPosts
                .Include(post => post.Attachments)
                .Include(post => post.Comments)
                    .ThenInclude(comment => comment.Reactions)
                .Include(post => post.Comments)
                    .ThenInclude(comment => comment.MentionedUsers)
                .Include(post => post.Comments)
                    .ThenInclude(comment => comment.MentionAll)
                .Include(post => post.Reactions)
                .Include(post => post.MentionedUsers)
                .Include(post => post.MentionAll)
                .Where(post => post.ClassId == classId && post.DeletedAtUtc == null);

            if (!access.IsTeacherOwner)
            {
                postsQuery = postsQuery.Where(post =>
                    post.Status == ClassPostStatus.Published &&
                    (!post.PublishAtUtc.HasValue || post.PublishAtUtc <= now) &&
                    (!post.CloseAtUtc.HasValue || post.CloseAtUtc > now));
            }

            var posts = await postsQuery
                .OrderByDescending(post => post.IsPinned)
                .ThenByDescending(post => post.PublishAtUtc ?? post.CreatedAtUtc)
                .ThenByDescending(post => post.CreatedAtUtc)
                .ToArrayAsync(cancellationToken);

            var userIds = posts
                .Select(post => post.AuthorUserId)
                .Concat(posts.SelectMany(post => post.Comments.Select(comment => comment.AuthorUserId)))
                .Distinct()
                .ToArray();

            var names = await LoadUserNamesAsync(userIds, cancellationToken);

            return posts.Select(post => MapFeedItem(
                post,
                names,
                userId,
                access.IsTeacherOwner)).ToArray();
        }

        public async Task<IReadOnlyCollection<ClassMentionCandidateDto>> GetMentionCandidatesAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var participantIds = await GetClassParticipantUserIdsAsync(classId, cancellationToken);
            participantIds.Remove(userId);

            if (participantIds.Count == 0)
            {
                return Array.Empty<ClassMentionCandidateDto>();
            }

            var participantIdArray = participantIds.ToArray();

            var users = await _dbContext.Users
                .Where(user => participantIdArray.Contains(user.Id))
                .Select(user => new
                {
                    user.Id,
                    user.FullName,
                    user.UserName,
                    user.Email
                })
                .ToArrayAsync(cancellationToken);

            return users
                .Select(user =>
                {
                    var displayName = !string.IsNullOrWhiteSpace(user.FullName)
                        ? user.FullName!
                        : !string.IsNullOrWhiteSpace(user.UserName)
                            ? user.UserName!
                            : user.Id;

                    return new ClassMentionCandidateDto
                    {
                        UserId = user.Id,
                        DisplayName = displayName,
                        Email = user.Email ?? string.Empty
                    };
                })
                .OrderBy(candidate => candidate.DisplayName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(candidate => candidate.Email, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        public async Task<ClassPostDto> CreatePostAsync(
            string userId,
            Guid classId,
            CreateClassPostRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var classroom = await EnsureTeacherOwnerAsync(userId, classId, cancellationToken);
            var postType = ParsePostType(request.Type);
            var now = DateTime.UtcNow;
            var status = request.PublishAtUtc.HasValue && request.PublishAtUtc.Value > now
                ? ClassPostStatus.Draft
                : ClassPostStatus.Published;

            var post = new ClassPost
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                AuthorUserId = userId,
                Type = postType,
                Title = request.Title.Trim(),
                ContentRichText = request.ContentRichText ?? string.Empty,
                ContentPlainText = request.ContentPlainText ?? string.Empty,
                AllowComments = postType == ClassPostType.Post && request.AllowComments,
                IsPinned = request.IsPinned,
                NotifyAll = request.NotifyAll,
                PublishAtUtc = request.PublishAtUtc,
                CloseAtUtc = request.CloseAtUtc,
                Status = status,
                PublishedAtUtc = status == ClassPostStatus.Published ? now : null,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            foreach (var attachment in request.Attachments)
            {
                post.Attachments.Add(new ClassPostAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = attachment.FileName.Trim(),
                    ContentType = attachment.ContentType.Trim(),
                    FileSizeBytes = attachment.FileSizeBytes,
                    ExternalUrl = attachment.ExternalUrl.Trim(),
                    CreatedAtUtc = now
                });
            }

            _dbContext.ClassPosts.Add(post);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var recipients = await UpsertPostMentionsAsync(
                post,
                userId,
                request.NotifyAll,
                request.TaggedUserIds,
                cancellationToken);

            await CreateMentionNotificationsAsync(
                classId,
                userId,
                ClassNotificationSourceType.Post,
                post.Id,
                post.Title,
                recipients.TaggedRecipients,
                recipients.NotifyAllRecipients,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            var names = await LoadUserNamesAsync(new[] { userId }, cancellationToken);
            return MapPost(post, names, userId, includeHiddenComments: true);
        }

        public async Task<ClassPostDto> UpdatePostAsync(
            string userId,
            Guid classId,
            Guid postId,
            UpdateClassPostRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAsync(userId, classId, cancellationToken);

            var post = await _dbContext.ClassPosts
                .Include(candidate => candidate.Attachments)
                .Include(candidate => candidate.Comments)
                    .ThenInclude(comment => comment.Reactions)
                .Include(candidate => candidate.Comments)
                    .ThenInclude(comment => comment.MentionedUsers)
                .Include(candidate => candidate.Comments)
                    .ThenInclude(comment => comment.MentionAll)
                .Include(candidate => candidate.Reactions)
                .Include(candidate => candidate.MentionedUsers)
                .Include(candidate => candidate.MentionAll)
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == postId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (post is null)
            {
                throw new NotFoundException("Post not found.");
            }

            var status = ParsePostStatus(request.Status);
            var now = DateTime.UtcNow;
            var wasPublished = post.Status == ClassPostStatus.Published;

            post.Title = request.Title.Trim();
            post.ContentRichText = request.ContentRichText ?? string.Empty;
            post.ContentPlainText = request.ContentPlainText ?? string.Empty;
            post.AllowComments = post.Type == ClassPostType.Post && request.AllowComments;
            post.IsPinned = request.IsPinned;
            post.NotifyAll = request.NotifyAll;
            post.PublishAtUtc = request.PublishAtUtc;
            post.CloseAtUtc = request.CloseAtUtc;
            post.Status = status;
            post.UpdatedAtUtc = now;

            if (!wasPublished && status == ClassPostStatus.Published)
            {
                post.PublishedAtUtc = now;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            var recipients = await UpsertPostMentionsAsync(
                post,
                userId,
                request.NotifyAll,
                request.TaggedUserIds,
                cancellationToken);

            await CreateMentionNotificationsAsync(
                classId,
                userId,
                ClassNotificationSourceType.Post,
                post.Id,
                post.Title,
                recipients.TaggedRecipients,
                recipients.NotifyAllRecipients,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            var names = await LoadUserNamesAsync(new[] { post.AuthorUserId }, cancellationToken);
            return MapPost(post, names, userId, includeHiddenComments: true);
        }

        public async Task<ClassCommentDto> CreateCommentAsync(
            string userId,
            Guid classId,
            Guid postId,
            CreateClassCommentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var post = await _dbContext.ClassPosts
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == postId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (post is null)
            {
                throw new NotFoundException("Post not found.");
            }

            if (!access.IsTeacherOwner && !IsPostVisibleToMember(post, DateTime.UtcNow))
            {
                throw new NotFoundException("Post not found.");
            }

            if (post.Type != ClassPostType.Post || !post.AllowComments)
            {
                throw new ConflictException("Comments are disabled for this post.");
            }

            var now = DateTime.UtcNow;
            var comment = new ClassComment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                ClassId = classId,
                AuthorUserId = userId,
                ContentRichText = request.ContentRichText ?? string.Empty,
                ContentPlainText = request.ContentPlainText ?? string.Empty,
                NotifyAll = request.NotifyAll,
                IsHidden = false,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            _dbContext.ClassComments.Add(comment);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var recipients = await UpsertCommentMentionsAsync(
                comment,
                userId,
                request.NotifyAll,
                request.TaggedUserIds,
                cancellationToken);

            await CreateMentionNotificationsAsync(
                classId,
                userId,
                ClassNotificationSourceType.Comment,
                comment.Id,
                "Comment mention",
                recipients.TaggedRecipients,
                recipients.NotifyAllRecipients,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            var names = await LoadUserNamesAsync(new[] { userId }, cancellationToken);
            return MapComment(comment, names, userId);
        }

        public async Task<ClassCommentDto> UpdateCommentAsync(
            string userId,
            Guid classId,
            Guid commentId,
            UpdateClassCommentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var comment = await _dbContext.ClassComments
                .Include(candidate => candidate.Reactions)
                .Include(candidate => candidate.MentionedUsers)
                .Include(candidate => candidate.MentionAll)
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == commentId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (comment is null)
            {
                throw new NotFoundException("Comment not found.");
            }

            if (!string.Equals(comment.AuthorUserId, userId, StringComparison.Ordinal))
            {
                throw new ForbiddenException("Only the comment owner can edit this comment.");
            }

            var now = DateTime.UtcNow;
            comment.ContentRichText = request.ContentRichText ?? string.Empty;
            comment.ContentPlainText = request.ContentPlainText ?? string.Empty;
            comment.NotifyAll = request.NotifyAll;
            comment.UpdatedAtUtc = now;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var recipients = await UpsertCommentMentionsAsync(
                comment,
                userId,
                request.NotifyAll,
                request.TaggedUserIds,
                cancellationToken);

            await CreateMentionNotificationsAsync(
                classId,
                userId,
                ClassNotificationSourceType.Comment,
                comment.Id,
                "Comment mention",
                recipients.TaggedRecipients,
                recipients.NotifyAllRecipients,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);

            var names = await LoadUserNamesAsync(new[] { userId }, cancellationToken);
            return MapComment(comment, names, userId);
        }

        public async Task HideCommentAsync(
            string userId,
            Guid classId,
            Guid commentId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAsync(userId, classId, cancellationToken);

            var comment = await _dbContext.ClassComments
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == commentId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (comment is null)
            {
                throw new NotFoundException("Comment not found.");
            }

            comment.IsHidden = true;
            comment.HiddenByTeacherUserId = userId;
            comment.HiddenAtUtc = DateTime.UtcNow;
            comment.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task<ClassReactionSummaryDto> SetPostReactionAsync(
            string userId,
            Guid classId,
            Guid postId,
            SetReactionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var post = await _dbContext.ClassPosts
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == postId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (post is null)
            {
                throw new NotFoundException("Post not found.");
            }

            if (!access.IsTeacherOwner && !IsPostVisibleToMember(post, DateTime.UtcNow))
            {
                throw new NotFoundException("Post not found.");
            }

            var reaction = await _dbContext.ClassPostReactions
                .FirstOrDefaultAsync(
                    candidate => candidate.PostId == postId && candidate.UserId == userId,
                    cancellationToken);

            if (string.IsNullOrWhiteSpace(request.ReactionType))
            {
                if (reaction is not null)
                {
                    _dbContext.ClassPostReactions.Remove(reaction);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
            else
            {
                var parsedType = ParseReactionType(request.ReactionType);
                if (reaction is null)
                {
                    _dbContext.ClassPostReactions.Add(new ClassPostReaction
                    {
                        Id = Guid.NewGuid(),
                        PostId = postId,
                        ClassId = classId,
                        UserId = userId,
                        ReactionType = parsedType,
                        CreatedAtUtc = DateTime.UtcNow,
                        UpdatedAtUtc = DateTime.UtcNow
                    });
                }
                else
                {
                    reaction.ReactionType = parsedType;
                    reaction.UpdatedAtUtc = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return await BuildPostReactionSummaryAsync(postId, userId, cancellationToken);
        }

        public async Task<ClassReactionSummaryDto> SetCommentReactionAsync(
            string userId,
            Guid classId,
            Guid commentId,
            SetReactionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var comment = await _dbContext.ClassComments
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == commentId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (comment is null)
            {
                throw new NotFoundException("Comment not found.");
            }

            if (!access.IsTeacherOwner && comment.IsHidden)
            {
                throw new NotFoundException("Comment not found.");
            }

            var reaction = await _dbContext.ClassCommentReactions
                .FirstOrDefaultAsync(
                    candidate => candidate.CommentId == commentId && candidate.UserId == userId,
                    cancellationToken);

            if (string.IsNullOrWhiteSpace(request.ReactionType))
            {
                if (reaction is not null)
                {
                    _dbContext.ClassCommentReactions.Remove(reaction);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
            else
            {
                var parsedType = ParseReactionType(request.ReactionType);
                if (reaction is null)
                {
                    _dbContext.ClassCommentReactions.Add(new ClassCommentReaction
                    {
                        Id = Guid.NewGuid(),
                        CommentId = commentId,
                        ClassId = classId,
                        UserId = userId,
                        ReactionType = parsedType,
                        CreatedAtUtc = DateTime.UtcNow,
                        UpdatedAtUtc = DateTime.UtcNow
                    });
                }
                else
                {
                    reaction.ReactionType = parsedType;
                    reaction.UpdatedAtUtc = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return await BuildCommentReactionSummaryAsync(commentId, userId, cancellationToken);
        }

        public async Task<IReadOnlyCollection<ClassScheduleItemDto>> GetScheduleItemsAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            await EnsureClassAccessAsync(userId, classId, cancellationToken);

            var items = await _dbContext.ClassScheduleItems
                .Where(item => item.ClassId == classId && item.DeletedAtUtc == null)
                .OrderBy(item => item.StartAtUtc)
                .ThenBy(item => item.CreatedAtUtc)
                .ToArrayAsync(cancellationToken);

            return items.Select(MapScheduleItem).ToArray();
        }

        public async Task<ClassScheduleItemDto> CreateScheduleItemAsync(
            string userId,
            Guid classId,
            CreateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var classroom = await EnsureTeacherOwnerAsync(userId, classId, cancellationToken);
            ValidateScheduleRequest(request.Title, request.StartAtUtc, request.EndAtUtc);

            var now = DateTime.UtcNow;
            var item = new ClassScheduleItem
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                CreatorUserId = userId,
                Type = ParseScheduleItemType(request.Type),
                Title = request.Title.Trim(),
                DescriptionRichText = request.DescriptionRichText ?? string.Empty,
                DescriptionPlainText = request.DescriptionPlainText ?? string.Empty,
                StartAtUtc = request.StartAtUtc,
                EndAtUtc = request.EndAtUtc,
                TimezoneId = string.IsNullOrWhiteSpace(request.TimezoneId)
                    ? classroom.TimezoneId
                    : request.TimezoneId.Trim(),
                IsAllDay = request.IsAllDay,
                RelatedPostId = request.RelatedPostId,
                RelatedAssessmentId = request.RelatedAssessmentId,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            _dbContext.ClassScheduleItems.Add(item);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return MapScheduleItem(item);
        }

        public async Task<ClassScheduleItemDto> UpdateScheduleItemAsync(
            string userId,
            Guid classId,
            Guid scheduleItemId,
            UpdateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var classroom = await EnsureTeacherOwnerAsync(userId, classId, cancellationToken);
            ValidateScheduleRequest(request.Title, request.StartAtUtc, request.EndAtUtc);

            var item = await _dbContext.ClassScheduleItems
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == scheduleItemId &&
                        candidate.ClassId == classId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (item is null)
            {
                throw new NotFoundException("Schedule item not found.");
            }

            item.Type = ParseScheduleItemType(request.Type);
            item.Title = request.Title.Trim();
            item.DescriptionRichText = request.DescriptionRichText ?? string.Empty;
            item.DescriptionPlainText = request.DescriptionPlainText ?? string.Empty;
            item.StartAtUtc = request.StartAtUtc;
            item.EndAtUtc = request.EndAtUtc;
            item.TimezoneId = string.IsNullOrWhiteSpace(request.TimezoneId)
                ? classroom.TimezoneId
                : request.TimezoneId.Trim();
            item.IsAllDay = request.IsAllDay;
            item.RelatedPostId = request.RelatedPostId;
            item.RelatedAssessmentId = request.RelatedAssessmentId;
            item.UpdatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapScheduleItem(item);
        }

        private async Task<ClassAccessContext> EnsureClassAccessAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Id == classId, cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            if (string.Equals(classroom.OwnerTeacherUserId, userId, StringComparison.Ordinal))
            {
                return new ClassAccessContext(classroom, isTeacherOwner: true);
            }

            var isActiveMember = await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == userId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            if (!isActiveMember)
            {
                throw new ForbiddenException("You do not have access to this class.");
            }

            return new ClassAccessContext(classroom, isTeacherOwner: false);
        }

        private async Task<Classroom> EnsureTeacherOwnerAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == classId && candidate.OwnerTeacherUserId == userId,
                    cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            return classroom;
        }

        private async Task<Dictionary<string, string>> LoadUserNamesAsync(
            IReadOnlyCollection<string> userIds,
            CancellationToken cancellationToken)
        {
            if (userIds.Count == 0)
            {
                return new Dictionary<string, string>(StringComparer.Ordinal);
            }

            var users = await _dbContext.Users
                .Where(user => userIds.Contains(user.Id))
                .Select(user => new
                {
                    user.Id,
                    user.FullName,
                    user.UserName
                })
                .ToArrayAsync(cancellationToken);

            return users.ToDictionary(
                user => user.Id,
                user => string.IsNullOrWhiteSpace(user.FullName)
                    ? user.UserName ?? user.Id
                    : user.FullName,
                StringComparer.Ordinal);
        }

        private ClassFeedItemDto MapFeedItem(
            ClassPost post,
            IReadOnlyDictionary<string, string> names,
            string viewerUserId,
            bool includeHiddenComments)
        {
            return MapPost(post, names, viewerUserId, includeHiddenComments);
        }

        private ClassPostDto MapPost(
            ClassPost post,
            IReadOnlyDictionary<string, string> names,
            string viewerUserId,
            bool includeHiddenComments)
        {
            var comments = post.Comments
                .Where(comment => comment.DeletedAtUtc == null && (includeHiddenComments || !comment.IsHidden))
                .OrderBy(comment => comment.CreatedAtUtc)
                .Select(comment => MapComment(comment, names, viewerUserId))
                .ToArray();

            return new ClassPostDto
            {
                Id = post.Id,
                Type = post.Type.ToString(),
                Status = post.Status.ToString(),
                Title = post.Title,
                ContentRichText = post.ContentRichText,
                ContentPlainText = post.ContentPlainText,
                AllowComments = post.AllowComments,
                IsPinned = post.IsPinned,
                NotifyAll = post.NotifyAll,
                PublishAtUtc = post.PublishAtUtc,
                CloseAtUtc = post.CloseAtUtc,
                PublishedAtUtc = post.PublishedAtUtc,
                CreatedAtUtc = post.CreatedAtUtc,
                UpdatedAtUtc = post.UpdatedAtUtc,
                AuthorUserId = post.AuthorUserId,
                AuthorName = ResolveUserName(post.AuthorUserId, names),
                Attachments = post.Attachments
                    .OrderBy(attachment => attachment.CreatedAtUtc)
                    .Select(attachment => new ClassAttachmentDto
                    {
                        Id = attachment.Id,
                        FileName = attachment.FileName,
                        ContentType = attachment.ContentType,
                        FileSizeBytes = attachment.FileSizeBytes,
                        ExternalUrl = attachment.ExternalUrl
                    })
                    .ToArray(),
                Comments = comments,
                Reactions = BuildReactionSummary(
                    post.Reactions.Select(reaction => (reaction.UserId, reaction.ReactionType)),
                    viewerUserId),
                Mentions = MapMentionSummary(post.MentionAll is not null, post.MentionedUsers.Select(mention => mention.MentionedUserId))
            };
        }

        private ClassCommentDto MapComment(
            ClassComment comment,
            IReadOnlyDictionary<string, string> names,
            string viewerUserId)
        {
            return new ClassCommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                AuthorUserId = comment.AuthorUserId,
                AuthorName = ResolveUserName(comment.AuthorUserId, names),
                ContentRichText = comment.ContentRichText,
                ContentPlainText = comment.ContentPlainText,
                NotifyAll = comment.NotifyAll,
                IsHidden = comment.IsHidden,
                CreatedAtUtc = comment.CreatedAtUtc,
                UpdatedAtUtc = comment.UpdatedAtUtc,
                Reactions = BuildReactionSummary(
                    comment.Reactions.Select(reaction => (reaction.UserId, reaction.ReactionType)),
                    viewerUserId),
                Mentions = MapMentionSummary(comment.MentionAll is not null, comment.MentionedUsers.Select(mention => mention.MentionedUserId))
            };
        }

        private static ClassMentionSummaryDto MapMentionSummary(
            bool notifyAll,
            IEnumerable<string> taggedUserIds)
        {
            return new ClassMentionSummaryDto
            {
                NotifyAll = notifyAll,
                TaggedUserIds = taggedUserIds
                    .Where(userId => !string.IsNullOrWhiteSpace(userId))
                    .Distinct(StringComparer.Ordinal)
                    .ToArray()
            };
        }

        private static ClassReactionSummaryDto BuildReactionSummary(
            IEnumerable<(string UserId, ClassReactionType ReactionType)> reactions,
            string viewerUserId)
        {
            var reactionList = reactions.ToArray();
            var grouped = reactionList
                .GroupBy(reaction => reaction.ReactionType)
                .OrderBy(group => group.Key)
                .Select(group => new ReactionCountDto
                {
                    ReactionType = group.Key.ToString(),
                    Count = group.Count()
                })
                .ToArray();

            return new ClassReactionSummaryDto
            {
                ViewerReaction = reactionList
                    .Where(reaction => string.Equals(reaction.UserId, viewerUserId, StringComparison.Ordinal))
                    .Select(reaction => reaction.ReactionType.ToString())
                    .FirstOrDefault(),
                TotalCount = reactionList.Length,
                Counts = grouped
            };
        }

        private async Task<ClassReactionSummaryDto> BuildPostReactionSummaryAsync(
            Guid postId,
            string viewerUserId,
            CancellationToken cancellationToken)
        {
            var reactions = await _dbContext.ClassPostReactions
                .Where(reaction => reaction.PostId == postId)
                .Select(reaction => new
                {
                    reaction.UserId,
                    reaction.ReactionType
                })
                .ToArrayAsync(cancellationToken);

            return BuildReactionSummary(
                reactions.Select(reaction => (reaction.UserId, reaction.ReactionType)),
                viewerUserId);
        }

        private async Task<ClassReactionSummaryDto> BuildCommentReactionSummaryAsync(
            Guid commentId,
            string viewerUserId,
            CancellationToken cancellationToken)
        {
            var reactions = await _dbContext.ClassCommentReactions
                .Where(reaction => reaction.CommentId == commentId)
                .Select(reaction => new
                {
                    reaction.UserId,
                    reaction.ReactionType
                })
                .ToArrayAsync(cancellationToken);

            return BuildReactionSummary(
                reactions.Select(reaction => (reaction.UserId, reaction.ReactionType)),
                viewerUserId);
        }

        private static string ResolveUserName(
            string userId,
            IReadOnlyDictionary<string, string> names)
        {
            if (names.TryGetValue(userId, out var name) && !string.IsNullOrWhiteSpace(name))
            {
                return name;
            }

            return userId;
        }

        private static ClassScheduleItemDto MapScheduleItem(ClassScheduleItem item)
        {
            return new ClassScheduleItemDto
            {
                Id = item.Id,
                Type = item.Type.ToString(),
                Title = item.Title,
                DescriptionRichText = item.DescriptionRichText,
                DescriptionPlainText = item.DescriptionPlainText,
                StartAtUtc = item.StartAtUtc,
                EndAtUtc = item.EndAtUtc,
                TimezoneId = item.TimezoneId,
                IsAllDay = item.IsAllDay,
                RelatedPostId = item.RelatedPostId,
                RelatedAssessmentId = item.RelatedAssessmentId
            };
        }

        private async Task<MentionRecipients> UpsertPostMentionsAsync(
            ClassPost post,
            string actorUserId,
            bool notifyAll,
            IReadOnlyCollection<string> taggedUserIds,
            CancellationToken cancellationToken)
        {
            var existingUserMentions = await _dbContext.ClassPostMentionUsers
                .Where(mention => mention.PostId == post.Id)
                .ToArrayAsync(cancellationToken);

            if (existingUserMentions.Length > 0)
            {
                _dbContext.ClassPostMentionUsers.RemoveRange(existingUserMentions);
            }

            var existingAllMention = await _dbContext.ClassPostMentionAll
                .FirstOrDefaultAsync(mention => mention.PostId == post.Id, cancellationToken);

            if (existingAllMention is not null)
            {
                _dbContext.ClassPostMentionAll.Remove(existingAllMention);
            }

            var classParticipantIds = await GetClassParticipantUserIdsAsync(post.ClassId, cancellationToken);
            var normalizedTags = NormalizeTaggedUserIds(taggedUserIds);

            var validTaggedIds = normalizedTags
                .Where(classParticipantIds.Contains)
                .Where(candidate => !string.Equals(candidate, actorUserId, StringComparison.Ordinal))
                .ToArray();

            var now = DateTime.UtcNow;
            foreach (var taggedUserId in validTaggedIds)
            {
                _dbContext.ClassPostMentionUsers.Add(new ClassPostMentionUser
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    ClassId = post.ClassId,
                    MentionedUserId = taggedUserId,
                    MentionedByUserId = actorUserId,
                    CreatedAtUtc = now
                });
            }

            string[] notifyAllRecipients = Array.Empty<string>();
            if (notifyAll)
            {
                _dbContext.ClassPostMentionAll.Add(new ClassPostMentionAll
                {
                    PostId = post.Id,
                    ClassId = post.ClassId,
                    MentionedByUserId = actorUserId,
                    CreatedAtUtc = now
                });

                notifyAllRecipients = classParticipantIds
                    .Where(participantId => !string.Equals(participantId, actorUserId, StringComparison.Ordinal))
                    .ToArray();
            }

            return new MentionRecipients(validTaggedIds, notifyAllRecipients);
        }

        private async Task<MentionRecipients> UpsertCommentMentionsAsync(
            ClassComment comment,
            string actorUserId,
            bool notifyAll,
            IReadOnlyCollection<string> taggedUserIds,
            CancellationToken cancellationToken)
        {
            var existingUserMentions = await _dbContext.ClassCommentMentionUsers
                .Where(mention => mention.CommentId == comment.Id)
                .ToArrayAsync(cancellationToken);

            if (existingUserMentions.Length > 0)
            {
                _dbContext.ClassCommentMentionUsers.RemoveRange(existingUserMentions);
            }

            var existingAllMention = await _dbContext.ClassCommentMentionAll
                .FirstOrDefaultAsync(mention => mention.CommentId == comment.Id, cancellationToken);

            if (existingAllMention is not null)
            {
                _dbContext.ClassCommentMentionAll.Remove(existingAllMention);
            }

            var classParticipantIds = await GetClassParticipantUserIdsAsync(comment.ClassId, cancellationToken);
            var normalizedTags = NormalizeTaggedUserIds(taggedUserIds);

            var validTaggedIds = normalizedTags
                .Where(classParticipantIds.Contains)
                .Where(candidate => !string.Equals(candidate, actorUserId, StringComparison.Ordinal))
                .ToArray();

            var now = DateTime.UtcNow;
            foreach (var taggedUserId in validTaggedIds)
            {
                _dbContext.ClassCommentMentionUsers.Add(new ClassCommentMentionUser
                {
                    Id = Guid.NewGuid(),
                    CommentId = comment.Id,
                    ClassId = comment.ClassId,
                    MentionedUserId = taggedUserId,
                    MentionedByUserId = actorUserId,
                    CreatedAtUtc = now
                });
            }

            string[] notifyAllRecipients = Array.Empty<string>();
            if (notifyAll)
            {
                _dbContext.ClassCommentMentionAll.Add(new ClassCommentMentionAll
                {
                    CommentId = comment.Id,
                    ClassId = comment.ClassId,
                    MentionedByUserId = actorUserId,
                    CreatedAtUtc = now
                });

                notifyAllRecipients = classParticipantIds
                    .Where(participantId => !string.Equals(participantId, actorUserId, StringComparison.Ordinal))
                    .ToArray();
            }

            return new MentionRecipients(validTaggedIds, notifyAllRecipients);
        }

        private async Task<HashSet<string>> GetClassParticipantUserIdsAsync(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Id == classId, cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            var members = await _dbContext.ClassMemberships
                .Where(membership =>
                    membership.ClassId == classId &&
                    membership.Status == ClassMembershipStatus.Active)
                .Select(membership => membership.StudentUserId)
                .ToArrayAsync(cancellationToken);

            var participants = new HashSet<string>(StringComparer.Ordinal)
            {
                classroom.OwnerTeacherUserId
            };

            foreach (var member in members)
            {
                participants.Add(member);
            }

            return participants;
        }

        private async Task CreateMentionNotificationsAsync(
            Guid classId,
            string actorUserId,
            ClassNotificationSourceType sourceType,
            Guid sourceId,
            string sourceTitle,
            IReadOnlyCollection<string> taggedRecipients,
            IReadOnlyCollection<string> notifyAllRecipients,
            CancellationToken cancellationToken)
        {
            var sendNotifyAll = notifyAllRecipients.Count > 0;
            var recipientsForTag = sendNotifyAll ? Array.Empty<string>() : taggedRecipients.ToArray();
            var recipientsForNotifyAll = sendNotifyAll ? notifyAllRecipients.ToArray() : Array.Empty<string>();

            if (recipientsForTag.Length == 0 && recipientsForNotifyAll.Length == 0)
            {
                return;
            }

            var keys = new List<string>(recipientsForTag.Length + recipientsForNotifyAll.Length);
            keys.AddRange(recipientsForTag.Select(recipient => BuildNotificationKey(classId, sourceType, sourceId, recipient, notifyAll: false)));
            keys.AddRange(recipientsForNotifyAll.Select(recipient => BuildNotificationKey(classId, sourceType, sourceId, recipient, notifyAll: true)));

            var existingKeys = await _dbContext.ClassNotifications
                .Where(notification => keys.Contains(notification.NotificationKey))
                .Select(notification => notification.NotificationKey)
                .ToArrayAsync(cancellationToken);

            var existing = new HashSet<string>(existingKeys, StringComparer.Ordinal);
            var now = DateTime.UtcNow;
            var payload = SerializePayload(sourceType, sourceId, classId);
            var title = string.IsNullOrWhiteSpace(sourceTitle) ? "Class update" : sourceTitle.Trim();

            foreach (var recipient in recipientsForTag)
            {
                var key = BuildNotificationKey(classId, sourceType, sourceId, recipient, notifyAll: false);
                if (existing.Contains(key))
                {
                    continue;
                }

                _dbContext.ClassNotifications.Add(new ClassNotification
                {
                    Id = Guid.NewGuid(),
                    ClassId = classId,
                    RecipientUserId = recipient,
                    ActorUserId = actorUserId,
                    NotificationType = sourceType == ClassNotificationSourceType.Post
                        ? ClassNotificationType.MentionedInPost
                        : ClassNotificationType.MentionedInComment,
                    SourceType = sourceType,
                    SourceId = sourceId,
                    Title = Truncate(title, 200),
                    Message = sourceType == ClassNotificationSourceType.Post
                        ? "You were mentioned in a post."
                        : "You were mentioned in a comment.",
                    LinkPath = $"/classes/{classId}/posts/{sourceId}",
                    PayloadJson = payload,
                    NotificationKey = key,
                    IsRead = false,
                    CreatedAtUtc = now
                });
            }

            foreach (var recipient in recipientsForNotifyAll)
            {
                var key = BuildNotificationKey(classId, sourceType, sourceId, recipient, notifyAll: true);
                if (existing.Contains(key))
                {
                    continue;
                }

                _dbContext.ClassNotifications.Add(new ClassNotification
                {
                    Id = Guid.NewGuid(),
                    ClassId = classId,
                    RecipientUserId = recipient,
                    ActorUserId = actorUserId,
                    NotificationType = sourceType == ClassNotificationSourceType.Post
                        ? ClassNotificationType.MentionedAllInPost
                        : ClassNotificationType.MentionedAllInComment,
                    SourceType = sourceType,
                    SourceId = sourceId,
                    Title = Truncate(title, 200),
                    Message = sourceType == ClassNotificationSourceType.Post
                        ? "Teacher notified the whole class in a post."
                        : "Teacher notified the whole class in a comment.",
                    LinkPath = $"/classes/{classId}/posts/{sourceId}",
                    PayloadJson = payload,
                    NotificationKey = key,
                    IsRead = false,
                    CreatedAtUtc = now
                });
            }
        }

        private static string BuildNotificationKey(
            Guid classId,
            ClassNotificationSourceType sourceType,
            Guid sourceId,
            string recipientUserId,
            bool notifyAll)
        {
            var channel = notifyAll ? "all" : "tag";
            return $"{classId:N}:{sourceType}:{sourceId:N}:{channel}:{recipientUserId}";
        }

        private static string SerializePayload(
            ClassNotificationSourceType sourceType,
            Guid sourceId,
            Guid classId)
        {
            return JsonSerializer.Serialize(new
            {
                sourceType = sourceType.ToString(),
                sourceId,
                classId
            });
        }

        private static string[] NormalizeTaggedUserIds(IReadOnlyCollection<string> taggedUserIds)
        {
            return taggedUserIds
                .Where(userId => !string.IsNullOrWhiteSpace(userId))
                .Select(userId => userId.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToArray();
        }

        private static bool IsPostVisibleToMember(ClassPost post, DateTime nowUtc)
        {
            return post.Status == ClassPostStatus.Published &&
                   (!post.PublishAtUtc.HasValue || post.PublishAtUtc <= nowUtc) &&
                   (!post.CloseAtUtc.HasValue || post.CloseAtUtc > nowUtc);
        }

        private static ClassPostType ParsePostType(string value)
        {
            if (Enum.TryParse<ClassPostType>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Post type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["type"] = new[] { "Type must be Post or Announcement." }
                });
        }

        private static ClassPostStatus ParsePostStatus(string value)
        {
            if (Enum.TryParse<ClassPostStatus>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Post status is invalid.",
                new Dictionary<string, string[]>
                {
                    ["status"] = new[] { "Status must be Draft, Published, or Closed." }
                });
        }

        private static ClassReactionType ParseReactionType(string value)
        {
            if (Enum.TryParse<ClassReactionType>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Reaction type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["reactionType"] = new[] { "Reaction type is not supported." }
                });
        }

        private static ClassScheduleItemType ParseScheduleItemType(string value)
        {
            if (Enum.TryParse<ClassScheduleItemType>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Schedule item type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["type"] = new[] { "Type must be Event, Deadline, Assessment, or Reminder." }
                });
        }

        private static void ValidateScheduleRequest(
            string title,
            DateTime startAtUtc,
            DateTime? endAtUtc)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new ValidationException(
                    "Schedule title is required.",
                    new Dictionary<string, string[]>
                    {
                        ["title"] = new[] { "Schedule title cannot be empty." }
                    });
            }

            if (endAtUtc.HasValue && endAtUtc.Value <= startAtUtc)
            {
                throw new ValidationException(
                    "Schedule end time is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["endAtUtc"] = new[] { "EndAtUtc must be greater than StartAtUtc." }
                    });
            }
        }

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
            {
                return value;
            }

            return value[..maxLength];
        }

        private readonly record struct MentionRecipients(
            IReadOnlyCollection<string> TaggedRecipients,
            IReadOnlyCollection<string> NotifyAllRecipients);

        private sealed class ClassAccessContext
        {
            public ClassAccessContext(
                Classroom classroom,
                bool isTeacherOwner)
            {
                Classroom = classroom;
                IsTeacherOwner = isTeacherOwner;
            }

            public Classroom Classroom { get; }
            public bool IsTeacherOwner { get; }
        }
    }
}
