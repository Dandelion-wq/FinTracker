const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const accountsController = require('../controllers/accountsController');

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Управление счетами пользователя
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Получить все счета пользователя
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список счетов
 *       401:
 *         description: Не авторизован
 */
router.get('/', authMiddleware, accountsController.getAll);

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Создать новый счет
 *     tags: [Accounts]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Карта Visa
 *               type:
 *                 type: string
 *                 enum: [cash, card, ewallet, deposit]
 *                 example: card
 *               currency:
 *                 type: string
 *                 example: BYN
 *               balance:
 *                 type: number
 *                 example: 0
 *               icon:
 *                 type: string
 *                 example: 💳
 *     responses:
 *       201:
 *         description: Счет создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
router.post('/', authMiddleware, accountsController.create);

/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     summary: Обновить счет
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID счета
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
 *               currency:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Счет обновлен
 *       404:
 *         description: Счет не найден
 *       401:
 *         description: Не авторизован
 */
router.put('/:id', authMiddleware, accountsController.update);

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     summary: Удалить счет (деактивировать)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID счета
 *     responses:
 *       200:
 *         description: Счет удален
 *       404:
 *         description: Счет не найден
 *       401:
 *         description: Не авторизован
 */
router.delete('/:id', authMiddleware, accountsController.delete);

module.exports = router;