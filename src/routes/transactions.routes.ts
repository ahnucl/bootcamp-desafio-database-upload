import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import updateConfig from '../config/update';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

const update = multer(updateConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });
  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions: transactions.map(
      ({ id, title, type, value, category, created_at, updated_at }) => ({
        id,
        title,
        type,
        value,
        created_at,
        updated_at,
        category,
      }),
    ),
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category: categoryTitle } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryTitle,
  });

  delete transaction.category_id;

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  update.single('file'),
  async (request, response) => {
    const importTransaction = new ImportTransactionsService();

    const transactions = await importTransaction.execute(request.file.filename);

    // Seria um delete transaction.category_id mais rebuscado
    return response.json(
      transactions.map(
        ({ id, title, type, value, category, created_at, updated_at }) => ({
          id,
          title,
          type,
          value,
          created_at,
          updated_at,
          category,
        }),
      ),
    );
  },
);

export default transactionsRouter;
