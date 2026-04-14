using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class ClassInviteConfiguration : IEntityTypeConfiguration<ClassInvite>
    {
        public void Configure(EntityTypeBuilder<ClassInvite> entity)
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

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.StudentInvites)
                .HasForeignKey(invite => invite.StudentUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.UsedClassInvites)
                .HasForeignKey(invite => invite.UsedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}