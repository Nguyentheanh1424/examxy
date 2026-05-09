using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace examxy.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260508100000_RemoveMathFormulaQuestionType")]
    public partial class RemoveMathFormulaQuestionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "QuestionBankQuestionVersions"
                SET "QuestionType" = 'MediaBased'
                WHERE "QuestionType" = 'MathFormula';

                UPDATE "ClassAssessmentItems"
                SET "SnapshotQuestionType" = 'MediaBased'
                WHERE "SnapshotQuestionType" = 'MathFormula';

                UPDATE "StudentAssessmentAnswers"
                SET "QuestionType" = 'MediaBased'
                WHERE "QuestionType" = 'MathFormula';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
