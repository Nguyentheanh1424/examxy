using examxy.Infrastructure.Academic;
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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

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

            builder.Entity<TeacherProfile>(entity =>
            {
                entity.ToTable("TeacherProfiles");

                entity.HasKey(profile => profile.UserId);

                entity.Property(profile => profile.CreatedAtUtc)
                    .IsRequired();

                entity.HasOne(profile => profile.User)
                    .WithOne(user => user.TeacherProfile)
                    .HasForeignKey<TeacherProfile>(profile => profile.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<StudentProfile>(entity =>
            {
                entity.ToTable("StudentProfiles");

                entity.HasKey(profile => profile.UserId);

                entity.Property(profile => profile.StudentCode)
                    .HasMaxLength(64);

                entity.Property(profile => profile.OnboardingState)
                    .HasConversion<string>()
                    .HasMaxLength(24);

                entity.Property(profile => profile.CreatedAtUtc)
                    .IsRequired();

                entity.HasIndex(profile => profile.StudentCode)
                    .IsUnique();

                entity.HasOne(profile => profile.User)
                    .WithOne(user => user.StudentProfile)
                    .HasForeignKey<StudentProfile>(profile => profile.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<Classroom>(entity =>
            {
                entity.ToTable("Classes");

                entity.HasKey(@class => @class.Id);

                entity.Property(@class => @class.Name)
                    .IsRequired()
                    .HasMaxLength(120);

                entity.Property(@class => @class.Code)
                    .IsRequired()
                    .HasMaxLength(24);

                entity.Property(@class => @class.Status)
                    .HasConversion<string>()
                    .HasMaxLength(24);

                entity.Property(@class => @class.CreatedAtUtc)
                    .IsRequired();

                entity.HasIndex(@class => @class.Code)
                    .IsUnique();

                entity.HasOne(@class => @class.OwnerTeacher)
                    .WithMany(user => user.OwnedClasses)
                    .HasForeignKey(@class => @class.OwnerTeacherUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ClassMembership>(entity =>
            {
                entity.ToTable("ClassMemberships");

                entity.HasKey(membership => membership.Id);

                entity.Property(membership => membership.Status)
                    .HasConversion<string>()
                    .HasMaxLength(24);

                entity.HasIndex(membership => new { membership.ClassId, membership.StudentUserId })
                    .IsUnique();

                entity.HasOne(membership => membership.Class)
                    .WithMany(@class => @class.Memberships)
                    .HasForeignKey(membership => membership.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(membership => membership.StudentUser)
                    .WithMany(user => user.ClassMemberships)
                    .HasForeignKey(membership => membership.StudentUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ClassInvite>(entity =>
            {
                entity.ToTable("ClassInvites");

                entity.HasKey(invite => invite.Id);

                entity.Property(invite => invite.Email)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(invite => invite.NormalizedEmail)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(invite => invite.InviteCodeHash)
                    .IsRequired()
                    .HasMaxLength(128);

                entity.Property(invite => invite.Status)
                    .HasConversion<string>()
                    .HasMaxLength(24);

                entity.Property(invite => invite.CreatedAtUtc)
                    .IsRequired();

                entity.Property(invite => invite.SentAtUtc)
                    .IsRequired();

                entity.Property(invite => invite.ExpiresAtUtc)
                    .IsRequired();

                entity.HasIndex(invite => invite.InviteCodeHash)
                    .IsUnique();

                entity.HasIndex(invite => new { invite.ClassId, invite.NormalizedEmail });

                entity.HasOne(invite => invite.Class)
                    .WithMany(@class => @class.Invites)
                    .HasForeignKey(invite => invite.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(invite => invite.StudentUser)
                    .WithMany(user => user.StudentInvites)
                    .HasForeignKey(invite => invite.StudentUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(invite => invite.UsedByUser)
                    .WithMany(user => user.UsedClassInvites)
                    .HasForeignKey(invite => invite.UsedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            builder.Entity<StudentImportBatch>(entity =>
            {
                entity.ToTable("StudentImportBatches");

                entity.HasKey(batch => batch.Id);

                entity.Property(batch => batch.SourceFileName)
                    .HasMaxLength(200);

                entity.Property(batch => batch.CreatedAtUtc)
                    .IsRequired();

                entity.HasOne(batch => batch.Class)
                    .WithMany(@class => @class.ImportBatches)
                    .HasForeignKey(batch => batch.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(batch => batch.TeacherUser)
                    .WithMany(user => user.TeacherImportBatches)
                    .HasForeignKey(batch => batch.TeacherUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<StudentImportItem>(entity =>
            {
                entity.ToTable("StudentImportItems");

                entity.HasKey(item => item.Id);

                entity.Property(item => item.FullName)
                    .HasMaxLength(120);

                entity.Property(item => item.StudentCode)
                    .HasMaxLength(64);

                entity.Property(item => item.Email)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(item => item.ResultType)
                    .HasConversion<string>()
                    .HasMaxLength(32);

                entity.Property(item => item.Message)
                    .HasMaxLength(500);

                entity.HasOne(item => item.Batch)
                    .WithMany(batch => batch.Items)
                    .HasForeignKey(item => item.BatchId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(item => item.StudentUser)
                    .WithMany(user => user.StudentImportItems)
                    .HasForeignKey(item => item.StudentUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(item => item.ClassInvite)
                    .WithMany()
                    .HasForeignKey(item => item.ClassInviteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
