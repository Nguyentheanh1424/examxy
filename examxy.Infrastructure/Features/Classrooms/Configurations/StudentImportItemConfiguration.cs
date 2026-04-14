using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class StudentImportItemConfiguration : IEntityTypeConfiguration<StudentImportItem>
    {
        public void Configure(EntityTypeBuilder<StudentImportItem> entity)
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

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.StudentImportItems)
                .HasForeignKey(item => item.StudentUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(item => item.ClassInvite)
                .WithMany()
                .HasForeignKey(item => item.ClassInviteId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}