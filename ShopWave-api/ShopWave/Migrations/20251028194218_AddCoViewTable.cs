using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopWave.Migrations
{
    /// <inheritdoc />
    public partial class AddCoViewTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoViews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductAId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductBId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CoCount = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoViews_Products_ProductAId",
                        column: x => x.ProductAId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoViews_Products_ProductBId",
                        column: x => x.ProductBId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CoViews_ProductAId",
                table: "CoViews",
                column: "ProductAId");

            migrationBuilder.CreateIndex(
                name: "IX_CoViews_ProductBId",
                table: "CoViews",
                column: "ProductBId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoViews");
        }
    }
}
