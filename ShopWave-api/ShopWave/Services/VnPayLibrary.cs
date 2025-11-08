using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace ShopWave.Services
{
    /// <summary>
    /// VNPay Library for payment integration
    /// Reference: VNPay API Documentation v2.1.0
    /// </summary>
    public class VnPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayCompare());
        private readonly SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayCompare());

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData.Add(key, value);
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var value) ? value : string.Empty;
        }

        /// <summary>
        /// Create payment URL for VNPay gateway
        /// </summary>
        public string CreateRequestUrl(string baseUrl, string vnp_HashSecret)
        {
            StringBuilder data = new StringBuilder();
            foreach (KeyValuePair<string, string> kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            string queryString = data.ToString();

            // Remove trailing '&'
            if (queryString.Length > 0)
            {
                queryString = queryString.Remove(queryString.Length - 1, 1);
            }

            baseUrl += "?" + queryString;
            
            // Create signature (HMAC-SHA512)
            string signData = queryString;
            string vnpSecureHash = HmacSHA512(vnp_HashSecret, signData);
            
            baseUrl += "&vnp_SecureHash=" + vnpSecureHash;

            return baseUrl;
        }

        /// <summary>
        /// Validate VNPay callback signature
        /// </summary>
        public bool ValidateSignature(string inputHash, string secretKey)
        {
            StringBuilder data = new StringBuilder();
            foreach (KeyValuePair<string, string> kv in _responseData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            string queryString = data.ToString();
            
            // Remove trailing '&'
            if (queryString.Length > 0)
            {
                queryString = queryString.Remove(queryString.Length - 1, 1);
            }

            string checkSum = HmacSHA512(secretKey, queryString);
            return checkSum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
        }

        /// <summary>
        /// Get client IP address
        /// </summary>
        public string GetIpAddress(HttpContext context)
        {
            try
            {
                var ipAddress = context.Connection.RemoteIpAddress;
                if (ipAddress != null)
                {
                    if (ipAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
                    {
                        ipAddress = System.Net.Dns.GetHostEntry(ipAddress).AddressList
                            .FirstOrDefault(x => x.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                    }
                    return ipAddress?.ToString() ?? "127.0.0.1";
                }
                return "127.0.0.1";
            }
            catch
            {
                return "127.0.0.1";
            }
        }

        /// <summary>
        /// Compute HMAC-SHA512 hash
        /// </summary>
        private string HmacSHA512(string key, string inputData)
        {
            var hash = new StringBuilder();
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                byte[] hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }
    }

    /// <summary>
    /// Custom comparer for VNPay parameter sorting
    /// </summary>
    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string? x, string? y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}
