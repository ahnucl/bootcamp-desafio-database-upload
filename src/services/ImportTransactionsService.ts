import { getCustomRepository, getRepository } from 'typeorm';
import path from 'path';
import fs from 'fs';
import updateConfig from '../config/update';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import loadCSV from '../util/loadCSV';

interface TransactionParams {
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    // TODO
    const csvFilePath = path.resolve(updateConfig.directory, filename);

    const data = await loadCSV(csvFilePath);

    await fs.promises.unlink(csvFilePath);

    const transactionArray = data.map(transactionParams => ({
      title: transactionParams[0],
      type: transactionParams[1] as 'income' | 'outcome',
      value: Number(transactionParams[2]),
      categoryTitle: transactionParams[3],
    }));

    // NÃO VERIFICAR BALANCE NESSA ROTA
    // Obter Categories que não estão cadastradas
    // Criar todas as categorias que não estão cadastradas

    const categoryRepository = getRepository(Category);

    const uploadedCategories = transactionArray.map(item => item.categoryTitle);

    const storedCategories = await categoryRepository.find();
    let newCategories: Category[] = [];

    const categoriesTitles = storedCategories.map(category => category.title);

    const categoriesToCreate = uploadedCategories
      .filter(category => !categoriesTitles.includes(category))
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
      transactionArray.map(({ title, type, value, categoryTitle }) => ({
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
