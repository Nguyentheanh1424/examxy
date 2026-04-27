using System.Text.Json;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.PaperExams;
using examxy.Application.Features.PaperExams.DTOs;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/classes/{classId:guid}/assessments/{assessmentId:guid}")]
    public sealed class OfflineAssessmentSubmissionsController : ControllerBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly IStudentOfflineScanConfigService _scanConfigService;
        private readonly IOfflineAssessmentScanService _offlineAssessmentScanService;
        private readonly IPaperExamStorage _paperExamStorage;
        private readonly ICurrentUserService _currentUserService;

        public OfflineAssessmentSubmissionsController(
            IStudentOfflineScanConfigService scanConfigService,
            IOfflineAssessmentScanService offlineAssessmentScanService,
            IPaperExamStorage paperExamStorage,
            ICurrentUserService currentUserService)
        {
            _scanConfigService = scanConfigService;
            _offlineAssessmentScanService = offlineAssessmentScanService;
            _paperExamStorage = paperExamStorage;
            _currentUserService = currentUserService;
        }

        [HttpGet("offline-scan-config")]
        [ProducesResponseType(typeof(StudentOfflineScanConfigDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StudentOfflineScanConfigDto>> GetOfflineScanConfig(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var response = await _scanConfigService.GetScanConfigAsync(
                EnsureAuthenticatedStudent(),
                classId,
                assessmentId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("offline-submissions")]
        [ProducesResponseType(typeof(AssessmentScanSubmissionDto), StatusCodes.Status200OK)]
        [RequestSizeLimit(25_000_000)]
        public async Task<ActionResult<AssessmentScanSubmissionDto>> SubmitOfflineScan(
            Guid classId,
            Guid assessmentId,
            [FromForm] OfflineAssessmentScanFormRequest request,
            CancellationToken cancellationToken)
        {
            var studentUserId = EnsureAuthenticatedStudent();
            if (request.RawImage is null || request.RawImage.Length == 0)
            {
                throw new ValidationException("Raw image is required.", new Dictionary<string, string[]>
                {
                    ["rawImage"] = new[] { "RawImage file is required." }
                });
            }

            await using var imageStream = request.RawImage.OpenReadStream();
            var storedImage = await _paperExamStorage.SaveSubmissionImageAsync(
                assessmentId,
                studentUserId,
                request.RawImage.FileName,
                request.RawImage.ContentType ?? "application/octet-stream",
                imageStream,
                cancellationToken);

            var payload = new SubmitOfflineAssessmentScanRequestDto
            {
                BindingId = request.BindingId,
                BindingVersionUsed = request.BindingVersionUsed,
                ConfigHashUsed = request.ConfigHashUsed,
                ClientSchemaVersion = request.ClientSchemaVersion,
                ClientAppVersion = request.ClientAppVersion,
                Answers = JsonSerializer.Deserialize<IReadOnlyCollection<OfflineRecognizedAnswerDto>>(request.AnswersJson, JsonOptions)
                    ?? Array.Empty<OfflineRecognizedAnswerDto>(),
                MetadataJson = request.MetadataJson,
                ConfidenceSummaryJson = request.ConfidenceSummaryJson,
                WarningFlagsJson = request.WarningFlagsJson,
                ConflictFlagsJson = request.ConflictFlagsJson,
                RawScanPayloadJson = request.RawScanPayloadJson,
                RawImageStoragePath = storedImage.StoragePath
            };

            var response = await _offlineAssessmentScanService.SubmitScanAsync(
                studentUserId,
                classId,
                assessmentId,
                payload,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("offline-submissions/me")]
        [ProducesResponseType(typeof(AssessmentScanSubmissionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AssessmentScanSubmissionDto>> GetMySubmission(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var response = await _offlineAssessmentScanService.GetMySubmissionAsync(
                EnsureAuthenticatedStudent(),
                classId,
                assessmentId,
                cancellationToken);

            if (response is null)
            {
                return NotFound();
            }

            return Ok(response);
        }

        [HttpGet("offline-submissions")]
        [ProducesResponseType(typeof(IReadOnlyCollection<AssessmentScanSubmissionDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyCollection<AssessmentScanSubmissionDto>>> GetSubmissions(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var response = await _offlineAssessmentScanService.GetSubmissionsAsync(
                EnsureAuthenticatedTeacher(),
                classId,
                assessmentId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("offline-submissions/{submissionId:guid}")]
        [ProducesResponseType(typeof(AssessmentScanSubmissionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentScanSubmissionDto>> GetSubmission(
            Guid classId,
            Guid assessmentId,
            Guid submissionId,
            CancellationToken cancellationToken)
        {
            var response = await _offlineAssessmentScanService.GetSubmissionAsync(
                EnsureAuthenticatedTeacher(),
                classId,
                assessmentId,
                submissionId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("offline-submissions/{submissionId:guid}/review")]
        [ProducesResponseType(typeof(AssessmentScanSubmissionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentScanSubmissionDto>> ReviewSubmission(
            Guid classId,
            Guid assessmentId,
            Guid submissionId,
            [FromBody] ReviewOfflineAssessmentScanRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _offlineAssessmentScanService.ReviewSubmissionAsync(
                EnsureAuthenticatedTeacher(),
                classId,
                assessmentId,
                submissionId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("offline-submissions/{submissionId:guid}/finalize")]
        [ProducesResponseType(typeof(AssessmentScanSubmissionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentScanSubmissionDto>> FinalizeSubmission(
            Guid classId,
            Guid assessmentId,
            Guid submissionId,
            CancellationToken cancellationToken)
        {
            var response = await _offlineAssessmentScanService.FinalizeSubmissionAsync(
                EnsureAuthenticatedTeacher(),
                classId,
                assessmentId,
                submissionId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("offline-submissions/{submissionId:guid}/artifacts/{artifactId:guid}")]
        public async Task<IActionResult> DownloadArtifact(
            Guid classId,
            Guid assessmentId,
            Guid submissionId,
            Guid artifactId,
            CancellationToken cancellationToken)
        {
            var artifact = await _offlineAssessmentScanService.GetArtifactAsync(
                EnsureAuthenticatedTeacher(),
                classId,
                assessmentId,
                submissionId,
                artifactId,
                cancellationToken);

            return File(artifact.Content, artifact.ContentType, artifact.FileName);
        }

        private string EnsureAuthenticatedStudent()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            if (!_currentUserService.IsInRole(IdentityRoles.Student))
            {
                throw new ForbiddenException("Student role is required.");
            }

            return _currentUserService.UserId;
        }

        private string EnsureAuthenticatedTeacher()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            if (!_currentUserService.IsInRole(IdentityRoles.Teacher))
            {
                throw new ForbiddenException("Teacher role is required.");
            }

            return _currentUserService.UserId;
        }
    }
}
