using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportFileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Reports",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FileSizeBytes",
                table: "Reports",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "FileSizeBytes",
                table: "Reports");
        }
    }
}
