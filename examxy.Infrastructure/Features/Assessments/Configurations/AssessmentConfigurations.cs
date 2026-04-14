using examxy.Domain.Assessments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Assessments.Configurations
{
    public sealed class ClassAssessmentConfiguration : IEntityTypeConfiguration<ClassAssessment>
    {
        public void Configure(EntityTypeBuilder<ClassAssessment> entity)
        {
            entity.ToTable("ClassAssessments");
            entity.HasKey(assessment => assessment.Id);

            entity.Property(assessment => assessment.OwnerTeacherUserId)
                .IsRequired();

            entity.Property(assessment => assessment.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(assessment => assessment.DescriptionRichText)
                .HasMaxLength(12000);

            entity.Property(assessment => assessment.DescriptionPlainText)
                .HasMaxLength(6000);

            entity.Property(assessment => assessment.AssessmentKind)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(assessment => assessment.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(assessment => assessment.QuestionOrderMode)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(assessment => assessment.ShowAnswersMode)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(assessment => assessment.ScoreReleaseMode)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(assessment => assessment.CreatedAtUtc)
                .IsRequired();

            entity.Property(assessment => assessment.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(assessment => new { assessment.ClassId, assessment.Status, assessment.PublishAtUtc });
            entity.HasIndex(assessment => new { assessment.ClassId, assessment.AssessmentKind, assessment.CreatedAtUtc });
        }
    }

    public sealed class ClassAssessmentItemConfiguration : IEntityTypeConfiguration<ClassAssessmentItem>
    {
        public void Configure(EntityTypeBuilder<ClassAssessmentItem> entity)
        {
            entity.ToTable("ClassAssessmentItems");
            entity.HasKey(item => item.Id);

            entity.Property(item => item.Points)
                .HasColumnType("numeric(10,2)");

            entity.Property(item => item.SnapshotQuestionType)
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(item => item.SnapshotStemRichText)
                .IsRequired()
                .HasMaxLength(15000);

            entity.Property(item => item.SnapshotStemPlainText)
                .IsRequired()
                .HasMaxLength(8000);

            entity.Property(item => item.SnapshotContentJson)
                .IsRequired()
                .HasMaxLength(30000);

            entity.Property(item => item.SnapshotAnswerKeyJson)
                .IsRequired()
                .HasMaxLength(20000);

            entity.Property(item => item.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(item => new { item.AssessmentId, item.DisplayOrder })
                .IsUnique();

            entity.HasOne(item => item.Assessment)
                .WithMany(assessment => assessment.Items)
                .HasForeignKey(item => item.AssessmentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class StudentAssessmentAttemptConfiguration : IEntityTypeConfiguration<StudentAssessmentAttempt>
    {
        public void Configure(EntityTypeBuilder<StudentAssessmentAttempt> entity)
        {
            entity.ToTable("StudentAssessmentAttempts");
            entity.HasKey(attempt => attempt.Id);

            entity.Property(attempt => attempt.StudentUserId)
                .IsRequired();

            entity.Property(attempt => attempt.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(attempt => attempt.MaxScore)
                .HasColumnType("numeric(10,2)");

            entity.Property(attempt => attempt.EarnedScore)
                .HasColumnType("numeric(10,2)");

            entity.Property(attempt => attempt.CreatedAtUtc)
                .IsRequired();

            entity.Property(attempt => attempt.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(attempt => new { attempt.AssessmentId, attempt.StudentUserId, attempt.AttemptNumber })
                .IsUnique();

            entity.HasIndex(attempt => new { attempt.StudentUserId, attempt.CreatedAtUtc });
            entity.HasIndex(attempt => new { attempt.AssessmentId, attempt.Status });

            entity.HasOne(attempt => attempt.Assessment)
                .WithMany(assessment => assessment.Attempts)
                .HasForeignKey(attempt => attempt.AssessmentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class StudentAssessmentAnswerConfiguration : IEntityTypeConfiguration<StudentAssessmentAnswer>
    {
        public void Configure(EntityTypeBuilder<StudentAssessmentAnswer> entity)
        {
            entity.ToTable("StudentAssessmentAnswers");
            entity.HasKey(answer => answer.Id);

            entity.Property(answer => answer.QuestionType)
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(answer => answer.AnswerJson)
                .IsRequired()
                .HasMaxLength(20000);

            entity.Property(answer => answer.EarnedPoints)
                .HasColumnType("numeric(10,2)");

            entity.Property(answer => answer.CreatedAtUtc)
                .IsRequired();

            entity.Property(answer => answer.UpdatedAtUtc)
                .IsRequired();

            entity.HasIndex(answer => new { answer.AttemptId, answer.AssessmentItemId })
                .IsUnique();

            entity.HasOne(answer => answer.Attempt)
                .WithMany(attempt => attempt.Answers)
                .HasForeignKey(answer => answer.AttemptId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
