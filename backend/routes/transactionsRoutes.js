const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const transactionsController = require('../controllers/transactionsController');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Управление транзакциями
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Получить все транзакции пользователя
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Начальная дата (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Конечная дата (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, all]
 *         description: Тип транзакции
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Список транзакций
 *       401:
 *         description: Не авторизован
 */
router.get('/', authMiddleware, transactionsController.getAll);

/**
 * @swagger
 * /transactions/stats:
 *   get:
 *     summary: Получить статистику для графиков
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Период статистики
 *     responses:
 *       200:
 *         description: Статистика доходов/расходов
 *       401:
 *         description: Не авторизован
 */
router.get('/stats', authMiddleware, transactionsController.getStats);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Создать новую транзакцию
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - accountId
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               accountId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-15"
 *               description:
 *                 type: string
 *                 example: "Покупка продуктов"
 *               isTransfer:
 *                 type: boolean
 *                 example: false
 *               transferAccountId:
 *                 type: integer
 *                 example: null
 *     responses:
 *       201:
 *         description: Транзакция создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
router.post('/', authMiddleware, transactionsController.create);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Обновить транзакцию
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID транзакции
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *               date:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Транзакция обновлена
 *       404:
 *         description: Транзакция не найдена
 *       401:
 *         description: Не авторизован
 */
router.put('/:id', authMiddleware, transactionsController.update);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Удалить транзакцию
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID транзакции
 *     responses:
 *       200:
 *         description: Транзакция удалена
 *       404:
 *         description: Транзакция не найдена
 *       401:
 *         description: Не авторизован
 */
router.delete('/:id', authMiddleware, transactionsController.delete);

module.exports = router;