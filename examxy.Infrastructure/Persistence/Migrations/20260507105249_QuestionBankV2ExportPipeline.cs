using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class QuestionBankV2ExportPipeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnswerKeySchemaVersion",
                table: "QuestionBankQuestionVersions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "ContentSchemaVersion",
                table: "QuestionBankQuestionVersions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "QuestionBankQuestionVersions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExplanationJson",
                table: "QuestionBankQuestionVersions",
                type: "character varying(20000)",
                maxLength: 20000,
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "RendererVersion",
                table: "QuestionBankQuestionVersions",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "legacy-v1");

            migrationBuilder.AddColumn<string>(
                name: "SearchText",
                table: "QuestionBankQuestionVersions",
                type: "character varying(30000)",
                maxLength: 30000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "QuestionBankAttachments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalFileName",
                table: "QuestionBankAttachments",
                type: "character varying(260)",
                maxLength: 260,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerTeacherUserId",
                table: "QuestionBankAttachments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "QuestionId",
                table: "QuestionBankAttachments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "QuestionBankAttachments",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Attached");

            migrationBuilder.AddColumn<string>(
                name: "StorageKey",
                table: "QuestionBankAttachments",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StorageProvider",
                table: "QuestionBankAttachments",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "ExternalUrl");

            migrationBuilder.CreateTable(
                name: "QuestionBankExportJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TemplateId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    OptionsJson = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    QuestionCount = table.Column<int>(type: "integer", nullable: false),
                    GeneratedLatexStorageKey = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    PdfStorageKey = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    CompileLogStorageKey = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    ErrorJson = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankExportJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankExportFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExportJobId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankExportFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionBankExportFiles_QuestionBankExportJobs_ExportJobId",
                        column: x => x.ExportJobId,
                        principalTable: "QuestionBankExportJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankExportJobItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExportJobId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionBankQuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionBankQuestionVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    RenderedLatexFragment = table.Column<string>(type: "character varying(50000)", maxLength: 50000, nullable: false),
                    WarningsJson = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankExportJobItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionBankExportJobItems_QuestionBankExportJobs_ExportJob~",
                        column: x => x.ExportJobId,
                        principalTable: "QuestionBankExportJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionBankExportJobItems_QuestionBankQuestionVersions_Que~",
                        column: x => x.QuestionBankQuestionVersionId,
                        principalTable: "QuestionBankQuestionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuestionBankExportJobItems_QuestionBankQuestions_QuestionBa~",
                        column: x => x.QuestionBankQuestionId,
                        principalTable: "QuestionBankQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestionVersions_ContentSchemaVersion",
                table: "QuestionBankQuestionVersions",
                column: "ContentSchemaVersion");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankAttachments_OwnerTeacherUserId_Status",
                table: "QuestionBankAttachments",
                columns: new[] { "OwnerTeacherUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankAttachments_QuestionId",
                table: "QuestionBankAttachments",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankExportFiles_ExportJobId",
                table: "QuestionBankExportFiles",
                column: "ExportJobId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankExportJobItems_ExportJobId_OrderIndex",
                table: "QuestionBankExportJobItems",
                columns: new[] { "ExportJobId", "OrderIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankExportJobItems_QuestionBankQuestionId",
                table: "QuestionBankExportJobItems",
                column: "QuestionBankQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankExportJobItems_QuestionBankQuestionVersionId",
                table: "QuestionBankExportJobItems",
                column: "QuestionBankQuestionVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankExportJobs_OwnerTeacherUserId_Status_CreatedAtU~",
                table: "QuestionBankExportJobs",
                columns: new[] { "OwnerTeacherUserId", "Status", "CreatedAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestions_QuestionId",
                table: "QuestionBankAttachments",
                column: "QuestionId",
                principalTable: "QuestionBankQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuestionBankAttachments_QuestionBankQuestions_QuestionId",
                table: "QuestionBankAttachments");

            migrationBuilder.DropTable(
                name: "QuestionBankExportFiles");

            migrationBuilder.DropTable(
                name: "QuestionBankExportJobItems");

            migrationBuilder.DropTable(
                name: "QuestionBankExportJobs");

            migrationBuilder.DropIndex(
                name: "IX_QuestionBankQuestionVersions_ContentSchemaVersion",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropIndex(
                name: "IX_QuestionBankAttachments_OwnerTeacherUserId_Status",
                table: "QuestionBankAttachments");

            migrationBuilder.DropIndex(
                name: "IX_QuestionBankAttachments_QuestionId",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "AnswerKeySchemaVersion",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "ContentSchemaVersion",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "ExplanationJson",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "RendererVersion",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "SearchText",
                table: "QuestionBankQuestionVersions");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "OriginalFileName",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "OwnerTeacherUserId",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "QuestionId",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "StorageKey",
                table: "QuestionBankAttachments");

            migrationBuilder.DropColumn(
                name: "StorageProvider",
                table: "QuestionBankAttachments");
        }
    }
}
