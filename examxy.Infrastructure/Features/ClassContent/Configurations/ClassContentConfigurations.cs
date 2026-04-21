using examxy.Domain.ClassContent;
using examxy.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.ClassContent.Configurations
{
    public sealed class ClassPostConfiguration : IEntityTypeConfiguration<ClassPost>
    {
        public void Configure(EntityTypeBuilder<ClassPost> entity)
        {
            entity.ToTable("ClassPosts");
            entity.HasKey(post => post.Id);

            entity.Property(post => post.AuthorUserId)
                .IsRequired();

            entity.Property(post => post.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(post => post.ContentRichText)
                .HasMaxLength(20000);

            entity.Property(post => post.ContentPlainText)
                .HasMaxLength(10000);

            entity.Property(post => post.Type)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(post => post.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(post => post.CreatedAtUtc)
                .IsRequired();

            entity.Property(post => post.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(post => new { post.ClassId, post.Status, post.PublishAtUtc });
            entity.HasIndex(post => new { post.ClassId, post.CreatedAtUtc });
            entity.HasIndex(post => new { post.ClassId, post.IsPinned, post.PublishAtUtc });
        }
    }

    public sealed class ClassPostAttachmentConfiguration : IEntityTypeConfiguration<ClassPostAttachment>
    {
        public void Configure(EntityTypeBuilder<ClassPostAttachment> entity)
        {
            entity.ToTable("ClassPostAttachments");
            entity.HasKey(attachment => attachment.Id);

            entity.Property(attachment => attachment.FileName)
                .IsRequired()
                .HasMaxLength(260);

            entity.Property(attachment => attachment.ContentType)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(attachment => attachment.ExternalUrl)
                .IsRequired()
                .HasMaxLength(2048);

            entity.Property(attachment => attachment.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(attachment => attachment.PostId);

            entity.HasOne(attachment => attachment.Post)
                .WithMany(post => post.Attachments)
                .HasForeignKey(attachment => attachment.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassCommentConfiguration : IEntityTypeConfiguration<ClassComment>
    {
        public void Configure(EntityTypeBuilder<ClassComment> entity)
        {
            entity.ToTable("ClassComments");
            entity.HasKey(comment => comment.Id);

            entity.Property(comment => comment.AuthorUserId)
                .IsRequired();

            entity.Property(comment => comment.ContentRichText)
                .HasMaxLength(10000);

            entity.Property(comment => comment.ContentPlainText)
                .HasMaxLength(5000);

            entity.Property(comment => comment.CreatedAtUtc)
                .IsRequired();

            entity.Property(comment => comment.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(comment => new { comment.PostId, comment.CreatedAtUtc });
            entity.HasIndex(comment => new { comment.PostId, comment.IsHidden });
            entity.HasIndex(comment => new { comment.ClassId, comment.AuthorUserId });

            entity.HasOne(comment => comment.Post)
                .WithMany(post => post.Comments)
                .HasForeignKey(comment => comment.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassPostReactionConfiguration : IEntityTypeConfiguration<ClassPostReaction>
    {
        public void Configure(EntityTypeBuilder<ClassPostReaction> entity)
        {
            entity.ToTable("ClassPostReactions");
            entity.HasKey(reaction => reaction.Id);

            entity.Property(reaction => reaction.UserId)
                .IsRequired();

            entity.Property(reaction => reaction.ReactionType)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(reaction => reaction.CreatedAtUtc)
                .IsRequired();

            entity.Property(reaction => reaction.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(reaction => new { reaction.PostId, reaction.UserId })
                .IsUnique();

            entity.HasIndex(reaction => new { reaction.PostId, reaction.ReactionType });

            entity.HasOne(reaction => reaction.Post)
                .WithMany(post => post.Reactions)
                .HasForeignKey(reaction => reaction.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassCommentReactionConfiguration : IEntityTypeConfiguration<ClassCommentReaction>
    {
        public void Configure(EntityTypeBuilder<ClassCommentReaction> entity)
        {
            entity.ToTable("ClassCommentReactions");
            entity.HasKey(reaction => reaction.Id);

            entity.Property(reaction => reaction.UserId)
                .IsRequired();

            entity.Property(reaction => reaction.ReactionType)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(reaction => reaction.CreatedAtUtc)
                .IsRequired();

            entity.Property(reaction => reaction.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(reaction => new { reaction.CommentId, reaction.UserId })
                .IsUnique();

            entity.HasIndex(reaction => new { reaction.CommentId, reaction.ReactionType });

            entity.HasOne(reaction => reaction.Comment)
                .WithMany(comment => comment.Reactions)
                .HasForeignKey(reaction => reaction.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassPostMentionUserConfiguration : IEntityTypeConfiguration<ClassPostMentionUser>
    {
        public void Configure(EntityTypeBuilder<ClassPostMentionUser> entity)
        {
            entity.ToTable("ClassPostMentionUsers");
            entity.HasKey(mention => mention.Id);

            entity.Property(mention => mention.MentionedUserId)
                .IsRequired();

            entity.Property(mention => mention.MentionedByUserId)
                .IsRequired();

            entity.Property(mention => mention.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(mention => new { mention.PostId, mention.MentionedUserId })
                .IsUnique();

            entity.HasOne(mention => mention.Post)
                .WithMany(post => post.MentionedUsers)
                .HasForeignKey(mention => mention.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassPostMentionAllConfiguration : IEntityTypeConfiguration<ClassPostMentionAll>
    {
        public void Configure(EntityTypeBuilder<ClassPostMentionAll> entity)
        {
            entity.ToTable("ClassPostMentionAll");
            entity.HasKey(mention => mention.PostId);

            entity.Property(mention => mention.MentionedByUserId)
                .IsRequired();

            entity.Property(mention => mention.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(mention => mention.PostId)
                .IsUnique();

            entity.HasOne(mention => mention.Post)
                .WithOne(post => post.MentionAll)
                .HasForeignKey<ClassPostMentionAll>(mention => mention.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassCommentMentionUserConfiguration : IEntityTypeConfiguration<ClassCommentMentionUser>
    {
        public void Configure(EntityTypeBuilder<ClassCommentMentionUser> entity)
        {
            entity.ToTable("ClassCommentMentionUsers");
            entity.HasKey(mention => mention.Id);

            entity.Property(mention => mention.MentionedUserId)
                .IsRequired();

            entity.Property(mention => mention.MentionedByUserId)
                .IsRequired();

            entity.Property(mention => mention.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(mention => new { mention.CommentId, mention.MentionedUserId })
                .IsUnique();

            entity.HasOne(mention => mention.Comment)
                .WithMany(comment => comment.MentionedUsers)
                .HasForeignKey(mention => mention.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassCommentMentionAllConfiguration : IEntityTypeConfiguration<ClassCommentMentionAll>
    {
        public void Configure(EntityTypeBuilder<ClassCommentMentionAll> entity)
        {
            entity.ToTable("ClassCommentMentionAll");
            entity.HasKey(mention => mention.CommentId);

            entity.Property(mention => mention.MentionedByUserId)
                .IsRequired();

            entity.Property(mention => mention.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(mention => mention.CommentId)
                .IsUnique();

            entity.HasOne(mention => mention.Comment)
                .WithOne(comment => comment.MentionAll)
                .HasForeignKey<ClassCommentMentionAll>(mention => mention.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClassScheduleItemConfiguration : IEntityTypeConfiguration<ClassScheduleItem>
    {
        public void Configure(EntityTypeBuilder<ClassScheduleItem> entity)
        {
            entity.ToTable("ClassScheduleItems");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.CreatorUserId)
                .IsRequired();

            entity.Property(item => item.Type)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(item => item.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(item => item.DescriptionRichText)
                .HasMaxLength(10000);

            entity.Property(item => item.DescriptionPlainText)
                .HasMaxLength(5000);

            entity.Property(item => item.TimezoneId)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(item => item.CreatedAtUtc)
                .IsRequired();

            entity.Property(item => item.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(item => new { item.ClassId, item.StartAtUtc });
            entity.HasIndex(item => new { item.ClassId, item.EndAtUtc });
        }
    }

    public sealed class UserNotificationConfiguration : IEntityTypeConfiguration<UserNotification>
    {
        public void Configure(EntityTypeBuilder<UserNotification> entity)
        {
            entity.ToTable("UserNotifications");
            entity.HasKey(notification => notification.Id);

            entity.Property(notification => notification.RecipientUserId)
                .IsRequired();

            entity.Property(notification => notification.NotificationType)
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(notification => notification.SourceType)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(notification => notification.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(notification => notification.Message)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(notification => notification.LinkPath)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(notification => notification.PayloadJson)
                .IsRequired()
                .HasMaxLength(4000);

            entity.Property(notification => notification.NotificationKey)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(notification => notification.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(notification => notification.NotificationKey)
                .IsUnique();

            entity.HasIndex(notification => new { notification.RecipientUserId, notification.IsRead, notification.CreatedAtUtc });
            entity.HasIndex(notification => new { notification.ClassId, notification.CreatedAtUtc });
        }
    }
}
