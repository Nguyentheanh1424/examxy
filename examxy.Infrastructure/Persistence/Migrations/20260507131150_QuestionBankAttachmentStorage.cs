using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class QuestionBankAttachmentStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestionVersions_Questi~",
                table: "QuestionBankAttachments");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "QuestionBankAttachments",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "PendingUpload",
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldDefaultValue: "Attached");

            migrationBuilder.AlterColumn<Guid>(
                name: "QuestionVersionId",
                table: "QuestionBankAttachments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "ContentHash",
                table: "QuestionBankAttachments",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PublicUrl",
                table: "QuestionBankAttachments",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UploadedAtUtc",
                table: "QuestionBankAttachments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestionVersions_Questi~",
                table: "QuestionBankAttachments",
                column: "QuestionVersionId",
                principalTable: "QuestionBankQuestionVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestionVersions_Questi~",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "ContentHash",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "PublicUrl",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "UploadedAtUtc",
                table: "QuestionBankAttachments");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "QuestionBankAttachments",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Attached",
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldDefaultValue: "PendingUpload");

            migrationBuilder.AlterColumn<Guid>(
                name: "QuestionVersionId",
                table: "QuestionBankAttachments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestionVersions_Questi~",
                table: "QuestionBankAttachments",
                column: "QuestionVersionId",
                principalTable: "QuestionBankQuestionVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
