import { getCustomRepository, getRepository, In } from 'typeorm';

import fs from 'fs';
import csvParse from 'csv-parse';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filepath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsToCreate: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, categoryTitle] = line;

      transactionsToCreate.push({
        title,
        type,
        value: Number(value),
        categoryTitle,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    await fs.promises.unlink(filepath);

    // Validating uploaded CSV
    // eslint-disable-next-line array-callback-return
    transactionsToCreate.map(({ title, type, value, categoryTitle }) => {
      if (!title || !type || !value || !categoryTitle) {
        throw new AppError('CSV file incomplete or corrupt.');
      }

      if (type !== 'income' && type !== 'outcome') {
        throw new AppError('Incorrect type information.');
      }
    });

    const categoryRepository = getRepository(Category);

    const uploadedCategories = transactionsToCreate.map(
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
      transactionsToCreate.map(({ title, type, value, categoryTitle }) => ({
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
