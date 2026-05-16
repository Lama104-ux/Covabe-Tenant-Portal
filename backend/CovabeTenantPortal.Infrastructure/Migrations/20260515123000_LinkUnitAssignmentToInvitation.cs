using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CovabeTenantPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LinkUnitAssignmentToInvitation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InvitationId",
                table: "UnitAssignments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnitAssignments_InvitationId",
                table: "UnitAssignments",
                column: "InvitationId");

            migrationBuilder.AddForeignKey(
                name: "FK_UnitAssignments_Invitations_InvitationId",
                table: "UnitAssignments",
                column: "InvitationId",
                principalTable: "Invitations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UnitAssignments_Invitations_InvitationId",
                table: "UnitAssignments");

            migrationBuilder.DropIndex(
                name: "IX_UnitAssignments_InvitationId",
                table: "UnitAssignments");

            migrationBuilder.DropColumn(
                name: "InvitationId",
                table: "UnitAssignments");
        }
    }
}
