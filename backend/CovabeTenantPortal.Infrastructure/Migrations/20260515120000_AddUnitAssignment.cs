using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CovabeTenantPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UnitAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FloorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TenantName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TenantEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    TenantPhone = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    AssignedById = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitAssignments_Users_AssignedById",
                        column: x => x.AssignedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UnitAssignments_AssignedById",
                table: "UnitAssignments",
                column: "AssignedById");

            migrationBuilder.CreateIndex(
                name: "IX_UnitAssignments_PropertyId",
                table: "UnitAssignments",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_UnitAssignments_UnitId",
                table: "UnitAssignments",
                column: "UnitId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UnitAssignments");
        }
    }
}
