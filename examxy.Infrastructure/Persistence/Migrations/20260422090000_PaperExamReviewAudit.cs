using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PaperExamReviewAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAtUtc",
                table: "AssessmentScanSubmissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedByTeacherUserId",
                table: "AssessmentScanSubmissions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeacherNote",
                table: "AssessmentScanSubmissions",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewedAtUtc",
                table: "AssessmentScanSubmissions");

            migrationBuilder.DropColumn(
                name: "ReviewedByTeacherUserId",
                table: "AssessmentScanSubmissions");

            migrationBuilder.DropColumn(
                name: "TeacherNote",
                table: "AssessmentScanSubmissions");
        }
    }
}
