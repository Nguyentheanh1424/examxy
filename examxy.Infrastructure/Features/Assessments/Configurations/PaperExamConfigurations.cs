using examxy.Domain.Assessments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Assessments.Configurations
{
    public sealed class PaperExamTemplateConfiguration : IEntityTypeConfiguration<PaperExamTemplate>
    {
        public void Configure(EntityTypeBuilder<PaperExamTemplate> entity)
        {
            entity.ToTable("PaperExamTemplates");
            entity.HasKey(template => template.Id);

            entity.Property(template => template.Code)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(template => template.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(template => template.Description)
                .HasMaxLength(4000);

            entity.Property(template => template.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(template => template.PaperSize)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(template => template.MarkerScheme)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(template => template.CreatedAtUtc)
                .IsRequired();

            entity.Property(template => template.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(template => template.Code)
                .IsUnique();
        }
    }

    public sealed class PaperExamTemplateVersionConfiguration : IEntityTypeConfiguration<PaperExamTemplateVersion>
    {
        public void Configure(EntityTypeBuilder<PaperExamTemplateVersion> entity)
        {
            entity.ToTable("PaperExamTemplateVersions");
            entity.HasKey(version => version.Id);

            entity.Property(version => version.SchemaVersion)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(version => version.GeometryConfigHash)
                .HasMaxLength(128);

            entity.Property(version => version.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(version => version.AbsThreshold)
                .HasColumnType("numeric(10,4)");

            entity.Property(version => version.RelThreshold)
                .HasColumnType("numeric(10,4)");

            entity.Property(version => version.ScoringMethod)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(version => version.ScoringParamsJson)
                .IsRequired()
                .HasMaxLength(16000);

            entity.Property(version => version.PayloadSchemaVersion)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(version => version.MinClientAppVersion)
                .HasMaxLength(32);

            entity.Property(version => version.CreatedAtUtc)
                .IsRequired();

            entity.Property(version => version.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(version => new { version.TemplateId, version.VersionNumber })
                .IsUnique();

            entity.HasOne(version => version.Template)
                .WithMany(template => template.Versions)
                .HasForeignKey(version => version.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class PaperExamTemplateAssetConfiguration : IEntityTypeConfiguration<PaperExamTemplateAsset>
    {
        public void Configure(EntityTypeBuilder<PaperExamTemplateAsset> entity)
        {
            entity.ToTable("PaperExamTemplateAssets");
            entity.HasKey(asset => asset.Id);

            entity.Property(asset => asset.AssetType)
                .HasConversion<string>()
                .HasMaxLength(64);

            entity.Property(asset => asset.StoragePath)
                .HasMaxLength(1000);

            entity.Property(asset => asset.ContentHash)
                .HasMaxLength(128);

            entity.Property(asset => asset.JsonContent)
                .HasMaxLength(200000);

            entity.Property(asset => asset.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(asset => new { asset.TemplateVersionId, asset.AssetType });

            entity.HasOne(asset => asset.TemplateVersion)
                .WithMany(version => version.Assets)
                .HasForeignKey(asset => asset.TemplateVersionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class PaperExamMetadataFieldConfiguration : IEntityTypeConfiguration<PaperExamMetadataField>
    {
        public void Configure(EntityTypeBuilder<PaperExamMetadataField> entity)
        {
            entity.ToTable("PaperExamMetadataFields");
            entity.HasKey(field => field.Id);

            entity.Property(field => field.FieldCode)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(field => field.Label)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(field => field.DecodeMode)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(field => field.GeometryJson)
                .IsRequired()
                .HasMaxLength(40000);

            entity.Property(field => field.ValidationPolicyJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(field => field.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(field => new { field.TemplateVersionId, field.FieldCode })
                .IsUnique();

            entity.HasOne(field => field.TemplateVersion)
                .WithMany(version => version.MetadataFields)
                .HasForeignKey(field => field.TemplateVersionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class AssessmentPaperBindingConfiguration : IEntityTypeConfiguration<AssessmentPaperBinding>
    {
        public void Configure(EntityTypeBuilder<AssessmentPaperBinding> entity)
        {
            entity.ToTable("AssessmentPaperBindings");
            entity.HasKey(binding => binding.Id);

            entity.Property(binding => binding.ConfigHash)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(binding => binding.AnswerMapJson)
                .IsRequired()
                .HasMaxLength(60000);

            entity.Property(binding => binding.MetadataPolicyJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(binding => binding.SubmissionPolicyJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(binding => binding.ReviewPolicyJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(binding => binding.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(binding => binding.CreatedAtUtc)
                .IsRequired();

            entity.Property(binding => binding.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(binding => new { binding.AssessmentId, binding.Status });

            entity.HasOne(binding => binding.Assessment)
                .WithMany(assessment => assessment.PaperBindings)
                .HasForeignKey(binding => binding.AssessmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(binding => binding.TemplateVersion)
                .WithMany(version => version.AssessmentBindings)
                .HasForeignKey(binding => binding.TemplateVersionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public sealed class AssessmentScanSubmissionConfiguration : IEntityTypeConfiguration<AssessmentScanSubmission>
    {
        public void Configure(EntityTypeBuilder<AssessmentScanSubmission> entity)
        {
            entity.ToTable("AssessmentScanSubmissions");
            entity.HasKey(submission => submission.Id);

            entity.Property(submission => submission.StudentUserId)
                .IsRequired();

            entity.Property(submission => submission.ConfigHashUsed)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(submission => submission.ClientSchemaVersion)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(submission => submission.ClientAppVersion)
                .HasMaxLength(32);

            entity.Property(submission => submission.RawScanPayloadJson)
                .IsRequired()
                .HasMaxLength(120000);

            entity.Property(submission => submission.RawImagePath)
                .IsRequired()
                .HasMaxLength(1200);

            entity.Property(submission => submission.TeacherNote)
                .HasMaxLength(4000);

            entity.Property(submission => submission.ReviewedByTeacherUserId);

            entity.Property(submission => submission.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(submission => submission.CreatedAtUtc)
                .IsRequired();

            entity.Property(submission => submission.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(submission => new { submission.AssessmentId, submission.StudentUserId });

            entity.HasOne(submission => submission.Assessment)
                .WithMany(assessment => assessment.ScanSubmissions)
                .HasForeignKey(submission => submission.AssessmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(submission => submission.Binding)
                .WithMany(binding => binding.ScanSubmissions)
                .HasForeignKey(submission => submission.BindingId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public sealed class AssessmentScanResultConfiguration : IEntityTypeConfiguration<AssessmentScanResult>
    {
        public void Configure(EntityTypeBuilder<AssessmentScanResult> entity)
        {
            entity.ToTable("AssessmentScanResults");
            entity.HasKey(result => result.Id);

            entity.Property(result => result.Score)
                .HasColumnType("numeric(10,2)");

            entity.Property(result => result.DetectedStudentId)
                .HasMaxLength(120);

            entity.Property(result => result.DetectedQuizId)
                .HasMaxLength(120);

            entity.Property(result => result.ConfidenceSummaryJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(result => result.WarningFlagsJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.Property(result => result.ConflictFlagsJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.HasIndex(result => result.SubmissionId)
                .IsUnique();

            entity.HasOne(result => result.Submission)
                .WithOne(submission => submission.Result)
                .HasForeignKey<AssessmentScanResult>(result => result.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class AssessmentScanAnswerConfiguration : IEntityTypeConfiguration<AssessmentScanAnswer>
    {
        public void Configure(EntityTypeBuilder<AssessmentScanAnswer> entity)
        {
            entity.ToTable("AssessmentScanAnswers");
            entity.HasKey(answer => answer.Id);

            entity.Property(answer => answer.DetectedOption)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(answer => answer.DetectedAnswerJson)
                .IsRequired()
                .HasMaxLength(20000);

            entity.Property(answer => answer.EarnedPoints)
                .HasColumnType("numeric(10,2)");

            entity.Property(answer => answer.ConfidenceJson)
                .IsRequired()
                .HasMaxLength(12000);

            entity.HasIndex(answer => new { answer.SubmissionId, answer.QuestionNumber })
                .IsUnique();

            entity.HasOne(answer => answer.Submission)
                .WithMany(submission => submission.Answers)
                .HasForeignKey(answer => answer.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class AssessmentScanArtifactConfiguration : IEntityTypeConfiguration<AssessmentScanArtifact>
    {
        public void Configure(EntityTypeBuilder<AssessmentScanArtifact> entity)
        {
            entity.ToTable("AssessmentScanArtifacts");
            entity.HasKey(artifact => artifact.Id);

            entity.Property(artifact => artifact.ArtifactType)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(artifact => artifact.StoragePath)
                .IsRequired()
                .HasMaxLength(1200);

            entity.Property(artifact => artifact.ContentHash)
                .HasMaxLength(128);

            entity.HasOne(artifact => artifact.Submission)
                .WithMany(submission => submission.Artifacts)
                .HasForeignKey(artifact => artifact.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
