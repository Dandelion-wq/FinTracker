const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const categoriesController = require('../controllers/categoriesController');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Управление категориями
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Получить все категории пользователя
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список категорий
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
 *                     enum: [income, expense]
 *                   color:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   monthlyLimit:
 *                     type: number
 *                   isDefault:
 *                     type: boolean
 *       401:
 *         description: Не авторизован
 */
router.get('/', authMiddleware, categoriesController.getAll);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Создать новую категорию
 *     tags: [Categories]
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
 *                 example: Продукты
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               color:
 *                 type: string
 *                 example: "#E74C3C"
 *               icon:
 *                 type: string
 *                 example: 🥑
 *               monthlyLimit:
 *                 type: number
 *                 example: 500
 *     responses:
 *       201:
 *         description: Категория создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
router.post('/', authMiddleware, categoriesController.create);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Обновить категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               monthlyLimit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Категория обновлена
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 */
router.put('/:id', authMiddleware, categoriesController.update);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Удалить категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория удалена
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 */
router.delete('/:id', authMiddleware, categoriesController.delete);

module.exports = router;