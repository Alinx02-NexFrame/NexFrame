using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeUserCompanyIdRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Backfill: every User must belong to a Company. Seed a dedicated
            // "GHA Headquarters" row if missing, then point any pre-existing
            // GhaAdmin rows (legacy CompanyId NULL) at it before the ALTER.
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM [Companies] WHERE [Name] = N'GHA Headquarters')
BEGIN
    INSERT INTO [Companies] ([Name], [Email], [TaxId], [AccountCredit], [CreatedAt])
    VALUES (N'GHA Headquarters', N'admin@gha.com', N'00-0000000', 0, SYSUTCDATETIME());
END;

UPDATE [Users]
SET [CompanyId] = (SELECT TOP 1 [Id] FROM [Companies] WHERE [Name] = N'GHA Headquarters')
WHERE [CompanyId] IS NULL;
");

            migrationBuilder.AlterColumn<int>(
                name: "CompanyId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CompanyId",
                table: "Users",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
