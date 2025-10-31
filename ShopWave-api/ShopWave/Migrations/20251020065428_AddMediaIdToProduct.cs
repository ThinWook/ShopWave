using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopWave.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaIdToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MetaId",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "MetaId",
                table: "Products",
                newName: "MediaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MediaId",
                table: "Products",
                newName: "MetaId");

            migrationBuilder.AddColumn<long>(
                name: "MetaId",
                table: "Users",
                type: "bigint",
                nullable: true);
        }
    }
}
