using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    public partial class AccountNotificationInbox : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ClassNotifications",
                table: "ClassNotifications");

            migrationBuilder.RenameTable(
                name: "ClassNotifications",
                newName: "UserNotifications");

            migrationBuilder.RenameIndex(
                name: "IX_ClassNotifications_RecipientUserId_IsRead_CreatedAtUtc",
                table: "UserNotifications",
                newName: "IX_UserNotifications_RecipientUserId_IsRead_CreatedAtUtc");

            migrationBuilder.RenameIndex(
                name: "IX_ClassNotifications_NotificationKey",
                table: "UserNotifications",
                newName: "IX_UserNotifications_NotificationKey");

            migrationBuilder.RenameIndex(
                name: "IX_ClassNotifications_ClassId_CreatedAtUtc",
                table: "UserNotifications",
                newName: "IX_UserNotifications_ClassId_CreatedAtUtc");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClassId",
                table: "UserNotifications",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserNotifications",
                table: "UserNotifications",
                column: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserNotifications",
                table: "UserNotifications");

            migrationBuilder.Sql(
                "UPDATE \"UserNotifications\" SET \"ClassId\" = '00000000-0000-0000-0000-000000000000' WHERE \"ClassId\" IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClassId",
                table: "UserNotifications",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.RenameTable(
                name: "UserNotifications",
                newName: "ClassNotifications");

            migrationBuilder.RenameIndex(
                name: "IX_UserNotifications_RecipientUserId_IsRead_CreatedAtUtc",
                table: "ClassNotifications",
                newName: "IX_ClassNotifications_RecipientUserId_IsRead_CreatedAtUtc");

            migrationBuilder.RenameIndex(
                name: "IX_UserNotifications_NotificationKey",
                table: "ClassNotifications",
                newName: "IX_ClassNotifications_NotificationKey");

            migrationBuilder.RenameIndex(
                name: "IX_UserNotifications_ClassId_CreatedAtUtc",
                table: "ClassNotifications",
                newName: "IX_ClassNotifications_ClassId_CreatedAtUtc");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClassNotifications",
                table: "ClassNotifications",
                column: "Id");
        }
    }
}
