import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from "typeorm";

export class LinkResourcesToChapters1677600001000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "chapter_content_units",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                },
                {
                    name: "chapterId",
                    type: "int", // Assuming Chapter ID is int
                },
                {
                    name: "resourceId",
                    type: "uuid", // Assuming Resource ID is uuid
                },
                {
                    name: "order",
                    type: "int",
                },
                {
                    name: "createdAt",
                    type: "timestamp with time zone",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updatedAt",
                    type: "timestamp with time zone",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP",
                },
            ],
        }), true);

        // Foreign key to chapters table
        await queryRunner.createForeignKey("chapter_content_units", new TableForeignKey({
            columnNames: ["chapterId"],
            referencedColumnNames: ["id"],
            referencedTableName: "chapters", // Make sure this matches your chapters table name
            onDelete: "CASCADE", // If a chapter is deleted, remove its content unit entries
        }));

        // Foreign key to resources table
        await queryRunner.createForeignKey("chapter_content_units", new TableForeignKey({
            columnNames: ["resourceId"],
            referencedColumnNames: ["id"],
            referencedTableName: "resources", // Make sure this matches your resources table name
            onDelete: "CASCADE", // If a resource is deleted, remove its links to chapters
        }));

        // Unique constraint for (chapterId, resourceId)
        await queryRunner.createUniqueConstraint("chapter_content_units", new TableUnique({
            name: "UQ_chapter_resource", // Optional: specify a name for the unique constraint
            columnNames: ["chapterId", "resourceId"],
        }));

        // Optional: If (chapterId, order) should be unique instead of (chapterId, resourceId)
        // await queryRunner.createUniqueConstraint("chapter_content_units", new TableUnique({
        //     name: "UQ_chapter_order",
        //     columnNames: ["chapterId", "order"],
        // }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique constraints first if they were named, otherwise TypeORM might handle by table.
        // await queryRunner.dropUniqueConstraint("chapter_content_units", "UQ_chapter_resource");
        // await queryRunner.dropUniqueConstraint("chapter_content_units", "UQ_chapter_order"); // if created

        // Drop foreign keys - TypeORM might handle these if not named, or drop by table.
        // It's safer to drop them explicitly if they were named or if you know the convention.
        // Example: await queryRunner.dropForeignKey("chapter_content_units", "FK_content_unit_chapter");
        // Example: await queryRunner.dropForeignKey("chapter_content_units", "FK_content_unit_resource");

        await queryRunner.dropTable("chapter_content_units");
    }

}
