using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCartSavedCardCargoOwnerAndRoleEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Cargo",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Carts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Carts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Carts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavedCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    CardLast4 = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    CardBrand = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CardHolderName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ExpiryMonth = table.Column<int>(type: "int", nullable: false),
                    ExpiryYear = table.Column<int>(type: "int", nullable: false),
                    GatewayToken = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedCards_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CartItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CartId = table.Column<int>(type: "int", nullable: false),
                    AwbNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CartItems_Carts_CartId",
                        column: x => x.CartId,
                        principalTable: "Carts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cargo_CompanyId",
                table: "Cargo",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_AwbNumber",
                table: "CartItems",
                columns: new[] { "CartId", "AwbNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Carts_UserId",
                table: "Carts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedCards_CompanyId",
                table: "SavedCards",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedCards_CompanyId_IsDefault",
                table: "SavedCards",
                columns: new[] { "CompanyId", "IsDefault" },
                unique: true,
                filter: "[IsDefault] = 1");

            migrationBuilder.AddForeignKey(
                name: "FK_Cargo_Companies_CompanyId",
                table: "Cargo",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Backfill Cargo.CompanyId from the earliest Completed Payment.
            // Using MIN(PaymentDate) keeps a single deterministic owner when
            // the same cargo was paid by multiple companies (shouldn't happen
            // in production but defends against test/seed anomalies).
            migrationBuilder.Sql(@"
                UPDATE c
                SET c.CompanyId = p.CompanyId
                FROM Cargo c
                INNER JOIN (
                    SELECT CargoId, CompanyId
                    FROM (
                        SELECT p.CargoId, p.CompanyId,
                               ROW_NUMBER() OVER (PARTITION BY p.CargoId ORDER BY p.PaymentDate ASC) AS rn
                        FROM Payments p
                        WHERE p.CompanyId IS NOT NULL
                    ) ranked
                    WHERE rn = 1
                ) p ON p.CargoId = c.Id
                WHERE c.CompanyId IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cargo_Companies_CompanyId",
                table: "Cargo");

            migrationBuilder.DropTable(
                name: "CartItems");

            migrationBuilder.DropTable(
                name: "SavedCards");

            migrationBuilder.DropTable(
                name: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_Cargo_CompanyId",
                table: "Cargo");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Cargo");
        }
    }
}
