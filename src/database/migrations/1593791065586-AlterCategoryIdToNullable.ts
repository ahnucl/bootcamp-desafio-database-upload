import { MigrationInterface, QueryRunner } from 'typeorm';

export default class AlterCategoryIdToNullable1593791065586
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL',
    );
  }
}
