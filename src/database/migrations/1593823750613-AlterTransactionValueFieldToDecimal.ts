import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class AlterTransactionValueFieldToDecimal1593823750613
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const queryResult = await queryRunner.query(
      'SELECT id, value FROM transactions',
    );

    await queryRunner.changeColumn(
      'transactions',
      'value',
      new TableColumn({
        name: 'value',
        type: 'numeric',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Readiciona os dados
    Promise.all(
      queryResult.map(async row => {
        await queryRunner.query(
          'UPDATE transactions SET value = $1 WHERE id = $2',
          [row.value, row.id],
        );
      }),
    ).then(resolve => resolve);

    // Faz a coluna VALUE voltar a ser not null
    await queryRunner.query(
      'ALTER TABLE transactions ALTER COLUMN value SET NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const queryResult = await queryRunner.query(
      'SELECT id, value FROM transactions',
    );

    await queryRunner.changeColumn(
      'transactions',
      'value',
      new TableColumn({
        name: 'value',
        type: 'numeric',
        isNullable: true,
      }),
    );

    // Readiciona os dados
    Promise.all(
      queryResult.map(async row => {
        await queryRunner.query(
          'UPDATE transactions SET value = $1 WHERE id = $2',
          [row.value, row.id],
        );
      }),
    ).then(resolve => resolve);

    // Faz a coluna VALUE voltar a ser not null
    await queryRunner.query(
      'ALTER TABLE transactions ALTER COLUMN value SET NOT NULL',
    );
  }
}
