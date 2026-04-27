namespace examxy.Application.Abstractions.Identity
{
    public interface ITokenService
    {
        string GenerateAccessToken(
        string userId,
        string email,
        string userName,
        IEnumerable<string> roles);

        string GenerateRefreshToken();

        DateTime GetAccessTokenExpirationUtc();

        DateTime GetRefreshTokenExpirationUtc();
    }
}
