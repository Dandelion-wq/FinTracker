const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const budgetsController = require('../controllers/budgetsController');

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Управление бюджетами
 */

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Получить все бюджеты пользователя
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список бюджетов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [expense, saving]
 *                   periodType:
 *                     type: string
 *                     enum: [week, month, year, custom]
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   targetAmount:
 *                     type: number
 *                   currentAmount:
 *                     type: number
 *       401:
 *         description: Не авторизован
 */
router.get('/', authMiddleware, budgetsController.getAll);

/**
 * @swagger
 * /budgets/stats:
 *   get:
 *     summary: Получить статистику по активным бюджетам
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика бюджетов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   targetAmount:
 *                     type: number
 *                   currentAmount:
 *                     type: number
 *                   progress:
 *                     type: number
 *                   remaining:
 *                     type: number
 *                   isCompleted:
 *                     type: boolean
 *                   periodType:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *       401:
 *         description: Не авторизован
 */
router.get('/stats', authMiddleware, budgetsController.getStats);

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Создать новый бюджет
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - periodType
 *               - startDate
 *               - targetAmount
 *             properties:
 *               name:
 *                 type: string
 *                 example: Бюджет на месяц
 *               type:
 *                 type: string
 *                 enum: [expense, saving]
 *                 example: expense
 *               periodType:
 *                 type: string
 *                 enum: [week, month, year, custom]
 *                 example: month
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-05-31"
 *               targetAmount:
 *                 type: number
 *                 example: 20000
 *     responses:
 *       201:
 *         description: Бюджет создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
router.post('/', authMiddleware, budgetsController.create);

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Обновить бюджет
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бюджета
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [expense, saving]
 *               periodType:
 *                 type: string
 *                 enum: [week, month, year, custom]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               targetAmount:
 *                 type: number
 *               currentAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Бюджет обновлен
 *       404:
 *         description: Бюджет не найден
 *       401:
 *         description: Не авторизован
 */
router.put('/:id', authMiddleware, budgetsController.update);

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Удалить бюджет
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бюджета
 *     responses:
 *       200:
 *         description: Бюджет удален
 *       404:
 *         description: Бюджет не найден
 *       401:
 *         description: Не авторизован
 */
router.delete('/:id', authMiddleware, budgetsController.delete);

/**
 * @swagger
 * /budgets/update-saving:
 *   post:
 *     summary: Обновить сумму накопительного бюджета
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budgetId
 *               - amount
 *               - action
 *             properties:
 *               budgetId:
 *                 type: integer
 *                 description: ID накопительного бюджета
 *                 example: 1
 *               amount:
 *                 type: number
 *                 description: Сумма пополнения или снятия
 *                 example: 1000
 *               action:
 *                 type: string
 *                 enum: [deposit, withdrawal]
 *                 description: deposit - пополнение, withdrawal - снятие
 *                 example: deposit
 *     responses:
 *       200:
 *         description: Сумма накоплений обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 currentAmount:
 *                   type: number
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Бюджет не найден
 */
router.post('/update-saving', authMiddleware, budgetsController.updateSavingAmount);

module.exports = router;