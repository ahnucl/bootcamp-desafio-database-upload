import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Outcome value exceeds balance total.');
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Got invalid transaction type');
    }

    let foundCategory = await categoryRepository.findOne({
      where: { title: categoryTitle },
    });

    if (!foundCategory) {
      foundCategory = categoryRepository.create({ title: categoryTitle });
      await categoryRepository.save(foundCategory);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category: foundCategory, // passar o objeto ao invés do id cai no campo decorado com JoinColoumn e
      // ManyToOne associando o objeto inteiro ao invés do id a esse registro na aplicação, no banco continua apenas o id
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
