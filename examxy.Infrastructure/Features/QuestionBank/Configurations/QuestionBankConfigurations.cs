using examxy.Domain.QuestionBank;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.QuestionBank.Configurations
{
    public sealed class QuestionBankQuestionConfiguration : IEntityTypeConfiguration<QuestionBankQuestion>
    {
        public void Configure(EntityTypeBuilder<QuestionBankQuestion> entity)
        {
            entity.ToTable("QuestionBankQuestions");
            entity.HasKey(question => question.Id);

            entity.Property(question => question.OwnerTeacherUserId)
                .IsRequired();

            entity.Property(question => question.Code)
                .IsRequired()
                .HasMaxLength(40);

            entity.Property(question => question.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(question => question.CreatedAtUtc)
                .IsRequired();

            entity.Property(question => question.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(question => new { question.OwnerTeacherUserId, question.Code })
                .IsUnique();

            entity.HasIndex(question => new { question.OwnerTeacherUserId, question.Status, question.UpdatedAtUtc });
        }
    }

    public sealed class QuestionBankQuestionVersionConfiguration : IEntityTypeConfiguration<QuestionBankQuestionVersion>
    {
        public void Configure(EntityTypeBuilder<QuestionBankQuestionVersion> entity)
        {
            entity.ToTable("QuestionBankQuestionVersions");
            entity.HasKey(version => version.Id);

            entity.Property(version => version.QuestionType)
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(version => version.StemRichText)
                .IsRequired()
                .HasMaxLength(15000);

            entity.Property(version => version.StemPlainText)
                .IsRequired()
                .HasMaxLength(8000);

            entity.Property(version => version.ExplanationRichText)
                .HasMaxLength(10000);

            entity.Property(version => version.Difficulty)
                .HasMaxLength(24);

            entity.Property(version => version.ContentJson)
                .IsRequired()
                .HasMaxLength(30000);

            entity.Property(version => version.AnswerKeyJson)
                .IsRequired()
                .HasMaxLength(20000);

            entity.Property(version => version.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(version => new { version.QuestionId, version.VersionNumber })
                .IsUnique();

            entity.HasIndex(version => version.QuestionType);

            entity.HasOne(version => version.Question)
                .WithMany(question => question.Versions)
                .HasForeignKey(version => version.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class QuestionBankTagConfiguration : IEntityTypeConfiguration<QuestionBankTag>
    {
        public void Configure(EntityTypeBuilder<QuestionBankTag> entity)
        {
            entity.ToTable("QuestionBankTags");
            entity.HasKey(tag => tag.Id);

            entity.Property(tag => tag.OwnerTeacherUserId)
                .IsRequired();

            entity.Property(tag => tag.Name)
                .IsRequired()
                .HasMaxLength(80);

            entity.Property(tag => tag.NormalizedName)
                .IsRequired()
                .HasMaxLength(80);

            entity.Property(tag => tag.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(tag => new { tag.OwnerTeacherUserId, tag.NormalizedName })
                .IsUnique();
        }
    }

    public sealed class QuestionBankQuestionTagConfiguration : IEntityTypeConfiguration<QuestionBankQuestionTag>
    {
        public void Configure(EntityTypeBuilder<QuestionBankQuestionTag> entity)
        {
            entity.ToTable("QuestionBankQuestionTags");
            entity.HasKey(join => new { join.QuestionId, join.TagId });

            entity.HasIndex(join => new { join.TagId, join.QuestionId });

            entity.HasOne(join => join.Question)
                .WithMany(question => question.QuestionTags)
                .HasForeignKey(join => join.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(join => join.Tag)
                .WithMany(tag => tag.QuestionTags)
                .HasForeignKey(join => join.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class QuestionBankAttachmentConfiguration : IEntityTypeConfiguration<QuestionBankAttachment>
    {
        public void Configure(EntityTypeBuilder<QuestionBankAttachment> entity)
        {
            entity.ToTable("QuestionBankAttachments");
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

            entity.HasIndex(attachment => attachment.QuestionVersionId);

            entity.HasOne(attachment => attachment.QuestionVersion)
                .WithMany(version => version.Attachments)
                .HasForeignKey(attachment => attachment.QuestionVersionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
