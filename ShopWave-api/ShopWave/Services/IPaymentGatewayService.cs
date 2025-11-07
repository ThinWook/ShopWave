using ShopWave.Models;

namespace ShopWave.Services
{
    /// <summary>
    /// Interface cho các d?ch v? c?ng thanh toán (VNPay, MoMo)
    /// </summary>
    public interface IPaymentGatewayService
    {
        /// <summary>
        /// T?o URL thanh toán cho c?ng thanh toán
        /// </summary>
        Task<string> CreatePaymentUrl(string gateway, Order order, Guid transactionId, string returnUrl);

        /// <summary>
        /// Xác th?c ch? ký t? VNPay
        /// </summary>
        bool ValidateVnpaySignature(Dictionary<string, string> queryParams);

        /// <summary>
        /// Xác th?c ch? ký t? MoMo
        /// </summary>
        bool ValidateMomoSignature(object payload);
    }
}
