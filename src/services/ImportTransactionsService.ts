import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

import updateConfig from '../config/update';
import AppError from '../errors/AppError';
import transactionsRouter from '../routes/transactions.routes';
import TransactionsRepository from '../repositories/TransactionsRepository';

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

    async function loadCSV(filepath: string): Promise<string[][]> {
      const readCSVStream = fs.createReadStream(filepath);

      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCSVStream.pipe(parseStream);

      const lines: string[][] = [];

      parseCSV.on('data', line => {
        lines.push(line);
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      return lines;
    }

    const data = await loadCSV(csvFilePath);

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
