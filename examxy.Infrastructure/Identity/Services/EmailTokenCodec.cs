using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace examxy.Infrastructure.Identity.Services
{
    internal static class EmailTokenCodec
    {
        public static string Encode(string token)
        {
            return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        }

        public static string Decode(string encodedToken)
        {
            var bytes = WebEncoders.Base64UrlDecode(encodedToken);
            return Encoding.UTF8.GetString(bytes);
        }
    }
}
