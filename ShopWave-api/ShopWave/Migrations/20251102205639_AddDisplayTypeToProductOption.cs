using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopWaveapi.Migrations
{
    /// <inheritdoc />
    public partial class AddDisplayTypeToProductOption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DisplayType",
                table: "ProductOptions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayType",
                table: "ProductOptions");
        }
    }
}
