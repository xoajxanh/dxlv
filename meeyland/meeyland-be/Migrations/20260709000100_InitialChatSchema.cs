using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using meeyland_be.Data;

#nullable disable

namespace meeyland_be.Migrations
{
    [DbContext(typeof(ChatDbContext))]
    [Migration("20260709000100_InitialChatSchema")]
    public partial class InitialChatSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[Users]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Users] (
                        [Id] int NOT NULL IDENTITY,
                        [Username] nvarchar(450) NOT NULL,
                        [PasswordHash] nvarchar(max) NOT NULL,
                        [DisplayName] nvarchar(max) NOT NULL,
                        [AvatarUrl] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
                    );
                END;

                IF COL_LENGTH('Users', 'Username') IS NULL ALTER TABLE [Users] ADD [Username] nvarchar(450) NOT NULL DEFAULT N'';
                IF COL_LENGTH('Users', 'PasswordHash') IS NULL ALTER TABLE [Users] ADD [PasswordHash] nvarchar(max) NOT NULL DEFAULT N'';
                IF COL_LENGTH('Users', 'DisplayName') IS NULL ALTER TABLE [Users] ADD [DisplayName] nvarchar(max) NOT NULL DEFAULT N'';
                IF COL_LENGTH('Users', 'AvatarUrl') IS NULL ALTER TABLE [Users] ADD [AvatarUrl] nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'CreatedAt') IS NULL ALTER TABLE [Users] ADD [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME();
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[ChatRooms]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [ChatRooms] (
                        [Id] int NOT NULL IDENTITY,
                        [Name] nvarchar(max) NOT NULL,
                        [IsGroup] bit NOT NULL,
                        [CreatedByUserId] int NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_ChatRooms] PRIMARY KEY ([Id])
                    );
                END;

                IF COL_LENGTH('ChatRooms', 'Name') IS NULL ALTER TABLE [ChatRooms] ADD [Name] nvarchar(max) NOT NULL DEFAULT N'';
                IF COL_LENGTH('ChatRooms', 'IsGroup') IS NULL ALTER TABLE [ChatRooms] ADD [IsGroup] bit NOT NULL DEFAULT CAST(0 AS bit);
                IF COL_LENGTH('ChatRooms', 'CreatedByUserId') IS NULL ALTER TABLE [ChatRooms] ADD [CreatedByUserId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('ChatRooms', 'CreatedAt') IS NULL ALTER TABLE [ChatRooms] ADD [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME();
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[Contacts]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Contacts] (
                        [Id] int NOT NULL IDENTITY,
                        [OwnerId] int NOT NULL,
                        [ContactUserId] int NOT NULL,
                        [AddedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_Contacts] PRIMARY KEY ([Id])
                    );
                END;

                IF COL_LENGTH('Contacts', 'OwnerId') IS NULL ALTER TABLE [Contacts] ADD [OwnerId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('Contacts', 'ContactUserId') IS NULL ALTER TABLE [Contacts] ADD [ContactUserId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('Contacts', 'AddedAt') IS NULL ALTER TABLE [Contacts] ADD [AddedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME();
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[ChatMessages]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [ChatMessages] (
                        [Id] int NOT NULL IDENTITY,
                        [ChatRoomId] int NOT NULL,
                        [SenderId] int NOT NULL,
                        [Content] nvarchar(max) NOT NULL,
                        [AttachmentUrl] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id])
                    );
                END;

                IF COL_LENGTH('ChatMessages', 'ChatRoomId') IS NULL ALTER TABLE [ChatMessages] ADD [ChatRoomId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('ChatMessages', 'SenderId') IS NULL ALTER TABLE [ChatMessages] ADD [SenderId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('ChatMessages', 'Content') IS NULL ALTER TABLE [ChatMessages] ADD [Content] nvarchar(max) NOT NULL DEFAULT N'';
                IF COL_LENGTH('ChatMessages', 'AttachmentUrl') IS NULL ALTER TABLE [ChatMessages] ADD [AttachmentUrl] nvarchar(max) NULL;
                IF COL_LENGTH('ChatMessages', 'CreatedAt') IS NULL ALTER TABLE [ChatMessages] ADD [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME();
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[RoomMembers]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [RoomMembers] (
                        [Id] int NOT NULL IDENTITY,
                        [ChatRoomId] int NOT NULL,
                        [UserId] int NOT NULL,
                        [IsAdmin] bit NOT NULL,
                        [JoinedAt] datetime2 NOT NULL,
                        [LastReadMessageId] int NULL,
                        [LastReadAt] datetime2 NULL,
                        CONSTRAINT [PK_RoomMembers] PRIMARY KEY ([Id])
                    );
                END;

                IF COL_LENGTH('RoomMembers', 'ChatRoomId') IS NULL ALTER TABLE [RoomMembers] ADD [ChatRoomId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('RoomMembers', 'UserId') IS NULL ALTER TABLE [RoomMembers] ADD [UserId] int NOT NULL DEFAULT 0;
                IF COL_LENGTH('RoomMembers', 'IsAdmin') IS NULL ALTER TABLE [RoomMembers] ADD [IsAdmin] bit NOT NULL DEFAULT CAST(0 AS bit);
                IF COL_LENGTH('RoomMembers', 'JoinedAt') IS NULL ALTER TABLE [RoomMembers] ADD [JoinedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME();
                IF COL_LENGTH('RoomMembers', 'LastReadMessageId') IS NULL ALTER TABLE [RoomMembers] ADD [LastReadMessageId] int NULL;
                IF COL_LENGTH('RoomMembers', 'LastReadAt') IS NULL ALTER TABLE [RoomMembers] ADD [LastReadAt] datetime2 NULL;
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_Username' AND object_id = OBJECT_ID(N'[Users]'))
                    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatRooms_CreatedByUserId' AND object_id = OBJECT_ID(N'[ChatRooms]'))
                    CREATE INDEX [IX_ChatRooms_CreatedByUserId] ON [ChatRooms] ([CreatedByUserId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Contacts_ContactUserId' AND object_id = OBJECT_ID(N'[Contacts]'))
                    CREATE INDEX [IX_Contacts_ContactUserId] ON [Contacts] ([ContactUserId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Contacts_OwnerId_ContactUserId' AND object_id = OBJECT_ID(N'[Contacts]'))
                    CREATE UNIQUE INDEX [IX_Contacts_OwnerId_ContactUserId] ON [Contacts] ([OwnerId], [ContactUserId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatMessages_ChatRoomId' AND object_id = OBJECT_ID(N'[ChatMessages]'))
                    CREATE INDEX [IX_ChatMessages_ChatRoomId] ON [ChatMessages] ([ChatRoomId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatMessages_SenderId' AND object_id = OBJECT_ID(N'[ChatMessages]'))
                    CREATE INDEX [IX_ChatMessages_SenderId] ON [ChatMessages] ([SenderId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RoomMembers_ChatRoomId_UserId' AND object_id = OBJECT_ID(N'[RoomMembers]'))
                    CREATE UNIQUE INDEX [IX_RoomMembers_ChatRoomId_UserId] ON [RoomMembers] ([ChatRoomId], [UserId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RoomMembers_UserId' AND object_id = OBJECT_ID(N'[RoomMembers]'))
                    CREATE INDEX [IX_RoomMembers_UserId] ON [RoomMembers] ([UserId]);
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ChatMessages");
            migrationBuilder.DropTable(name: "Contacts");
            migrationBuilder.DropTable(name: "RoomMembers");
            migrationBuilder.DropTable(name: "ChatRooms");
            migrationBuilder.DropTable(name: "Users");
        }
    }
}
