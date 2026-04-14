using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class TeacherProfileConfiguration : IEntityTypeConfiguration<TeacherProfile>
    {
        public void Configure(EntityTypeBuilder<TeacherProfile> entity)
        {
            entity.ToTable("TeacherProfiles");

            entity.HasKey(profile => profile.UserId);

            entity.Property(profile => profile.CreatedAtUtc)
                .IsRequired();

            entity.HasOne<ApplicationUser>()
                .WithOne(user => user.TeacherProfile)
                .HasForeignKey<TeacherProfile>(profile => profile.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}