using ShopWave.Models;

namespace ShopWave.Services
{
    /// <summary>
    /// Interface for VNPay payment gateway integration
    /// </summary>
    public interface IVnPayService
    {
        /// <summary>
        /// Create payment URL with transaction ID as reference
        /// </summary>
        string CreatePaymentUrl(PaymentInformationModel model, HttpContext context, Guid transactionId);
        
        /// <summary>
        /// Process payment execution from callback
        /// </summary>
        PaymentResponseModel PaymentExecute(IQueryCollection collections);
    }
}
