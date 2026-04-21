using examxy.Domain.Classrooms;
using examxy.Domain.ClassContent;
using examxy.Domain.Notifications;
using examxy.Domain.QuestionBank;
using examxy.Domain.Assessments;
using examxy.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Persistence
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<TeacherProfile> TeacherProfiles => Set<TeacherProfile>();
        public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
        public DbSet<Classroom> Classes => Set<Classroom>();
        public DbSet<ClassMembership> ClassMemberships => Set<ClassMembership>();
        public DbSet<ClassInvite> ClassInvites => Set<ClassInvite>();
        public DbSet<StudentImportBatch> StudentImportBatches => Set<StudentImportBatch>();
        public DbSet<StudentImportItem> StudentImportItems => Set<StudentImportItem>();
        public DbSet<ClassPost> ClassPosts => Set<ClassPost>();
        public DbSet<ClassPostAttachment> ClassPostAttachments => Set<ClassPostAttachment>();
        public DbSet<ClassComment> ClassComments => Set<ClassComment>();
        public DbSet<ClassPostReaction> ClassPostReactions => Set<ClassPostReaction>();
        public DbSet<ClassCommentReaction> ClassCommentReactions => Set<ClassCommentReaction>();
        public DbSet<ClassPostMentionUser> ClassPostMentionUsers => Set<ClassPostMentionUser>();
        public DbSet<ClassPostMentionAll> ClassPostMentionAll => Set<ClassPostMentionAll>();
        public DbSet<ClassCommentMentionUser> ClassCommentMentionUsers => Set<ClassCommentMentionUser>();
        public DbSet<ClassCommentMentionAll> ClassCommentMentionAll => Set<ClassCommentMentionAll>();
        public DbSet<ClassScheduleItem> ClassScheduleItems => Set<ClassScheduleItem>();
        public DbSet<UserNotification> UserNotifications => Set<UserNotification>();
        public DbSet<QuestionBankQuestion> QuestionBankQuestions => Set<QuestionBankQuestion>();
        public DbSet<QuestionBankQuestionVersion> QuestionBankQuestionVersions => Set<QuestionBankQuestionVersion>();
        public DbSet<QuestionBankTag> QuestionBankTags => Set<QuestionBankTag>();
        public DbSet<QuestionBankQuestionTag> QuestionBankQuestionTags => Set<QuestionBankQuestionTag>();
        public DbSet<QuestionBankAttachment> QuestionBankAttachments => Set<QuestionBankAttachment>();
        public DbSet<ClassAssessment> ClassAssessments => Set<ClassAssessment>();
        public DbSet<ClassAssessmentItem> ClassAssessmentItems => Set<ClassAssessmentItem>();
        public DbSet<StudentAssessmentAttempt> StudentAssessmentAttempts => Set<StudentAssessmentAttempt>();
        public DbSet<StudentAssessmentAnswer> StudentAssessmentAnswers => Set<StudentAssessmentAnswer>();
        public DbSet<PaperExamTemplate> PaperExamTemplates => Set<PaperExamTemplate>();
        public DbSet<PaperExamTemplateVersion> PaperExamTemplateVersions => Set<PaperExamTemplateVersion>();
        public DbSet<PaperExamTemplateAsset> PaperExamTemplateAssets => Set<PaperExamTemplateAsset>();
        public DbSet<PaperExamMetadataField> PaperExamMetadataFields => Set<PaperExamMetadataField>();
        public DbSet<AssessmentPaperBinding> AssessmentPaperBindings => Set<AssessmentPaperBinding>();
        public DbSet<AssessmentScanSubmission> AssessmentScanSubmissions => Set<AssessmentScanSubmission>();
        public DbSet<AssessmentScanResult> AssessmentScanResults => Set<AssessmentScanResult>();
        public DbSet<AssessmentScanAnswer> AssessmentScanAnswers => Set<AssessmentScanAnswer>();
        public DbSet<AssessmentScanArtifact> AssessmentScanArtifacts => Set<AssessmentScanArtifact>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(user => user.FullName)
                    .HasMaxLength(120);

                entity.Property(user => user.CreatedAtUtc)
                    .IsRequired();

                entity.Property(user => user.LastActivatedAtUtc);
            });

            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);

                entity.Property(rt => rt.Token)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(rt => rt.UserId)
                    .IsRequired();

                entity.Property(rt => rt.CreatedAtUtc)
                    .IsRequired();

                entity.Property(rt => rt.ExpiresAtUtc)
                    .IsRequired();

                entity.HasIndex(rt => rt.Token)
                    .IsUnique();

                entity.HasOne(rt => rt.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

        }
    }
}
