using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShopWave.Models;

namespace ShopWave.Services
{
    public class JwtTokenService
    {
        private readonly IConfiguration _config;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly string _secret;
        private readonly int _accessMinutes;
        private readonly int _refreshDays;
        private readonly int _passwordResetMinutes;
        private readonly SigningCredentials _signingCredentials;
        private readonly TokenValidationParameters _validationParameters;

        public JwtTokenService(IConfiguration config)
        {
            _config = config;
            _issuer = _config["Jwt:Issuer"] ?? "ShopWave";
            _audience = _config["Jwt:Audience"] ?? "ShopWave.Client";
            _secret = _config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is missing");
            _accessMinutes = int.TryParse(_config["Jwt:AccessTokenMinutes"], out var m) ? m : 30;
            _refreshDays = int.TryParse(_config["Jwt:RefreshTokenDays"], out var d) ? d : 30;
            _passwordResetMinutes = int.TryParse(_config["Jwt:PasswordResetMinutes"], out var pr) ? pr : 15;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            _validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        }

        public (string token, DateTime expiresAt) GenerateAccessToken(User user)
        {
            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(_accessMinutes);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(ClaimTypes.Name, user.FullName ?? string.Empty),
                new(ClaimTypes.Role, user.Role ?? "Customer"),
                new("uid", user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: _signingCredentials
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, expires);
        }

        public (string token, DateTime expiresAt) GeneratePasswordResetToken(User user)
        {
            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(_passwordResetMinutes);
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new("uid", user.Id.ToString()),
                new("prp", "pwd_reset")
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: _signingCredentials
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, expires);
        }

        public bool TryValidatePasswordResetToken(string token, out Guid userId)
        {
            userId = Guid.Empty;
            var handler = new JwtSecurityTokenHandler();
            try
            {
                handler.ValidateToken(token, _validationParameters, out var validatedToken);
                var jwt = (JwtSecurityToken)validatedToken;
                if (jwt.Claims.FirstOrDefault(c => c.Type == "prp")?.Value != "pwd_reset") return false;
                var uid = jwt.Claims.FirstOrDefault(c => c.Type == "uid")?.Value;
                if (!Guid.TryParse(uid, out userId)) return false;
                return true;
            }
            catch
            {
                return false;
            }
        }

        public int GetRefreshTokenDays() => _refreshDays;
    }
}
