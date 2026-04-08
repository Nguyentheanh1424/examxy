using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class V1IdentityClassFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "AspNetUsers",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivatedAtUtc",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Code = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Classes_AspNetUsers_OwnerTeacherUserId",
                        column: x => x.OwnerTeacherUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudentProfiles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    StudentCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    OnboardingState = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProfiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_StudentProfiles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeacherProfiles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherProfiles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_TeacherProfiles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassInvites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    StudentUserId = table.Column<string>(type: "text", nullable: true),
                    InviteCodeHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsedByUserId = table.Column<string>(type: "text", nullable: true),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassInvites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassInvites_AspNetUsers_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ClassInvites_AspNetUsers_UsedByUserId",
                        column: x => x.UsedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ClassInvites_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentUserId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    JoinedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassMemberships_AspNetUsers_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClassMemberships_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentImportBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherUserId = table.Column<string>(type: "text", nullable: false),
                    SourceFileName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalRows = table.Column<int>(type: "integer", nullable: false),
                    CreatedAccountCount = table.Column<int>(type: "integer", nullable: false),
                    SentInviteCount = table.Column<int>(type: "integer", nullable: false),
                    SkippedCount = table.Column<int>(type: "integer", nullable: false),
                    RejectedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentImportBatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentImportBatches_AspNetUsers_TeacherUserId",
                        column: x => x.TeacherUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentImportBatches_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentImportItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowNumber = table.Column<int>(type: "integer", nullable: false),
                    FullName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    StudentCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ResultType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StudentUserId = table.Column<string>(type: "text", nullable: true),
                    ClassInviteId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentImportItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentImportItems_AspNetUsers_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StudentImportItems_ClassInvites_ClassInviteId",
                        column: x => x.ClassInviteId,
                        principalTable: "ClassInvites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StudentImportItems_StudentImportBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "StudentImportBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Code",
                table: "Classes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Classes_OwnerTeacherUserId",
                table: "Classes",
                column: "OwnerTeacherUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvites_ClassId_NormalizedEmail",
                table: "ClassInvites",
                columns: new[] { "ClassId", "NormalizedEmail" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvites_InviteCodeHash",
                table: "ClassInvites",
                column: "InviteCodeHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvites_StudentUserId",
                table: "ClassInvites",
                column: "StudentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvites_UsedByUserId",
                table: "ClassInvites",
                column: "UsedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassMemberships_ClassId_StudentUserId",
                table: "ClassMemberships",
                columns: new[] { "ClassId", "StudentUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassMemberships_StudentUserId",
                table: "ClassMemberships",
                column: "StudentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentImportBatches_ClassId",
                table: "StudentImportBatches",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentImportBatches_TeacherUserId",
                table: "StudentImportBatches",
                column: "TeacherUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentImportItems_BatchId",
                table: "StudentImportItems",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentImportItems_ClassInviteId",
                table: "StudentImportItems",
                column: "ClassInviteId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentImportItems_StudentUserId",
                table: "StudentImportItems",
                column: "StudentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProfiles_StudentCode",
                table: "StudentProfiles",
                column: "StudentCode",
                unique: true);

            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers"
                SET "CreatedAtUtc" = CURRENT_TIMESTAMP
                WHERE "CreatedAtUtc" = '0001-01-01 00:00:00';
                """);

            migrationBuilder.Sql(
                """
                INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
                SELECT legacyAssignments."UserId", teacherRole."Id"
                FROM "AspNetUserRoles" AS legacyAssignments
                INNER JOIN "AspNetRoles" AS legacyRole
                    ON legacyAssignments."RoleId" = legacyRole."Id"
                INNER JOIN "AspNetRoles" AS teacherRole
                    ON teacherRole."NormalizedName" = 'TEACHER'
                WHERE legacyRole."NormalizedName" = 'USER'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM "AspNetUserRoles" AS existingAssignments
                      WHERE existingAssignments."UserId" = legacyAssignments."UserId"
                        AND existingAssignments."RoleId" = teacherRole."Id");
                """);

            migrationBuilder.Sql(
                """
                UPDATE "AspNetRoles"
                SET "Name" = 'Teacher',
                    "NormalizedName" = 'TEACHER'
                WHERE "NormalizedName" = 'USER'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM "AspNetRoles" AS teacherRole
                      WHERE teacherRole."NormalizedName" = 'TEACHER'
                        AND teacherRole."Id" <> "AspNetRoles"."Id");
                """);

            migrationBuilder.Sql(
                """
                DELETE FROM "AspNetUserRoles"
                WHERE "RoleId" IN (
                    SELECT "Id"
                    FROM "AspNetRoles"
                    WHERE "NormalizedName" = 'USER');
                """);

            migrationBuilder.Sql(
                """
                DELETE FROM "AspNetRoles"
                WHERE "NormalizedName" = 'USER';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassMemberships");

            migrationBuilder.DropTable(
                name: "StudentImportItems");

            migrationBuilder.DropTable(
                name: "StudentProfiles");

            migrationBuilder.DropTable(
                name: "TeacherProfiles");

            migrationBuilder.DropTable(
                name: "ClassInvites");

            migrationBuilder.DropTable(
                name: "StudentImportBatches");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastActivatedAtUtc",
                table: "AspNetUsers");
        }
    }
}
