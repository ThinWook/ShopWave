using System.ComponentModel.DataAnnotations;

namespace ShopWave.Models.DTOs
{
    /// <summary>
    /// DTO for creating a new transaction
    /// </summary>
    public class CreateTransactionRequest
    {
        [Required]
        public Guid OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Gateway { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [MaxLength(255)]
        public string? GatewayTransactionId { get; set; }

        [MaxLength(50)]
        public string TransactionType { get; set; } = "PAYMENT";

        public string? GatewayResponse { get; set; }
    }

    /// <summary>
    /// DTO for updating transaction status
    /// </summary>
    public class UpdateTransactionStatusRequest
    {
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? GatewayTransactionId { get; set; }

        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }

        public string? GatewayResponse { get; set; }
    }

    /// <summary>
    /// DTO for transaction response
    /// </summary>
    public class TransactionDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string Gateway { get; set; } = string.Empty;
        public string? GatewayTransactionId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    /// <summary>
    /// DTO for detailed transaction view (with gateway response)
    /// </summary>
    public class TransactionDetailDto : TransactionDto
    {
        public string? GatewayResponse { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? OrderNumber { get; set; }
    }

    /// <summary>
    /// DTO for VNPay payment callback
    /// </summary>
    public class VNPayCallbackDto
    {
        public string vnp_TxnRef { get; set; } = string.Empty;  // Order Number
        public string vnp_TransactionNo { get; set; } = string.Empty;  // VNPay Transaction ID
        public string vnp_ResponseCode { get; set; } = string.Empty;  // Response code
        public string vnp_Amount { get; set; } = string.Empty;  // Amount (in cents)
        public string vnp_BankCode { get; set; } = string.Empty;
        public string vnp_TransactionStatus { get; set; } = string.Empty;
        public string vnp_SecureHash { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for MoMo payment callback
    /// </summary>
    public class MoMoCallbackDto
    {
        public string orderId { get; set; } = string.Empty;
        public string requestId { get; set; } = string.Empty;
        public long amount { get; set; }
        public string orderInfo { get; set; } = string.Empty;
        public string transId { get; set; } = string.Empty;
        public int resultCode { get; set; }
        public string message { get; set; } = string.Empty;
        public string payType { get; set; } = string.Empty;
        public string signature { get; set; } = string.Empty;
    }
}
