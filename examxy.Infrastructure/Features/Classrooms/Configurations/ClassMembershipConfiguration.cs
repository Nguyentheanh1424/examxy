using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class ClassMembershipConfiguration : IEntityTypeConfiguration<ClassMembership>
    {
        public void Configure(EntityTypeBuilder<ClassMembership> entity)
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

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.ClassMemberships)
                .HasForeignKey(membership => membership.StudentUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}