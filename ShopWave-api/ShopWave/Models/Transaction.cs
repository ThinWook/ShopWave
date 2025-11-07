using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    /// <summary>
    /// Transaction log table - Records all payment attempts for orders
    /// Supports multiple payment gateways (VNPAY, MOMO, COD, etc.)
    /// </summary>
    public class Transaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Reference to the order this transaction belongs to
        /// One order can have multiple transactions (retries, refunds, etc.)
        /// </summary>
        [Required]
        public Guid OrderId { get; set; }

        /// <summary>
        /// Payment gateway used (VNPAY, MOMO, COD, STRIPE, etc.)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Gateway { get; set; } = string.Empty;

        /// <summary>
        /// Transaction ID from the payment gateway (for tracking with provider)
        /// Nullable for COD or pending transactions
        /// </summary>
        [MaxLength(255)]
        public string? GatewayTransactionId { get; set; }

        /// <summary>
        /// Amount for this transaction
        /// May differ from order total (e.g., partial refund)
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Transaction status: PENDING, SUCCESS, FAILED, REFUNDED, CANCELLED
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "PENDING";

        /// <summary>
        /// Transaction type: PAYMENT, REFUND, CHARGEBACK
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string TransactionType { get; set; } = "PAYMENT";

        /// <summary>
        /// Error message if transaction failed
        /// </summary>
        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Additional gateway-specific data (JSON format)
        /// Stores raw response from payment gateway for debugging
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? GatewayResponse { get; set; }

        /// <summary>
        /// IP address of the user initiating the transaction
        /// </summary>
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent of the browser/app
        /// </summary>
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when transaction was completed (success or failed)
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        // Navigation property
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;
    }

    /// <summary>
    /// Transaction status constants
    /// </summary>
    public static class TransactionStatus
    {
        public const string Pending = "PENDING";
        public const string Success = "SUCCESS";
        public const string Failed = "FAILED";
        public const string Refunded = "REFUNDED";
        public const string Cancelled = "CANCELLED";
        public const string Processing = "PROCESSING";
    }

    /// <summary>
    /// Transaction type constants
    /// </summary>
    public static class TransactionType
    {
        public const string Payment = "PAYMENT";
        public const string Refund = "REFUND";
        public const string Chargeback = "CHARGEBACK";
        public const string Adjustment = "ADJUSTMENT";
    }

    /// <summary>
    /// Payment gateway constants
    /// </summary>
    public static class PaymentGateway
    {
        public const string VNPay = "VNPAY";
        public const string MoMo = "MOMO";
        public const string COD = "COD";
        public const string Stripe = "STRIPE";
        public const string PayPal = "PAYPAL";
        public const string BankTransfer = "BANK_TRANSFER";
    }
}
