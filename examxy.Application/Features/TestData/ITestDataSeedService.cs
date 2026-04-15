using examxy.Application.Features.TestData.DTOs;

namespace examxy.Application.Features.TestData
{
    public interface ITestDataSeedService
    {
        Task<SeedClassDashboardTestDataResponseDto> SeedClassDashboardV1Async(
            SeedClassDashboardTestDataRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
