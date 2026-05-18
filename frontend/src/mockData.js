export const mockUser = {
    id: 1,
    lastName: 'Иванов',
    firstName: 'Иван',
    patronymic: 'Иванович',
    email: 'ivan@example.com'
};

export const mockAccounts = [
    { id: 1, name: 'Наличные', type: 'cash', currency: 'BYN', balance: 3200, icon: '💵' },
    { id: 2, name: 'Карта Visa', type: 'card', currency: 'BYN', balance: 15250, icon: '💳' },
    { id: 3, name: 'WebMoney', type: 'ewallet', currency: 'BYN', balance: 500, icon: '📱' }
];

export const mockCategories = [
    { id: 1, name: 'Продукты', type: 'expense', color: '#27AE60', monthlyLimit: 500 },
    { id: 2, name: 'Транспорт', type: 'expense', color: '#2ECC71', monthlyLimit: 200 },
    { id: 3, name: 'Развлечения', type: 'expense', color: '#F39C12', monthlyLimit: 300 },
    { id: 4, name: 'Зарплата', type: 'income', color: '#27AE60' },
    { id: 5, name: 'Фриланс', type: 'income', color: '#1ABC9C' },
    { id: 6, name: 'Кафе', type: 'expense', color: '#E67E22', monthlyLimit: 400 },
    { id: 7, name: 'Коммунальные', type: 'expense', color: '#3498DB', monthlyLimit: 350 }
];

export const mockTransactions = [
    { id: 1, amount: 850, type: 'expense', categoryId: 1, accountId: 2, date: '2026-04-15', description: 'Магазин' },
    { id: 2, amount: 45000, type: 'income', categoryId: 4, accountId: 2, date: '2026-04-14', description: 'Заработная плата' },
    { id: 3, amount: 120, type: 'expense', categoryId: 2, accountId: 1, date: '2026-04-13', description: 'Метро' },
    { id: 4, amount: 650, type: 'expense', categoryId: 6, accountId: 2, date: '2026-04-12', description: 'Обед в кафе' },
    { id: 5, amount: 2300, type: 'expense', categoryId: 1, accountId: 2, date: '2026-04-10', description: 'Продукты на неделю' },
    { id: 6, amount: 5000, type: 'income', categoryId: 5, accountId: 3, date: '2026-04-08', description: 'Проект' },
    { id: 7, amount: 320, type: 'expense', categoryId: 7, accountId: 2, date: '2026-04-05', description: 'Электричество' }
];

export const mockBudgets = [
    { id: 1, name: 'Бюджет на апрель 2026', periodType: 'month', startDate: '2026-04-01', endDate: '2026-04-30', totalLimit: 20000, currentSpent: 4240 },
    { id: 2, name: 'Бюджет на отпуск', periodType: 'custom', startDate: '2026-06-01', endDate: '2026-08-31', totalLimit: 50000, currentSpent: 25000 }
];