using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace examxy.Infrastructure.Features.Classrooms.Configurations
{
    public sealed class StudentImportBatchConfiguration : IEntityTypeConfiguration<StudentImportBatch>
    {
        public void Configure(EntityTypeBuilder<StudentImportBatch> entity)
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

            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.TeacherImportBatches)
                .HasForeignKey(batch => batch.TeacherUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}