using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.QuestionBank.DTOs;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace test.Integration.Auth
{
    public sealed class QuestionBankApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public QuestionBankApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _factory.EmailSender.Clear();
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task QuestionBankV2_CreateSearchVersionsPreviewAndExport_WorkEndToEnd()
        {
            var teacher = await RegisterTeacherAsync();

            var createRequest = new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = "SingleChoice",
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                Stem = new RichContentDocumentDto
                {
                    Blocks = new[]
                    {
                        new RichContentBlockDto
                        {
                            Type = "paragraph",
                            Inline = new[]
                            {
                                new InlineNodeDto { Type = "text", Text = "Tính " },
                                new InlineNodeDto { Type = "mathInline", Latex = "x^2" },
                                new InlineNodeDto { Type = "text", Text = " khi x = 3." }
                            }
                        }
                    }
                },
                Choices = new[]
                {
                    new QuestionChoiceRequestDto { Id = "A", Text = "9", IsCorrect = true },
                    new QuestionChoiceRequestDto { Id = "B", Text = "6", IsCorrect = false }
                },
                AnswerKey = new QuestionAnswerKeyRequestDto
                {
                    CorrectChoiceIds = new[] { "A" }
                },
                Tags = new[] { "math", "latex" }
            };

            var question = await SendAsync<QuestionDto>(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacher.AccessToken,
                createRequest);

            Assert.Equal(1, question.CurrentVersionNumber);
            var currentVersion = Assert.Single(question.Versions);
            Assert.Equal(2, currentVersion.ContentSchemaVersion);
            Assert.Equal(2, currentVersion.AnswerKeySchemaVersion);
            Assert.Contains("X^2", currentVersion.SearchText);

            var updateRequest = new UpdateQuestionRequestDto
            {
                AuthoringMode = "Basic",
                QuestionType = "SingleChoice",
                StemText = "Thủ đô của Việt Nam là gì?",
                Choices = new[]
                {
                    new QuestionChoiceRequestDto { Text = "Hà Nội", IsCorrect = true },
                    new QuestionChoiceRequestDto { Text = "Đà Nẵng", IsCorrect = false }
                },
                Difficulty = "Easy",
                EstimatedSeconds = 30,
                Tags = new[] { "geo" },
                Status = "Active"
            };

            var updated = await SendAsync<QuestionDto>(
                HttpMethod.Put,
                $"/api/question-bank/questions/{question.Id}",
                teacher.AccessToken,
                updateRequest);

            Assert.Equal(2, updated.CurrentVersionNumber);
            Assert.Equal(2, updated.Versions.Count);

            var versions = await SendAsync<IReadOnlyCollection<QuestionVersionDto>>(
                HttpMethod.Get,
                $"/api/question-bank/questions/{question.Id}/versions",
                teacher.AccessToken);

            Assert.Equal(2, versions.Count);

            var search = await SendAsync<QuestionBankPagedResultDto>(
                HttpMethod.Get,
                "/api/question-bank/questions/search?query=việt&page=1&pageSize=10",
                teacher.AccessToken);

            Assert.Equal(1, search.TotalCount);
            Assert.Contains("geo", search.Facets.Tags);

            var preview = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacher.AccessToken,
                new PreviewLatexRequestDto
                {
                    Question = createRequest,
                    IncludeAnswers = true
                });

            Assert.Contains("\\question", preview.LatexFragment);
            Assert.Equal(preview.LatexFragment, preview.Latex);
            Assert.Empty(preview.Errors);
            Assert.Contains("\\CorrectChoice", preview.LatexFragment);
            Assert.Contains("\\(x^2\\)", preview.LatexFragment);
            Assert.Contains("Tính", preview.LatexFragment);

            var export = await SendAsync<QuestionBankExportJobDto>(
                HttpMethod.Post,
                "/api/question-bank/exports/pdf",
                teacher.AccessToken,
                new CreateQuestionBankExportRequestDto
                {
                    Title = "Đề kiểm tra",
                    QuestionVersionIds = new[] { updated.Versions.First().Id },
                    Options = new QuestionBankExportOptionsDto
                    {
                        IncludeAnswers = true
                    }
                });

            Assert.Equal("Queued", export.Status);
            Assert.Null(export.LatexFileId);

            QuestionBankExportJobDto completed;
            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<IQuestionBankExportProcessor>();
                completed = await processor.ProcessJobAsync(export.ExportJobId);
            }

            Assert.Equal("Completed", completed.Status);
            Assert.NotNull(completed.LatexFileId);
            Assert.NotNull(completed.PdfFileId);
            Assert.NotNull(completed.CompileLogFileId);
            Assert.NotEmpty(completed.DownloadUrl);

            using var downloadRequest = new HttpRequestMessage(
                HttpMethod.Get,
                $"/api/question-bank/exports/{completed.ExportJobId}/files/{completed.PdfFileId}/download");
            downloadRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacher.AccessToken);
            var downloadResponse = await _client.SendAsync(downloadRequest);
            downloadResponse.EnsureSuccessStatusCode();
            Assert.Equal(new byte[] { 37, 80, 68, 70 }, await downloadResponse.Content.ReadAsByteArrayAsync());
        }

        [Fact]
        public async Task QuestionBankV2_LegacyContent_RemainsBackwardCompatible()
        {
            var teacher = await RegisterTeacherAsync();

            var question = await SendAsync<QuestionDto>(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacher.AccessToken,
                new CreateQuestionRequestDto
                {
                    QuestionType = "SingleChoice",
                    StemPlainText = "Legacy stem",
                    StemRichText = "<p>Legacy stem</p>",
                    ContentJson = "{\"choices\":[\"A\",\"B\"]}",
                    AnswerKeyJson = "\"A\"",
                    Difficulty = "Medium",
                    EstimatedSeconds = 45,
                    Tags = new[] { "legacy" }
                });

            var version = Assert.Single(question.Versions);
            Assert.Equal(1, version.ContentSchemaVersion);
            Assert.Equal(1, version.AnswerKeySchemaVersion);
            Assert.Equal("legacy-v1", version.RendererVersion);
            Assert.Equal("Legacy stem", version.StemPlainText);
        }

        [Fact]
        public async Task QuestionBankV2_UnsafeMathLatex_ReturnsQuestionBankErrorCode()
        {
            var teacher = await RegisterTeacherAsync();

            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/question-bank/questions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacher.AccessToken);
            request.Content = JsonContent.Create(new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = "SingleChoice",
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                Stem = new RichContentDocumentDto
                {
                    Blocks = new[]
                    {
                        new RichContentBlockDto
                        {
                            Type = "paragraph",
                            Inline = new[]
                            {
                                new InlineNodeDto { Type = "text", Text = "Unsafe math " },
                                new InlineNodeDto { Type = "mathInline", Latex = "\\input{secret}" }
                            }
                        }
                    }
                },
                Choices = new[]
                {
                    new QuestionChoiceRequestDto { Id = "A", Text = "A", IsCorrect = true },
                    new QuestionChoiceRequestDto { Id = "B", Text = "B", IsCorrect = false }
                },
                AnswerKey = new QuestionAnswerKeyRequestDto
                {
                    CorrectChoiceIds = new[] { "A" }
                }
            });

            var response = await _client.SendAsync(request);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var errorDocument = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("question_bank_content_invalid", errorDocument.RootElement.GetProperty("code").GetString());
            Assert.True(errorDocument.RootElement.TryGetProperty("errors", out var errors));
            Assert.True(errors.TryGetProperty("contentJson", out _));
        }

        [Fact]
        public async Task QuestionBankPreviewLatex_HardensEscapingAndMathDiagnostics()
        {
            var teacher = await RegisterTeacherAsync();

            var escaped = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacher.AccessToken,
                new PreviewLatexRequestDto
                {
                    Question = new CreateQuestionRequestDto
                    {
                        AuthoringMode = "Rich",
                        QuestionType = "SingleChoice",
                        Difficulty = "Medium",
                        EstimatedSeconds = 60,
                        Stem = new RichContentDocumentDto
                        {
                            Blocks = new[]
                            {
                                new RichContentBlockDto
                                {
                                    Type = "paragraph",
                                    Inline = new[]
                                    {
                                        new InlineNodeDto { Type = "text", Text = "50%_&$#{}~^\\" }
                                    }
                                }
                            }
                        },
                        Choices = new[]
                        {
                            new QuestionChoiceRequestDto { Id = "A", Text = "A&B", IsCorrect = true },
                            new QuestionChoiceRequestDto { Id = "B", Text = "B_2", IsCorrect = false }
                        },
                        AnswerKey = new QuestionAnswerKeyRequestDto
                        {
                            CorrectChoiceIds = new[] { "A" }
                        }
                    },
                    IncludeAnswers = true
                });

            Assert.Empty(escaped.Errors);
            Assert.Contains("50\\%\\_\\&\\$\\#\\{\\}\\textasciitilde{}\\textasciicircum{}\\textbackslash{}", escaped.Latex);
            Assert.Contains("A\\&B", escaped.Latex);
            Assert.Contains("B\\_2", escaped.Latex);

            var unsafeMath = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacher.AccessToken,
                new PreviewLatexRequestDto
                {
                    Question = new CreateQuestionRequestDto
                    {
                        AuthoringMode = "Rich",
                        QuestionType = "SingleChoice",
                        Difficulty = "Medium",
                        EstimatedSeconds = 60,
                        Stem = new RichContentDocumentDto
                        {
                            Blocks = new[]
                            {
                                new RichContentBlockDto
                                {
                                    Type = "paragraph",
                                    Inline = new[]
                                    {
                                        new InlineNodeDto { Type = "text", Text = "Unsafe " },
                                        new InlineNodeDto { Type = "mathInline", Latex = "\\input{secret}" }
                                    }
                                }
                            }
                        },
                        Choices = new[]
                        {
                            new QuestionChoiceRequestDto { Id = "A", Text = "A", IsCorrect = true },
                            new QuestionChoiceRequestDto { Id = "B", Text = "B", IsCorrect = false }
                        },
                        AnswerKey = new QuestionAnswerKeyRequestDto
                        {
                            CorrectChoiceIds = new[] { "A" }
                        }
                    }
                });

            var error = Assert.Single(unsafeMath.Errors);
            Assert.Equal("QuestionContentInvalid", error.Code);
            Assert.Equal("contentJson", error.Path);
        }

        [Fact]
        public async Task QuestionBankPreviewLatex_ReportsImageAttachmentDiagnostics()
        {
            var teacherA = await RegisterTeacherAsync();
            var teacherB = await RegisterTeacherAsync();
            var imageBytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };

            var pending = await SendAsync<CreateQuestionBankAttachmentUploadUrlResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/upload-url",
                teacherA.AccessToken,
                new CreateQuestionBankAttachmentUploadUrlRequestDto
                {
                    FileName = "graph.png",
                    ContentType = "image/png",
                    FileSizeBytes = imageBytes.Length
                });

            var pendingPreview = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacherA.AccessToken,
                new PreviewLatexRequestDto { Question = CreateImageQuestionRequest(pending.AttachmentId) });
            Assert.Contains(pendingPreview.Errors, error => error.Code == "AttachmentPendingUpload");

            await SendAsync<QuestionAttachmentDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/complete",
                teacherA.AccessToken,
                new CompleteQuestionBankAttachmentUploadRequestDto
                {
                    AttachmentId = pending.AttachmentId,
                    Base64Content = Convert.ToBase64String(imageBytes)
                });

            var ownerPreview = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacherA.AccessToken,
                new PreviewLatexRequestDto { Question = CreateImageQuestionRequest(pending.AttachmentId) });
            Assert.Empty(ownerPreview.Errors);
            Assert.Contains($"attachments/{pending.AttachmentId}.png", ownerPreview.Latex);

            var crossOwnerPreview = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacherB.AccessToken,
                new PreviewLatexRequestDto { Question = CreateImageQuestionRequest(pending.AttachmentId) });
            Assert.Contains(crossOwnerPreview.Errors, error => error.Code == "AttachmentNotFound");

            using var deleteRequest = new HttpRequestMessage(
                HttpMethod.Delete,
                $"/api/question-bank/attachments/{pending.AttachmentId}");
            deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherA.AccessToken);
            var deleteResponse = await _client.SendAsync(deleteRequest);
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            var deletedPreview = await SendAsync<PreviewLatexResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/preview/latex",
                teacherA.AccessToken,
                new PreviewLatexRequestDto { Question = CreateImageQuestionRequest(pending.AttachmentId) });
            Assert.Contains(deletedPreview.Errors, error => error.Code == "AttachmentDeleted");
        }

        [Fact]
        public async Task QuestionBankPdfExport_ProcessAndDownload_EnforcesOwnership()
        {
            var teacherA = await RegisterTeacherAsync();
            var teacherB = await RegisterTeacherAsync();

            var question = await SendAsync<QuestionDto>(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacherA.AccessToken,
                new CreateQuestionRequestDto
                {
                    AuthoringMode = "Basic",
                    QuestionType = "SingleChoice",
                    StemText = "Export ownership question",
                    Choices = new[]
                    {
                        new QuestionChoiceRequestDto { Text = "A", IsCorrect = true },
                        new QuestionChoiceRequestDto { Text = "B", IsCorrect = false }
                    },
                    AnswerKey = new QuestionAnswerKeyRequestDto
                    {
                        CorrectChoiceIds = new[] { "A" }
                    }
                });

            var export = await SendAsync<QuestionBankExportJobDto>(
                HttpMethod.Post,
                "/api/question-bank/exports/pdf",
                teacherA.AccessToken,
                new CreateQuestionBankExportRequestDto
                {
                    Title = "Ownership export",
                    QuestionVersionIds = new[] { question.Versions.First().Id }
                });

            QuestionBankExportJobDto completed;
            using (var scope = _factory.Services.CreateScope())
            {
                completed = await scope.ServiceProvider
                    .GetRequiredService<IQuestionBankExportProcessor>()
                    .ProcessJobAsync(export.ExportJobId);
            }

            Assert.Equal("Completed", completed.Status);
            Assert.NotNull(completed.PdfFileId);

            await AssertStatusAsync(
                HttpMethod.Get,
                $"/api/question-bank/exports/{completed.ExportJobId}",
                teacherB.AccessToken,
                HttpStatusCode.NotFound);
            await AssertStatusAsync(
                HttpMethod.Get,
                $"/api/question-bank/exports/{completed.ExportJobId}/files/{completed.PdfFileId}/download",
                teacherB.AccessToken,
                HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task QuestionBankPdfExport_RenderDiagnostics_FailsJobWithoutPdf()
        {
            var teacher = await RegisterTeacherAsync();
            var imageBytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };

            var upload = await SendAsync<CreateQuestionBankAttachmentUploadUrlResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/upload-url",
                teacher.AccessToken,
                new CreateQuestionBankAttachmentUploadUrlRequestDto
                {
                    FileName = "deleted.png",
                    ContentType = "image/png",
                    FileSizeBytes = imageBytes.Length
                });

            await SendAsync<QuestionAttachmentDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/complete",
                teacher.AccessToken,
                new CompleteQuestionBankAttachmentUploadRequestDto
                {
                    AttachmentId = upload.AttachmentId,
                    Base64Content = Convert.ToBase64String(imageBytes)
                });

            var question = await SendAsync<QuestionDto>(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacher.AccessToken,
                CreateImageQuestionRequest(upload.AttachmentId));

            using var deleteRequest = new HttpRequestMessage(
                HttpMethod.Delete,
                $"/api/question-bank/attachments/{upload.AttachmentId}");
            deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacher.AccessToken);
            var deleteResponse = await _client.SendAsync(deleteRequest);
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            var export = await SendAsync<QuestionBankExportJobDto>(
                HttpMethod.Post,
                "/api/question-bank/exports/pdf",
                teacher.AccessToken,
                new CreateQuestionBankExportRequestDto
                {
                    Title = "Broken export",
                    QuestionVersionIds = new[] { question.Versions.First().Id }
                });

            QuestionBankExportJobDto failed;
            using (var scope = _factory.Services.CreateScope())
            {
                failed = await scope.ServiceProvider
                    .GetRequiredService<IQuestionBankExportProcessor>()
                    .ProcessJobAsync(export.ExportJobId);
            }

            Assert.Equal("Failed", failed.Status);
            Assert.Null(failed.PdfFileId);
            Assert.NotNull(failed.LatexFileId);
            Assert.NotNull(failed.CompileLogFileId);
            Assert.Contains(failed.Errors, error => error.Code == "AttachmentDeleted");
        }

        [Fact]
        public async Task QuestionBankAttachments_UploadDownloadDelete_EnforcesTeacherOwnership()
        {
            var teacherA = await RegisterTeacherAsync();
            var teacherB = await RegisterTeacherAsync();
            var imageBytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };

            var upload = await SendAsync<CreateQuestionBankAttachmentUploadUrlResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/upload-url",
                teacherA.AccessToken,
                new CreateQuestionBankAttachmentUploadUrlRequestDto
                {
                    FileName = "graph.png",
                    ContentType = "image/png",
                    FileSizeBytes = imageBytes.Length
                });

            Assert.Equal("PendingUpload", upload.Attachment.Status);

            var completed = await SendAsync<QuestionAttachmentDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/complete",
                teacherA.AccessToken,
                new CompleteQuestionBankAttachmentUploadRequestDto
                {
                    AttachmentId = upload.AttachmentId,
                    Base64Content = Convert.ToBase64String(imageBytes)
                });

            Assert.Equal("Uploaded", completed.Status);
            Assert.Equal("Local", completed.StorageProvider);
            Assert.False(string.IsNullOrWhiteSpace(completed.StorageKey));

            var metadata = await SendAsync<QuestionAttachmentDto>(
                HttpMethod.Get,
                $"/api/question-bank/attachments/{upload.AttachmentId}",
                teacherA.AccessToken);

            Assert.Equal(upload.AttachmentId, metadata.Id);

            using var downloadRequest = new HttpRequestMessage(
                HttpMethod.Get,
                $"/api/question-bank/attachments/{upload.AttachmentId}/download");
            downloadRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherA.AccessToken);
            var downloadResponse = await _client.SendAsync(downloadRequest);
            downloadResponse.EnsureSuccessStatusCode();
            Assert.Equal(imageBytes, await downloadResponse.Content.ReadAsByteArrayAsync());

            await AssertStatusAsync(
                HttpMethod.Get,
                $"/api/question-bank/attachments/{upload.AttachmentId}",
                teacherB.AccessToken,
                HttpStatusCode.NotFound);
            await AssertStatusAsync(
                HttpMethod.Get,
                $"/api/question-bank/attachments/{upload.AttachmentId}/download",
                teacherB.AccessToken,
                HttpStatusCode.NotFound);
            await AssertStatusAsync(
                HttpMethod.Delete,
                $"/api/question-bank/attachments/{upload.AttachmentId}",
                teacherB.AccessToken,
                HttpStatusCode.NotFound);

            using var deleteRequest = new HttpRequestMessage(
                HttpMethod.Delete,
                $"/api/question-bank/attachments/{upload.AttachmentId}");
            deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherA.AccessToken);
            var deleteResponse = await _client.SendAsync(deleteRequest);
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            await AssertStatusAsync(
                HttpMethod.Get,
                $"/api/question-bank/attachments/{upload.AttachmentId}",
                teacherA.AccessToken,
                HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task QuestionBankAttachments_QuestionReference_RequiresUploadedOwnerAttachment()
        {
            var teacherA = await RegisterTeacherAsync();
            var teacherB = await RegisterTeacherAsync();
            var imageBytes = new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 };

            var pending = await SendAsync<CreateQuestionBankAttachmentUploadUrlResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/upload-url",
                teacherA.AccessToken,
                new CreateQuestionBankAttachmentUploadUrlRequestDto
                {
                    FileName = "pending.png",
                    ContentType = "image/png",
                    FileSizeBytes = imageBytes.Length
                });

            var pendingQuestion = CreateImageQuestionRequest(pending.AttachmentId);
            var pendingResponse = await SendRawAsync(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacherA.AccessToken,
                pendingQuestion);
            Assert.Equal(HttpStatusCode.BadRequest, pendingResponse.StatusCode);
            Assert.Contains("PendingUpload", await pendingResponse.Content.ReadAsStringAsync());

            await SendAsync<QuestionAttachmentDto>(
                HttpMethod.Post,
                "/api/question-bank/attachments/complete",
                teacherA.AccessToken,
                new CompleteQuestionBankAttachmentUploadRequestDto
                {
                    AttachmentId = pending.AttachmentId,
                    Base64Content = Convert.ToBase64String(imageBytes)
                });

            var crossOwnerResponse = await SendRawAsync(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacherB.AccessToken,
                pendingQuestion);
            Assert.Equal(HttpStatusCode.BadRequest, crossOwnerResponse.StatusCode);

            var question = await SendAsync<QuestionDto>(
                HttpMethod.Post,
                "/api/question-bank/questions",
                teacherA.AccessToken,
                pendingQuestion);

            var currentVersion = Assert.Single(question.Versions);
            var attached = Assert.Single(currentVersion.Attachments);
            Assert.Equal(pending.AttachmentId, attached.Id);
            Assert.Equal("Attached", attached.Status);
            Assert.Contains(pending.AttachmentId.ToString(), currentVersion.ContentJson);
        }

        [Fact]
        public async Task QuestionBankImportPreview_ParsesSingleQuestionWithoutSaving()
        {
            var teacher = await RegisterTeacherAsync();

            var preview = await SendAsync<PreviewQuestionImportResponseDto>(
                HttpMethod.Post,
                "/api/question-bank/questions/import/preview",
                teacher.AccessToken,
                new PreviewQuestionImportRequestDto
                {
                    QuestionType = "SingleChoice",
                    SourceFormat = "LatexText",
                    RawText = "Câu 1. Tính \\(1+1\\)?\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: B\nLời giải: 1+1=2"
                });

            Assert.Equal("Parsed", preview.Status);
            Assert.Equal("SingleChoice", preview.QuestionType);
            Assert.Equal("Rich", preview.Draft.AuthoringMode);
            Assert.Equal("SingleChoice", preview.Draft.QuestionType);
            Assert.Equal("Tính ?", preview.Draft.StemPlainText);
            Assert.Equal(new[] { "B" }, preview.Draft.AnswerKey!.CorrectChoiceIds);
            Assert.Contains("\"id\":\"B\"", preview.Draft.ContentJson);
            Assert.Contains("\"correctChoiceIds\":[\"B\"]", preview.Draft.AnswerKeyJson);
            Assert.Empty(preview.Errors);

            var questions = await SendAsync<IReadOnlyCollection<QuestionDto>>(
                HttpMethod.Get,
                "/api/question-bank/questions",
                teacher.AccessToken);
            Assert.Empty(questions);
        }

        private async Task<AuthResponseDto> RegisterTeacherAsync()
        {
            var suffix = Guid.NewGuid().ToString("N");
            var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
            {
                FullName = "Question Bank Teacher",
                UserName = $"qb-{suffix}",
                Email = $"qb-{suffix}@teacher.test",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            });
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<T> SendAsync<T>(
            HttpMethod method,
            string uri,
            string accessToken,
            object? body = null)
        {
            using var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }

            var response = await _client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException(
                    $"Expected success but received {(int)response.StatusCode} {response.StatusCode}: {errorBody}");
            }

            var payload = await response.Content.ReadFromJsonAsync<T>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<HttpResponseMessage> SendRawAsync(
            HttpMethod method,
            string uri,
            string accessToken,
            object? body = null)
        {
            using var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }

            return await _client.SendAsync(request);
        }

        private async Task AssertStatusAsync(
            HttpMethod method,
            string uri,
            string accessToken,
            HttpStatusCode expectedStatusCode)
        {
            using var response = await SendRawAsync(method, uri, accessToken);
            Assert.Equal(expectedStatusCode, response.StatusCode);
        }

        private static CreateQuestionRequestDto CreateImageQuestionRequest(Guid attachmentId)
        {
            return new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = "SingleChoice",
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                Stem = new RichContentDocumentDto
                {
                    Blocks = new RichContentBlockDto[]
                    {
                        new()
                        {
                            Type = "paragraph",
                            Inline = new[]
                            {
                                new InlineNodeDto { Type = "text", Text = "Use the image." }
                            }
                        },
                        new()
                        {
                            Type = "image",
                            AttachmentId = attachmentId,
                            AltText = "Graph",
                            Caption = "Reference graph"
                        }
                    }
                },
                Choices = new[]
                {
                    new QuestionChoiceRequestDto { Id = "A", Text = "A", IsCorrect = true },
                    new QuestionChoiceRequestDto { Id = "B", Text = "B", IsCorrect = false }
                },
                AnswerKey = new QuestionAnswerKeyRequestDto
                {
                    CorrectChoiceIds = new[] { "A" }
                }
            };
        }
    }
}
