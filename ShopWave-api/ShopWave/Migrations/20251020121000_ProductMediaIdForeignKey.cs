using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopWave.Migrations
{
    public partial class ProductMediaIdForeignKey : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Products_MediaId",
                table: "Products",
                column: "MediaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Media_MediaId",
                table: "Products",
                column: "MediaId",
                principalTable: "Media",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Media_MediaId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_MediaId",
                table: "Products");
        }
    }
}
