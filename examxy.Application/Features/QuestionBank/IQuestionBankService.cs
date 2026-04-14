using examxy.Application.Features.QuestionBank.DTOs;

namespace examxy.Application.Features.QuestionBank
{
    public interface IQuestionBankService
    {
        Task<QuestionDto> CreateQuestionAsync(
            string teacherUserId,
            CreateQuestionRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<QuestionDto>> GetQuestionsAsync(
            string teacherUserId,
            CancellationToken cancellationToken = default);

        Task<QuestionDto> GetQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default);

        Task<QuestionDto> UpdateQuestionAsync(
            string teacherUserId,
            Guid questionId,
            UpdateQuestionRequestDto request,
            CancellationToken cancellationToken = default);

        Task DeleteQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default);
    }
}
