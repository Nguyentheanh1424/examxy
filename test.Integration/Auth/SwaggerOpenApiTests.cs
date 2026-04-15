using System.Net;
using System.Text.Json;

namespace test.Integration.Auth
{
    public sealed class SwaggerOpenApiTests : IClassFixture<AuthApiFactory>
    {
        private readonly HttpClient _client;

        public SwaggerOpenApiTests(AuthApiFactory factory)
        {
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task SwaggerJson_DescribesPublicAndInternalApis()
        {
            var response = await _client.GetAsync("/swagger/v1/swagger.json");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);

            var root = document.RootElement;
            var bearer = root
                .GetProperty("components")
                .GetProperty("securitySchemes")
                .GetProperty("Bearer");
            Assert.Equal("http", bearer.GetProperty("type").GetString());
            Assert.Equal("bearer", bearer.GetProperty("scheme").GetString());

            var registerPost = root
                .GetProperty("paths")
                .GetProperty("/api/Auth/register")
                .GetProperty("post");
            Assert.Equal("Authentication", registerPost.GetProperty("tags")[0].GetString());
            Assert.Contains("Register a new teacher account", registerPost.GetProperty("summary").GetString());

            var teacherClassesGet = root
                .GetProperty("paths")
                .GetProperty("/api/classes")
                .GetProperty("get");
            Assert.Equal("Teacher Classes", teacherClassesGet.GetProperty("tags")[0].GetString());
            Assert.True(teacherClassesGet.GetProperty("security").GetArrayLength() > 0);

            var classFeedGet = root
                .GetProperty("paths")
                .GetProperty("/api/classes/{classId}/feed")
                .GetProperty("get");
            Assert.Equal("Class Content", classFeedGet.GetProperty("tags")[0].GetString());

            var reactionPut = root
                .GetProperty("paths")
                .GetProperty("/api/classes/{classId}/posts/{postId}/reaction")
                .GetProperty("put");
            Assert.Equal("Class Content", reactionPut.GetProperty("tags")[0].GetString());

            var assessmentsGet = root
                .GetProperty("paths")
                .GetProperty("/api/classes/{classId}/assessments")
                .GetProperty("get");
            Assert.Equal("Class Assessments", assessmentsGet.GetProperty("tags")[0].GetString());

            var createPostSchemaProperties = root
                .GetProperty("components")
                .GetProperty("schemas")
                .GetProperty("CreateClassPostRequestDto")
                .GetProperty("properties");
            Assert.True(createPostSchemaProperties.TryGetProperty("notifyAll", out _));
            Assert.True(createPostSchemaProperties.TryGetProperty("taggedUserIds", out _));

            var setReactionSchemaProperties = root
                .GetProperty("components")
                .GetProperty("schemas")
                .GetProperty("SetReactionRequestDto")
                .GetProperty("properties");
            Assert.True(setReactionSchemaProperties.TryGetProperty("reactionType", out _));

            var internalAdminPost = root
                .GetProperty("paths")
                .GetProperty("/internal/admin-users")
                .GetProperty("post");
            Assert.Equal(
                "Internal Admin Provisioning",
                internalAdminPost.GetProperty("tags")[0].GetString());
            Assert.Contains("administrator account", internalAdminPost.GetProperty("summary").GetString());

            var internalHeader = internalAdminPost
                .GetProperty("parameters")
                .EnumerateArray()
                .Single(parameter => parameter.GetProperty("name").GetString() == "X-Examxy-Internal-Admin-Secret");
            Assert.Equal("header", internalHeader.GetProperty("in").GetString());
            Assert.True(internalHeader.GetProperty("required").GetBoolean());

            var internalTestDataPost = root
                .GetProperty("paths")
                .GetProperty("/internal/test-data/class-dashboard-v1-seed")
                .GetProperty("post");
            Assert.Equal(
                "InternalTestData",
                internalTestDataPost.GetProperty("tags")[0].GetString());

            var internalTestDataHeader = internalTestDataPost
                .GetProperty("parameters")
                .EnumerateArray()
                .Single(parameter => parameter.GetProperty("name").GetString() == "X-Examxy-Internal-Test-Data-Secret");
            Assert.Equal("header", internalTestDataHeader.GetProperty("in").GetString());
            Assert.True(internalTestDataHeader.GetProperty("required").GetBoolean());
        }
    }
}
