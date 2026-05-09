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

            entity.Property(version => version.ContentSchemaVersion)
                .IsRequired()
                .HasDefaultValue(1);

            entity.Property(version => version.AnswerKeySchemaVersion)
                .IsRequired()
                .HasDefaultValue(1);

            entity.Property(version => version.RendererVersion)
                .IsRequired()
                .HasMaxLength(40)
                .HasDefaultValue("legacy-v1");

            entity.Property(version => version.ContentJson)
                .IsRequired()
                .HasMaxLength(30000);

            entity.Property(version => version.AnswerKeyJson)
                .IsRequired()
                .HasMaxLength(20000);

            entity.Property(version => version.ExplanationJson)
                .IsRequired()
                .HasMaxLength(20000)
                .HasDefaultValue("{}");

            entity.Property(version => version.SearchText)
                .IsRequired()
                .HasMaxLength(30000)
                .HasDefaultValue("");

            entity.Property(version => version.CreatedByUserId)
                .IsRequired()
                .HasDefaultValue("");

            entity.Property(version => version.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(version => new { version.QuestionId, version.VersionNumber })
                .IsUnique();

            entity.HasIndex(version => version.QuestionType);
            entity.HasIndex(version => version.ContentSchemaVersion);

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

            entity.Property(attachment => attachment.OwnerTeacherUserId)
                .IsRequired()
                .HasDefaultValue("");

            entity.Property(attachment => attachment.OriginalFileName)
                .IsRequired()
                .HasMaxLength(260)
                .HasDefaultValue("");

            entity.Property(attachment => attachment.ContentType)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(attachment => attachment.StorageProvider)
                .IsRequired()
                .HasMaxLength(40)
                .HasDefaultValue("ExternalUrl");

            entity.Property(attachment => attachment.StorageKey)
                .IsRequired()
                .HasMaxLength(1024)
                .HasDefaultValue("");

            entity.Property(attachment => attachment.ExternalUrl)
                .IsRequired()
                .HasMaxLength(2048);

            entity.Property(attachment => attachment.PublicUrl)
                .IsRequired()
                .HasMaxLength(2048)
                .HasDefaultValue("");

            entity.Property(attachment => attachment.ContentHash)
                .IsRequired()
                .HasMaxLength(128)
                .HasDefaultValue("");

            entity.Property(attachment => attachment.Status)
                .IsRequired()
                .HasMaxLength(32)
                .HasDefaultValue("PendingUpload");

            entity.Property(attachment => attachment.CreatedAtUtc)
                .IsRequired();

            entity.Property(attachment => attachment.UploadedAtUtc);

            entity.HasIndex(attachment => attachment.QuestionVersionId);
            entity.HasIndex(attachment => new { attachment.OwnerTeacherUserId, attachment.Status });

            entity.HasOne(attachment => attachment.QuestionVersion)
                .WithMany(version => version.Attachments)
                .HasForeignKey(attachment => attachment.QuestionVersionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(attachment => attachment.Question)
                .WithMany()
                .HasForeignKey(attachment => attachment.QuestionId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public sealed class QuestionBankExportJobConfiguration : IEntityTypeConfiguration<QuestionBankExportJob>
    {
        public void Configure(EntityTypeBuilder<QuestionBankExportJob> entity)
        {
            entity.ToTable("QuestionBankExportJobs");
            entity.HasKey(job => job.Id);

            entity.Property(job => job.OwnerTeacherUserId)
                .IsRequired();

            entity.Property(job => job.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(job => job.Description)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(job => job.Status)
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(job => job.TemplateId)
                .IsRequired()
                .HasMaxLength(80);

            entity.Property(job => job.OptionsJson)
                .IsRequired()
                .HasMaxLength(10000);

            entity.Property(job => job.GeneratedLatexStorageKey)
                .IsRequired()
                .HasMaxLength(1024);

            entity.Property(job => job.PdfStorageKey)
                .IsRequired()
                .HasMaxLength(1024);

            entity.Property(job => job.CompileLogStorageKey)
                .IsRequired()
                .HasMaxLength(1024);

            entity.Property(job => job.ErrorJson)
                .IsRequired()
                .HasMaxLength(10000);

            entity.HasIndex(job => new { job.OwnerTeacherUserId, job.Status, job.CreatedAtUtc });
        }
    }

    public sealed class QuestionBankExportJobItemConfiguration : IEntityTypeConfiguration<QuestionBankExportJobItem>
    {
        public void Configure(EntityTypeBuilder<QuestionBankExportJobItem> entity)
        {
            entity.ToTable("QuestionBankExportJobItems");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.RenderedLatexFragment)
                .IsRequired()
                .HasMaxLength(50000);

            entity.Property(item => item.WarningsJson)
                .IsRequired()
                .HasMaxLength(10000);

            entity.HasIndex(item => new { item.ExportJobId, item.OrderIndex })
                .IsUnique();

            entity.HasOne(item => item.ExportJob)
                .WithMany(job => job.Items)
                .HasForeignKey(item => item.ExportJobId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Question)
                .WithMany()
                .HasForeignKey(item => item.QuestionBankQuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.QuestionVersion)
                .WithMany()
                .HasForeignKey(item => item.QuestionBankQuestionVersionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public sealed class QuestionBankExportFileConfiguration : IEntityTypeConfiguration<QuestionBankExportFile>
    {
        public void Configure(EntityTypeBuilder<QuestionBankExportFile> entity)
        {
            entity.ToTable("QuestionBankExportFiles");
            entity.HasKey(file => file.Id);

            entity.Property(file => file.FileName)
                .IsRequired()
                .HasMaxLength(260);

            entity.Property(file => file.ContentType)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(file => file.StorageKey)
                .IsRequired()
                .HasMaxLength(1024);

            entity.HasIndex(file => file.ExportJobId);

            entity.HasOne(file => file.ExportJob)
                .WithMany(job => job.Files)
                .HasForeignKey(file => file.ExportJobId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
