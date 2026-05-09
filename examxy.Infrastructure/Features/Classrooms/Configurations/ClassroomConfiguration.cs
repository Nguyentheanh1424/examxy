using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class ClassroomConfiguration : IEntityTypeConfiguration<Classroom>
    {
        public void Configure(EntityTypeBuilder<Classroom> entity)
        {
            entity.ToTable("Classes");

            entity.HasKey(@class => @class.Id);

            entity.Property(@class => @class.Name)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(@class => @class.Code)
                .IsRequired()
                .HasMaxLength(24);

            entity.Property(@class => @class.Subject)
                .HasMaxLength(80);

            entity.Property(@class => @class.Grade)
                .HasMaxLength(40);

            entity.Property(@class => @class.Term)
                .HasMaxLength(80);

            entity.Property(@class => @class.JoinMode)
                .HasConversion<string>()
                .HasMaxLength(24)
                .HasDefaultValue(ClassJoinMode.InviteOnly);

            entity.Property(@class => @class.TimezoneId)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(@class => @class.Status)
                .HasConversion<string>()
                .HasMaxLength(24);

            entity.Property(@class => @class.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(@class => @class.Code)
                .IsUnique();

            entity.HasIndex(@class => new { @class.OwnerTeacherUserId, @class.CreatedAtUtc });

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.OwnedClasses)
                .HasForeignKey(@class => @class.OwnerTeacherUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
