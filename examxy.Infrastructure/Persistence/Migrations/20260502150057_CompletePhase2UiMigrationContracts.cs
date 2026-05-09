using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompletePhase2UiMigrationContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens");

            migrationBuilder.AddColumn<string>(
                name: "Browser",
                table: "RefreshTokens",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Device",
                table: "RefreshTokens",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DeviceType",
                table: "RefreshTokens",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddressMasked",
                table: "RefreshTokens",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsedAtUtc",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "RefreshTokens",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "RefreshTokens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "Classes",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JoinMode",
                table: "Classes",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "InviteOnly");

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Classes",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Term",
                table: "Classes",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AccountNotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    PreferenceKey = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Channel = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountNotificationPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccountNotificationPreferences_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_SessionId",
                table: "RefreshTokens",
                columns: new[] { "UserId", "SessionId" });

            migrationBuilder.Sql(
                """
                UPDATE "RefreshTokens"
                SET "LastUsedAtUtc" = "CreatedAtUtc",
                    "SessionId" = "Id"
                WHERE "LastUsedAtUtc" = TIMESTAMP '0001-01-01 00:00:00'
                   OR "SessionId" = '00000000-0000-0000-0000-000000000000';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_AccountNotificationPreferences_UserId_PreferenceKey",
                table: "AccountNotificationPreferences",
                columns: new[] { "UserId", "PreferenceKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountNotificationPreferences");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId_SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "Browser",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "Device",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "DeviceType",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "IpAddressMasked",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "LastUsedAtUtc",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "JoinMode",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "Term",
                table: "Classes");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");
        }
    }
}
