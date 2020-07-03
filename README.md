## Dificuldades:

1. Conhecer tipos do Postgres
    - Tipo `numeric` retorna uma `string` pro JS, isso estava dando problema nos values e balance
    - Tive que usar um objeto de opções na coluna "category_id" com a propriedade `transformer`, passando duas funções `from` e `to` que permitem manipular a tipagem que é recebida e enviada ao banco de dados

    [Non-integer numbers always returned as string with postgres · Issue #873 · typeorm/typeorm](https://github.com/typeorm/typeorm/issues/873#issuecomment-328945433)

2. Entender Migrations
    - Eu esqueci de especificar que a coluna category_id poderia ser nula para eventuais deletes, e na hora de mudar eu acabei usando `queryRunner.query('ALTER TABLE ...')` para só alterar essa "constraint", reduzindo a minha abstração do banco (tive que usar SQL, mas pelo menos aprendi que para setar e tirar o nullable de uma coluna no Postgres se usa: `SET NOT NULL` e `DROP NOT NULL` no `ALTER TABLE`
