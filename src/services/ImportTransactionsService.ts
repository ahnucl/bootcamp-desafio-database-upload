import { getCustomRepository, getRepository, In } from 'typeorm';

import fs from 'fs';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionRepository from '../repositories/TransactionsRepository';

import loadCSV from '../util/loadCSV';

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const data = await loadCSV(filepath);

    await fs.promises.unlink(filepath);

    const transactionToCreate = data.map(transactionParams => ({
      title: transactionParams[0],
      type: transactionParams[1] as 'income' | 'outcome',
      value: Number(transactionParams[2]),
      categoryTitle: transactionParams[3],
    }));

    // NÃO VERIFICAR BALANCE NESSA ROTA
    // Obter Categories que não estão cadastradas
    // Criar todas as categorias que não estão cadastradas

    const categoryRepository = getRepository(Category);

    const uploadedCategories = transactionToCreate.map(
      item => item.categoryTitle,
    );

    const storedCategories = await categoryRepository.find({
      where: {
        title: In(uploadedCategories), // Não traz todas as categorias, apenas as que estão no arquivo de upload
      },
    });
    let newCategories: Category[] = [];

    const storedCategoriesTitles = storedCategories.map(
      category => category.title,
    );

    const categoriesToCreate = uploadedCategories
      .filter(category => !storedCategoriesTitles.includes(category))
      .filter((category, index, self) => self.indexOf(category) === index);

    if (categoriesToCreate.length > 0) {
      newCategories = await categoryRepository.create(
        categoriesToCreate.map(
          categoryTitle => ({ title: categoryTitle } as Category),
        ),
      );
      await categoryRepository.save(newCategories);
    }

    const categories = [...storedCategories, ...newCategories];

    const transactionRepository = getCustomRepository(TransactionRepository);
    const transactions = transactionRepository.create(
      transactionToCreate.map(({ title, type, value, categoryTitle }) => ({
        title,
        type,
        value,
        category: categories.find(category => category.title === categoryTitle),
      })),
    );

    await transactionRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
