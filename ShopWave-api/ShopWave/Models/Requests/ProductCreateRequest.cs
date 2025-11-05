using System.ComponentModel.DataAnnotations;

namespace ShopWave.Models.Requests
{
    public class ProductCreateRequest
    {
        [Required]
        public string Name { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        public Guid CategoryId { get; set; }
        
        public string? Slug { get; set; }
        
        public long? MainImageId { get; set; }
        
        public List<GalleryMediaDto> GalleryMedia { get; set; } = new();
        
        // PH?N M?I: ??nh ngh?a các options (Size, Color, etc.)
        public List<ProductOptionDto> Options { get; set; } = new();
        
        public List<ProductVariantDto> Variants { get; set; } = new();
    }

    public class GalleryMediaDto
    {
        [Required]
        public long MediaId { get; set; }
        
        public int SortOrder { get; set; }
    }

    // DTO cho ??nh ngh?a option (Size, Color)
    public class ProductOptionDto
    {
        [Required]
        public string Name { get; set; }
        
        public string? DisplayType { get; set; } // "text_button", "color_swatch", etc.
        
        [Required]
        public List<OptionValueDto> Values { get; set; } = new();
    }

    // DTO cho giá tr? c?a option (42, 43, Black, White)
    public class OptionValueDto
    {
        [Required]
        public string Value { get; set; }
        
        public long? ThumbnailId { get; set; } // Cho color swatch
    }

    // DTO cho variant
    public class ProductVariantDto
    {
        public string Sku { get; set; }
        
        [Required]
        public decimal Price { get; set; }
        
        [Required]
        public int Stock { get; set; }
        
        public long? ImageId { get; set; }
        
        // PH?N M?I: B?n ?? liên k?t variant v?i các option values
        public List<SelectedOptionDto> SelectedOptions { get; set; } = new();
    }

    // DTO cho selected option c?a variant
    public class SelectedOptionDto
    {
        [Required]
        public string OptionName { get; set; }
        
        [Required]
        public string Value { get; set; }
    }
}
