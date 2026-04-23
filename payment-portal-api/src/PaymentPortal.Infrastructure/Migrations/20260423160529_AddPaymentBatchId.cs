using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentBatchId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BatchId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BatchId",
                table: "Payments",
                column: "BatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_BatchId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "BatchId",
                table: "Payments");
        }
    }
}
