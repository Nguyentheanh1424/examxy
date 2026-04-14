using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
    {
        public void Configure(EntityTypeBuilder<StudentProfile> entity)
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

            entity.HasOne<ApplicationUser>()
                .WithOne(user => user.StudentProfile)
                .HasForeignKey<StudentProfile>(profile => profile.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}