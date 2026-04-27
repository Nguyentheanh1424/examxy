using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class V2ClassModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Classes_OwnerTeacherUserId",
                table: "Classes");

            migrationBuilder.AddColumn<string>(
                name: "TimezoneId",
                table: "Classes",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

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
                name: "ClassNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_ClassNotifications", x => x.Id);
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

            migrationBuilder.CreateIndex(
                name: "IX_Classes_OwnerTeacherUserId_CreatedAtUtc",
                table: "Classes",
                columns: new[] { "OwnerTeacherUserId", "CreatedAtUtc" });

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
                name: "IX_ClassNotifications_ClassId_CreatedAtUtc",
                table: "ClassNotifications",
                columns: new[] { "ClassId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClassNotifications_NotificationKey",
                table: "ClassNotifications",
                column: "NotificationKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassNotifications_RecipientUserId_IsRead_CreatedAtUtc",
                table: "ClassNotifications",
                columns: new[] { "RecipientUserId", "IsRead", "CreatedAtUtc" });

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassAssessmentItems");

            migrationBuilder.DropTable(
                name: "ClassCommentMentionAll");

            migrationBuilder.DropTable(
                name: "ClassCommentMentionUsers");

            migrationBuilder.DropTable(
                name: "ClassCommentReactions");

            migrationBuilder.DropTable(
                name: "ClassNotifications");

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
                name: "QuestionBankAttachments");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestionTags");

            migrationBuilder.DropTable(
                name: "StudentAssessmentAnswers");

            migrationBuilder.DropTable(
                name: "ClassComments");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestionVersions");

            migrationBuilder.DropTable(
                name: "QuestionBankTags");

            migrationBuilder.DropTable(
                name: "StudentAssessmentAttempts");

            migrationBuilder.DropTable(
                name: "ClassPosts");

            migrationBuilder.DropTable(
                name: "QuestionBankQuestions");

            migrationBuilder.DropTable(
                name: "ClassAssessments");

            migrationBuilder.DropIndex(
                name: "IX_Classes_OwnerTeacherUserId_CreatedAtUtc",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "TimezoneId",
                table: "Classes");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_OwnerTeacherUserId",
                table: "Classes",
                column: "OwnerTeacherUserId");
        }
    }
}
