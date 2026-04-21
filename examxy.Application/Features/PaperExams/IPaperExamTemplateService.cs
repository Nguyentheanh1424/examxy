using examxy.Application.Features.PaperExams.DTOs;

namespace examxy.Application.Features.PaperExams
{
    public interface IPaperExamTemplateService
    {
        Task<IReadOnlyCollection<PaperExamTemplateDto>> GetTemplatesAsync(CancellationToken cancellationToken = default);
        Task<PaperExamTemplateDto> CreateTemplateAsync(CreatePaperExamTemplateRequestDto request, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateDto> GetTemplateAsync(Guid templateId, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateVersionDto> CreateTemplateVersionAsync(Guid templateId, CreatePaperExamTemplateVersionRequestDto request, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateVersionDto> GetTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateVersionDto> UpdateTemplateVersionAsync(Guid templateId, Guid versionId, UpdatePaperExamTemplateVersionRequestDto request, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateAssetDto> UploadTemplateAssetAsync(Guid templateId, Guid versionId, UploadPaperExamTemplateAssetRequestDto request, CancellationToken cancellationToken = default);
        Task<IReadOnlyCollection<PaperExamMetadataFieldDto>> UpsertMetadataFieldsAsync(Guid templateId, Guid versionId, IReadOnlyCollection<UpsertPaperExamMetadataFieldRequestDto> request, CancellationToken cancellationToken = default);
        Task<ValidatePaperExamTemplateVersionResultDto> ValidateTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default);
        Task<PaperExamTemplateVersionDto> PublishTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default);
        Task<AssessmentPaperBindingDto?> GetAssessmentBindingAsync(Guid classId, Guid assessmentId, CancellationToken cancellationToken = default);
        Task<AssessmentPaperBindingDto> UpsertAssessmentBindingAsync(string teacherUserId, Guid classId, Guid assessmentId, UpsertAssessmentPaperBindingRequestDto request, CancellationToken cancellationToken = default);
        Task<AssessmentPaperBindingDto> ActivateAssessmentBindingAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default);
    }
}
