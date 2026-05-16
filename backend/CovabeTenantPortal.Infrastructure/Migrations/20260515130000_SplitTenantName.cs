using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CovabeTenantPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SplitTenantName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenantFirstName",
                table: "UnitAssignments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenantLastName",
                table: "UnitAssignments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE [UnitAssignments]
                SET [TenantFirstName] = CASE
                        WHEN CHARINDEX(' ', [TenantName]) > 0
                            THEN LEFT([TenantName], CHARINDEX(' ', [TenantName]) - 1)
                        ELSE [TenantName]
                    END,
                    [TenantLastName] = CASE
                        WHEN CHARINDEX(' ', [TenantName]) > 0
                            THEN LTRIM(SUBSTRING([TenantName], CHARINDEX(' ', [TenantName]) + 1, LEN([TenantName])))
                        ELSE ''
                    END
                WHERE [TenantName] IS NOT NULL;
            ");

            migrationBuilder.DropColumn(
                name: "TenantName",
                table: "UnitAssignments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenantName",
                table: "UnitAssignments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE [UnitAssignments]
                SET [TenantName] = LTRIM(RTRIM([TenantFirstName] + ' ' + [TenantLastName]));
            ");

            migrationBuilder.DropColumn(
                name: "TenantFirstName",
                table: "UnitAssignments");

            migrationBuilder.DropColumn(
                name: "TenantLastName",
                table: "UnitAssignments");
        }
    }
}
