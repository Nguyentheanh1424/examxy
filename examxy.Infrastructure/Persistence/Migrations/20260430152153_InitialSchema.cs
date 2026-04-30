using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClassAssessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionRichText = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    DescriptionPlainText = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: false),
                    AssessmentKind = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    AttemptLimit = table.Column<int>(type: "integer", nullable: false),
                    TimeLimitMinutes = table.Column<int>(type: "integer", nullable: true),
                    QuestionOrderMode = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    ShowAnswersMode = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    ScoreReleaseMode = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    PublishAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CloseAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ScoresReleasedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnswersReleasedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassAssessments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClassPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContentRichText = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    ContentPlainText = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    AllowComments = table.Column<bool>(type: "boolean", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyAll = table.Column<bool>(type: "boolean", nullable: false),
                    PublishAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CloseAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassPosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClassScheduleItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatorUserId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionRichText = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    DescriptionPlainText = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    StartAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TimezoneId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsAllDay = table.Column<bool>(type: "boolean", nullable: false),
                    RelatedPostId = table.Column<Guid>(type: "uuid", nullable: true),
                    RelatedAssessmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassScheduleItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaperExamTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    PaperSize = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OutputWidth = table.Column<int>(type: "integer", nullable: true),
                    OutputHeight = table.Column<int>(type: "integer", nullable: true),
                    MarkerScheme = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    HasStudentIdField = table.Column<bool>(type: "boolean", nullable: false),
                    HasQuizIdField = table.Column<bool>(type: "boolean", nullable: false),
                    HasHandwrittenRegions = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaperExamTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CurrentVersionNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    LastUsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankQuestions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankTags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankTags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: true),
                    RecipientUserId = table.Column<string>(type: "text", nullable: false),
                    ActorUserId = table.Column<string>(type: "text", nullable: true),
                    NotificationType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    LinkPath = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    PayloadJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    NotificationKey = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Code = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    OwnerTeacherUserId = table.Column<string>(type: "text", nullable: false),
                    TimezoneId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
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
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "ClassAssessmentItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    SourceQuestionId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceQuestionVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Points = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    SnapshotQuestionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SnapshotStemRichText = table.Column<string>(type: "character varying(15000)", maxLength: 15000, nullable: false),
                    SnapshotStemPlainText = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    SnapshotContentJson = table.Column<string>(type: "character varying(30000)", maxLength: 30000, nullable: false),
                    SnapshotAnswerKeyJson = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassAssessmentItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassAssessmentItems_ClassAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "ClassAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentAssessmentAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentUserId = table.Column<string>(type: "text", nullable: false),
                    AttemptNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AutoGradedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TimeLimitMinutesSnapshot = table.Column<int>(type: "integer", nullable: true),
                    MaxScore = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    EarnedScore = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAssessmentAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAssessmentAttempts_ClassAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "ClassAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<string>(type: "text", nullable: false),
                    ContentRichText = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    ContentPlainText = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    NotifyAll = table.Column<bool>(type: "boolean", nullable: false),
                    IsHidden = table.Column<bool>(type: "boolean", nullable: false),
                    HiddenByTeacherUserId = table.Column<string>(type: "text", nullable: true),
                    HiddenAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassComments_ClassPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "ClassPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassPostAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    ExternalUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassPostAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassPostAttachments_ClassPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "ClassPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassPostMentionAll",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentionedByUserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassPostMentionAll", x => x.PostId);
                    table.ForeignKey(
                        name: "FK_ClassPostMentionAll_ClassPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "ClassPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassPostMentionUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentionedUserId = table.Column<string>(type: "text", nullable: false),
                    MentionedByUserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassPostMentionUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassPostMentionUsers_ClassPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "ClassPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassPostReactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ReactionType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassPostReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassPostReactions_ClassPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "ClassPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaperExamTemplateVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    SchemaVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    GeometryConfigHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    QuestionCount = table.Column<int>(type: "integer", nullable: false),
                    OptionsPerQuestion = table.Column<int>(type: "integer", nullable: false),
                    AbsThreshold = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    RelThreshold = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    ScoringMethod = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ScoringParamsJson = table.Column<string>(type: "character varying(16000)", maxLength: 16000, nullable: false),
                    PayloadSchemaVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    MinClientAppVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaperExamTemplateVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaperExamTemplateVersions_PaperExamTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "PaperExamTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankQuestionVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    QuestionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StemRichText = table.Column<string>(type: "character varying(15000)", maxLength: 15000, nullable: false),
                    StemPlainText = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    ExplanationRichText = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    Difficulty = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    EstimatedSeconds = table.Column<int>(type: "integer", nullable: false),
                    ContentJson = table.Column<string>(type: "character varying(30000)", maxLength: 30000, nullable: false),
                    AnswerKeyJson = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankQuestionVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionBankQuestionVersions_QuestionBankQuestions_Question~",
                        column: x => x.QuestionId,
                        principalTable: "QuestionBankQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankQuestionTags",
                columns: table => new
                {
                    QuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankQuestionTags", x => new { x.QuestionId, x.TagId });
                    table.ForeignKey(
                        name: "FK_QuestionBankQuestionTags_QuestionBankQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "QuestionBankQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionBankQuestionTags_QuestionBankTags_TagId",
                        column: x => x.TagId,
                        principalTable: "QuestionBankTags",
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
                name: "StudentAssessmentAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AttemptId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AnswerJson = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: true),
                    EarnedPoints = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    AutoGradedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAssessmentAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAssessmentAnswers_StudentAssessmentAttempts_AttemptId",
                        column: x => x.AttemptId,
                        principalTable: "StudentAssessmentAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassCommentMentionAll",
                columns: table => new
                {
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentionedByUserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassCommentMentionAll", x => x.CommentId);
                    table.ForeignKey(
                        name: "FK_ClassCommentMentionAll_ClassComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "ClassComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassCommentMentionUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    MentionedUserId = table.Column<string>(type: "text", nullable: false),
                    MentionedByUserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassCommentMentionUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassCommentMentionUsers_ClassComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "ClassComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassCommentReactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ReactionType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassCommentReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassCommentReactions_ClassComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "ClassComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentPaperBindings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    BindingVersion = table.Column<int>(type: "integer", nullable: false),
                    ConfigHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    AnswerMapJson = table.Column<string>(type: "character varying(60000)", maxLength: 60000, nullable: false),
                    MetadataPolicyJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    SubmissionPolicyJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    ReviewPolicyJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentPaperBindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentPaperBindings_ClassAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "ClassAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssessmentPaperBindings_PaperExamTemplateVersions_TemplateV~",
                        column: x => x.TemplateVersionId,
                        principalTable: "PaperExamTemplateVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaperExamMetadataFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    DecodeMode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    GeometryJson = table.Column<string>(type: "character varying(40000)", maxLength: 40000, nullable: false),
                    ValidationPolicyJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaperExamMetadataFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaperExamMetadataFields_PaperExamTemplateVersions_TemplateV~",
                        column: x => x.TemplateVersionId,
                        principalTable: "PaperExamTemplateVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaperExamTemplateAssets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssetType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    JsonContent = table.Column<string>(type: "character varying(200000)", maxLength: 200000, nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaperExamTemplateAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaperExamTemplateAssets_PaperExamTemplateVersions_TemplateV~",
                        column: x => x.TemplateVersionId,
                        principalTable: "PaperExamTemplateVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBankAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    ExternalUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBankAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionBankAttachments_QuestionBankQuestionVersions_Questi~",
                        column: x => x.QuestionVersionId,
                        principalTable: "QuestionBankQuestionVersions",
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

            migrationBuilder.CreateTable(
                name: "AssessmentScanSubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentUserId = table.Column<string>(type: "text", nullable: false),
                    BindingId = table.Column<Guid>(type: "uuid", nullable: false),
                    BindingVersionUsed = table.Column<int>(type: "integer", nullable: false),
                    ConfigHashUsed = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ClientSchemaVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ClientAppVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    RawScanPayloadJson = table.Column<string>(type: "character varying(120000)", maxLength: 120000, nullable: false),
                    RawImagePath = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FinalizedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TeacherNote = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ReviewedByTeacherUserId = table.Column<string>(type: "text", nullable: true),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentScanSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentScanSubmissions_AssessmentPaperBindings_BindingId",
                        column: x => x.BindingId,
                        principalTable: "AssessmentPaperBindings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentScanSubmissions_ClassAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "ClassAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentScanAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    DetectedOption = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DetectedAnswerJson = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: true),
                    EarnedPoints = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    ConfidenceJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentScanAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentScanAnswers_AssessmentScanSubmissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "AssessmentScanSubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentScanArtifacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArtifactType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentScanArtifacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentScanArtifacts_AssessmentScanSubmissions_Submissio~",
                        column: x => x.SubmissionId,
                        principalTable: "AssessmentScanSubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentScanResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    GradedQuestionCount = table.Column<int>(type: "integer", nullable: false),
                    TotalQuestionCount = table.Column<int>(type: "integer", nullable: false),
                    DetectedStudentId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DetectedQuizId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ConfidenceSummaryJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    WarningFlagsJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    ConflictFlagsJson = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentScanResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentScanResults_AssessmentScanSubmissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "AssessmentScanSubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentPaperBindings_AssessmentId_Status",
                table: "AssessmentPaperBindings",
                columns: new[] { "AssessmentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentPaperBindings_TemplateVersionId",
                table: "AssessmentPaperBindings",
                column: "TemplateVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScanAnswers_SubmissionId_QuestionNumber",
                table: "AssessmentScanAnswers",
                columns: new[] { "SubmissionId", "QuestionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScanArtifacts_SubmissionId",
                table: "AssessmentScanArtifacts",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScanResults_SubmissionId",
                table: "AssessmentScanResults",
                column: "SubmissionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScanSubmissions_AssessmentId_StudentUserId",
                table: "AssessmentScanSubmissions",
                columns: new[] { "AssessmentId", "StudentUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentScanSubmissions_BindingId",
                table: "AssessmentScanSubmissions",
                column: "BindingId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassAssessmentItems_AssessmentId_DisplayOrder",
                table: "ClassAssessmentItems",
                columns: new[] { "AssessmentId", "DisplayOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassAssessments_ClassId_AssessmentKind_CreatedAtUtc",
                table: "ClassAssessments",
                columns: new[] { "ClassId", "AssessmentKind", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassAssessments_ClassId_Status_PublishAtUtc",
                table: "ClassAssessments",
                columns: new[] { "ClassId", "Status", "PublishAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassCommentMentionAll_CommentId",
                table: "ClassCommentMentionAll",
                column: "CommentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassCommentMentionUsers_CommentId_MentionedUserId",
                table: "ClassCommentMentionUsers",
                columns: new[] { "CommentId", "MentionedUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassCommentReactions_CommentId_ReactionType",
                table: "ClassCommentReactions",
                columns: new[] { "CommentId", "ReactionType" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassCommentReactions_CommentId_UserId",
                table: "ClassCommentReactions",
                columns: new[] { "CommentId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassComments_ClassId_AuthorUserId",
                table: "ClassComments",
                columns: new[] { "ClassId", "AuthorUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassComments_PostId_CreatedAtUtc",
                table: "ClassComments",
                columns: new[] { "PostId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassComments_PostId_IsHidden",
                table: "ClassComments",
                columns: new[] { "PostId", "IsHidden" });

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Code",
                table: "Classes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Classes_OwnerTeacherUserId_CreatedAtUtc",
                table: "Classes",
                columns: new[] { "OwnerTeacherUserId", "CreatedAtUtc" });

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
                name: "IX_ClassPostAttachments_PostId",
                table: "ClassPostAttachments",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassPostMentionAll_PostId",
                table: "ClassPostMentionAll",
                column: "PostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassPostMentionUsers_PostId_MentionedUserId",
                table: "ClassPostMentionUsers",
                columns: new[] { "PostId", "MentionedUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassPostReactions_PostId_ReactionType",
                table: "ClassPostReactions",
                columns: new[] { "PostId", "ReactionType" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassPostReactions_PostId_UserId",
                table: "ClassPostReactions",
                columns: new[] { "PostId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassPosts_ClassId_CreatedAtUtc",
                table: "ClassPosts",
                columns: new[] { "ClassId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassPosts_ClassId_IsPinned_PublishAtUtc",
                table: "ClassPosts",
                columns: new[] { "ClassId", "IsPinned", "PublishAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassPosts_ClassId_Status_PublishAtUtc",
                table: "ClassPosts",
                columns: new[] { "ClassId", "Status", "PublishAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassScheduleItems_ClassId_EndAtUtc",
                table: "ClassScheduleItems",
                columns: new[] { "ClassId", "EndAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassScheduleItems_ClassId_StartAtUtc",
                table: "ClassScheduleItems",
                columns: new[] { "ClassId", "StartAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_PaperExamMetadataFields_TemplateVersionId_FieldCode",
                table: "PaperExamMetadataFields",
                columns: new[] { "TemplateVersionId", "FieldCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaperExamTemplateAssets_TemplateVersionId_AssetType",
                table: "PaperExamTemplateAssets",
                columns: new[] { "TemplateVersionId", "AssetType" });

            migrationBuilder.CreateIndex(
                name: "IX_PaperExamTemplates_Code",
                table: "PaperExamTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaperExamTemplateVersions_TemplateId_VersionNumber",
                table: "PaperExamTemplateVersions",
                columns: new[] { "TemplateId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankAttachments_QuestionVersionId",
                table: "QuestionBankAttachments",
                column: "QuestionVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestions_OwnerTeacherUserId_Code",
                table: "QuestionBankQuestions",
                columns: new[] { "OwnerTeacherUserId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestions_OwnerTeacherUserId_Status_UpdatedAtUtc",
                table: "QuestionBankQuestions",
                columns: new[] { "OwnerTeacherUserId", "Status", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestionTags_TagId_QuestionId",
                table: "QuestionBankQuestionTags",
                columns: new[] { "TagId", "QuestionId" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestionVersions_QuestionId_VersionNumber",
                table: "QuestionBankQuestionVersions",
                columns: new[] { "QuestionId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankQuestionVersions_QuestionType",
                table: "QuestionBankQuestionVersions",
                column: "QuestionType");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBankTags_OwnerTeacherUserId_NormalizedName",
                table: "QuestionBankTags",
                columns: new[] { "OwnerTeacherUserId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssessmentAnswers_AttemptId_AssessmentItemId",
                table: "StudentAssessmentAnswers",
                columns: new[] { "AttemptId", "AssessmentItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssessmentAttempts_AssessmentId_Status",
                table: "StudentAssessmentAttempts",
                columns: new[] { "AssessmentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssessmentAttempts_AssessmentId_StudentUserId_Attemp~",
                table: "StudentAssessmentAttempts",
                columns: new[] { "AssessmentId", "StudentUserId", "AttemptNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentAssessmentAttempts_StudentUserId_CreatedAtUtc",
                table: "StudentAssessmentAttempts",
                columns: new[] { "StudentUserId", "CreatedAtUtc" });

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

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_ClassId_CreatedAtUtc",
                table: "UserNotifications",
                columns: new[] { "ClassId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_NotificationKey",
                table: "UserNotifications",
                column: "NotificationKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_RecipientUserId_IsRead_CreatedAtUtc",
                table: "UserNotifications",
                columns: new[] { "RecipientUserId", "IsRead", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AssessmentScanAnswers");

            migrationBuilder.DropTable(
                name: "AssessmentScanArtifacts");

            migrationBuilder.DropTable(
                name: "AssessmentScanResults");

            migrationBuilder.DropTable(
                name: "ClassAssessmentItems");

            migrationBuilder.DropTable(
                name: "ClassCommentMentionAll");

            migrationBuilder.DropTable(
                name: "ClassCommentMentionUsers");

            migrationBuilder.DropTable(
                name: "ClassCommentReactions");

            migrationBuilder.DropTable(
                name: "ClassMemberships");

            migrationBuilder.DropTable(
                name: "ClassPostAttachments");

            migrationBuilder.DropTable(
                name: "ClassPostMentionAll");

            migrationBuilder.DropTable(
                name: "ClassPostMentionUsers");

            migrationBuilder.DropTable(
                name: "ClassPostReactions");

            migrationBuilder.DropTable(
                name: "ClassScheduleItems");

            migrationBuilder.DropTable(
                name: "PaperExamMetadataFields");

            migrationBuilder.DropTable(
                name: "PaperExamTemplateAssets");

            migrationBuilder.DropTable(
                name: "QuestionBankAttachments");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestionTags");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "StudentAssessmentAnswers");

            migrationBuilder.DropTable(
                name: "StudentImportItems");

            migrationBuilder.DropTable(
                name: "StudentProfiles");

            migrationBuilder.DropTable(
                name: "TeacherProfiles");

            migrationBuilder.DropTable(
                name: "UserNotifications");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AssessmentScanSubmissions");

            migrationBuilder.DropTable(
                name: "ClassComments");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestionVersions");

            migrationBuilder.DropTable(
                name: "QuestionBankTags");

            migrationBuilder.DropTable(
                name: "StudentAssessmentAttempts");

            migrationBuilder.DropTable(
                name: "ClassInvites");

            migrationBuilder.DropTable(
                name: "StudentImportBatches");

            migrationBuilder.DropTable(
                name: "AssessmentPaperBindings");

            migrationBuilder.DropTable(
                name: "ClassPosts");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestions");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "ClassAssessments");

            migrationBuilder.DropTable(
                name: "PaperExamTemplateVersions");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "PaperExamTemplates");
        }
    }
}
