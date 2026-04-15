using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Features.TestData.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace test.Integration.Auth
{
    public sealed class InternalTestDataApiTests : IClassFixture<AuthApiFactory>
    {
        private const string Endpoint = "/internal/test-data/class-dashboard-v1-seed";
        private const string HeaderName = "X-Examxy-Internal-Test-Data-Secret";
        private const string ValidSecret = "integration-test-data-secret";
        private const string DatasetKey = "class-dashboard-v1";
        private const string TestPassword = "Pass123";
        private const string TeacherEmail = "teacher.classdashboard.v1@examxy.local";
        private const string ClassCode = "CLASSDASHV1";

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public InternalTestDataApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task SeedClassDashboardV1_WithoutSecretHeader_ReturnsForbidden()
        {
            var response = await _client.PostAsJsonAsync(
                Endpoint,
                new SeedClassDashboardTestDataRequestDto
                {
                    DatasetKey = DatasetKey,
                    StudentCount = 30
                });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task SeedClassDashboardV1_WithWrongSecret_ReturnsForbidden()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
            {
                Content = JsonContent.Create(new SeedClassDashboardTestDataRequestDto
                {
                    DatasetKey = DatasetKey,
                    StudentCount = 30
                })
            };
            request.Headers.Add(HeaderName, "wrong-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task SeedClassDashboardV1_FirstRun_CreatesTeacherClassStudentsAndMemberships()
        {
            var payload = await SeedAsync(30);

            Assert.Equal(DatasetKey, payload.DatasetKey);
            Assert.Equal(ClassCode, payload.Class.Code);
            Assert.Equal(30, payload.RequestedStudentCount);
            Assert.Equal(30, payload.SeededStudentCount);
            Assert.Equal(30, payload.Students.Count);

            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var teacher = await userManager.FindByEmailAsync(TeacherEmail);
            Assert.NotNull(teacher);
            Assert.True(teacher!.EmailConfirmed);
            Assert.True(await userManager.CheckPasswordAsync(teacher, TestPassword));

            var teacherRoles = await userManager.GetRolesAsync(teacher);
            Assert.Contains(IdentityRoles.Teacher, teacherRoles);

            var teacherProfile = await dbContext.TeacherProfiles
                .FirstOrDefaultAsync(profile => profile.UserId == teacher.Id);
            Assert.NotNull(teacherProfile);

            var classroom = await dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Code == ClassCode);
            Assert.NotNull(classroom);
            Assert.Equal(teacher.Id, classroom!.OwnerTeacherUserId);

            var studentUserIds = payload.Students
                .Select(student => student.UserId)
                .ToArray();

            var activeProfileCount = await dbContext.StudentProfiles.CountAsync(
                profile =>
                    studentUserIds.Contains(profile.UserId) &&
                    profile.OnboardingState == StudentOnboardingState.Active);
            Assert.Equal(30, activeProfileCount);

            var activeMembershipCount = await dbContext.ClassMemberships.CountAsync(
                membership =>
                    membership.ClassId == classroom.Id &&
                    membership.Status == ClassMembershipStatus.Active);
            Assert.Equal(30, activeMembershipCount);
        }

        [Fact]
        public async Task SeedClassDashboardV1_SecondRun_IsIdempotent()
        {
            await SeedAsync(30);
            var secondRun = await SeedAsync(30);

            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var classCount = await dbContext.Classes.CountAsync(candidate => candidate.Code == ClassCode);
            Assert.Equal(1, classCount);

            var membershipCount = await dbContext.ClassMemberships.CountAsync(
                membership => membership.ClassId == secondRun.Class.ClassId);
            Assert.Equal(30, membershipCount);

            var studentEmails = Enumerable.Range(1, 30)
                .Select(index => $"student{index:D2}.classdashboard.v1@examxy.local")
                .ToArray();

            var studentUsers = await dbContext.Users
                .Where(user => user.Email != null && studentEmails.Contains(user.Email))
                .ToArrayAsync();

            Assert.Equal(30, studentUsers.Length);

            foreach (var student in studentUsers)
            {
                var roles = await userManager.GetRolesAsync(student);
                Assert.Contains(IdentityRoles.Student, roles);
                Assert.True(student.EmailConfirmed);
            }
        }

        [Fact]
        public async Task SeedClassDashboardV1_InProductionEnvironment_ReturnsNotFound()
        {
            using var productionFactory = _factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production"));
            using var productionClient = productionFactory.CreateClient(
                new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
                {
                    BaseAddress = new Uri("https://localhost")
                });

            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
            {
                Content = JsonContent.Create(new SeedClassDashboardTestDataRequestDto
                {
                    DatasetKey = DatasetKey,
                    StudentCount = 30
                })
            };
            request.Headers.Add(HeaderName, ValidSecret);

            var response = await productionClient.SendAsync(request);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        private async Task<SeedClassDashboardTestDataResponseDto> SeedAsync(int studentCount)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
            {
                Content = JsonContent.Create(new SeedClassDashboardTestDataRequestDto
                {
                    DatasetKey = DatasetKey,
                    StudentCount = studentCount
                })
            };
            request.Headers.Add(HeaderName, ValidSecret);

            var response = await _client.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<SeedClassDashboardTestDataResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }
    }
}
