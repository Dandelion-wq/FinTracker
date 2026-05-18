import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import './ExpenseChart.css';

function ExpenseChart({ transactions, categories }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [chartType, setChartType] = useState('pie');

    useEffect(() => {
        if (chartRef.current && !chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(chartRef.current);
        }
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.dispose();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!chartInstanceRef.current) return;

        if (chartType === 'pie') {
            // Агрегируем расходы по категориям
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            const categoryTotals = {};

            expenseTransactions.forEach(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const categoryName = category ? category.name : 'Без категории';
                categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(transaction.amount);
            });

            const chartData = Object.entries(categoryTotals).map(([name, value], index) => ({
                name,
                value,
                itemStyle: {
                    color: categories.find(c => c.name === name)?.color || `hsl(${index * 45}, 70%, 50%)`
                }
            }));

            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {d}% ({c} BYN)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderColor: '#E8E5DF',
                    borderWidth: 1,
                    textStyle: { color: '#2C3E2F', fontSize: 12 }
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    bottom: 0,
                    textStyle: { color: '#7F8C8D', fontSize: 11 },
                    itemWidth: 12,
                    itemHeight: 12,
                    formatter: (name) => {
                        const item = chartData.find(d => d.name === name);
                        if (item) {
                            return `${name} - ${item.value.toLocaleString()} BYN`;
                        }
                        return name;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['40%', '65%'],
                    center: ['50%', '45%'],
                    data: chartData,
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: '{b}',
                        fontSize: 10,
                        color: '#2C3E2F'
                    },
                    labelLine: {
                        length: 8,
                        length2: 6,
                        smooth: true
                    },
                    emphasis: {
                        scale: true,
                        label: { show: true, fontWeight: 'bold' }
                    },
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }
                }]
            };
            chartInstanceRef.current.setOption(option, true);
        } else if (chartType === 'line') {
            // Линейный график динамики баланса
            // Группируем транзакции по дням
            const dailyBalance = {};
            
            // Сортируем транзакции по дате
            const sortedTransactions = [...transactions].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
            
            let runningBalance = 0;
            const dates = [];
            const balances = [];
            
            // Получаем уникальные даты за последние 30 дней
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Создаем массив всех дней за последние 30 дней
            const dateMap = new Map();
            for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                dateMap.set(dateStr, 0);
            }
            
            // Заполняем баланс по дням
            for (const transaction of sortedTransactions) {
                const dateStr = transaction.date;
                if (dateMap.has(dateStr)) {
                    const current = dateMap.get(dateStr);
                    const amount = transaction.type === 'income' 
                        ? Number(transaction.amount) 
                        : -Number(transaction.amount);
                    dateMap.set(dateStr, current + amount);
                }
            }
            
            // Вычисляем накопительный баланс
            let cumulativeBalance = 0;
            const sortedDates = Array.from(dateMap.keys()).sort();
            for (const date of sortedDates) {
                cumulativeBalance += dateMap.get(date);
                dates.push(date);
                balances.push(cumulativeBalance);
            }
            
            const option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: (params) => {
                        const date = params[0].axisValue;
                        const balance = params[0].value;
                        return `${date}<br/>Баланс: ${balance.toLocaleString()} BYN`;
                    },
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderColor: '#E8E5DF',
                    borderWidth: 1,
                    textStyle: { color: '#2C3E2F', fontSize: 12 }
                },
                grid: {
                    left: '10%',
                    right: '8%',
                    top: '15%',
                    bottom: '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: dates.map(d => d.slice(5)), // Показываем только ММ-ДД
                    axisLabel: {
                        rotate: 45,
                        fontSize: 10,
                        color: '#7F8C8D'
                    },
                    axisLine: { lineStyle: { color: '#E8E5DF' } }
                },
                yAxis: {
                    type: 'value',
                    name: 'Баланс, BYN',
                    nameTextStyle: { fontSize: 11, color: '#7F8C8D' },
                    axisLabel: {
                        fontSize: 10,
                        color: '#7F8C8D',
                        formatter: (value) => value.toLocaleString()
                    },
                    splitLine: { lineStyle: { color: '#E8E5DF' } }
                },
                series: [{
                    type: 'line',
                    data: balances,
                    smooth: true,
                    lineStyle: {
                        color: '#27AE60',
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
                            { offset: 1, color: 'rgba(39, 174, 96, 0.05)' }
                        ])
                    },
                    symbol: 'circle',
                    symbolSize: 4,
                    itemStyle: {
                        color: '#27AE60'
                    },
                    label: {
                        show: false
                    }
                }]
            };
            chartInstanceRef.current.setOption(option, true);
        } else if (chartType === 'bar') {
            // Столбчатая диаграмма доходов/расходов по месяцам
            const monthlyIncome = {};
            const monthlyExpense = {};
            
            transactions.forEach(transaction => {
                const month = transaction.date.slice(0, 7); // YYYY-MM
                const amount = Number(transaction.amount);
                if (transaction.type === 'income') {
                    monthlyIncome[month] = (monthlyIncome[month] || 0) + amount;
                } else {
                    monthlyExpense[month] = (monthlyExpense[month] || 0) + amount;
                }
            });
            
            const months = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])].sort();
            const incomeData = months.map(m => monthlyIncome[m] || 0);
            const expenseData = months.map(m => monthlyExpense[m] || 0);
            
            const option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params) => {
                        let result = params[0].axisValue;
                        params.forEach(p => {
                            result += `<br/>${p.marker} ${p.seriesName}: ${p.value.toLocaleString()} BYN`;
                        });
                        return result;
                    },
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderColor: '#E8E5DF',
                    borderWidth: 1,
                    textStyle: { color: '#2C3E2F', fontSize: 12 }
                },
                legend: {
                    data: ['Доходы', 'Расходы'],
                    left: 'center',
                    top: 0,
                    textStyle: { color: '#7F8C8D' }
                },
                grid: {
                    left: '10%',
                    right: '5%',
                    top: '15%',
                    bottom: '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: months,
                    axisLabel: {
                        rotate: 45,
                        fontSize: 10,
                        color: '#7F8C8D'
                    },
                    axisLine: { lineStyle: { color: '#E8E5DF' } }
                },
                yAxis: {
                    type: 'value',
                    name: 'BYN',
                    nameTextStyle: { fontSize: 11, color: '#7F8C8D' },
                    axisLabel: {
                        fontSize: 10,
                        color: '#7F8C8D',
                        formatter: (value) => value.toLocaleString()
                    },
                    splitLine: { lineStyle: { color: '#E8E5DF' } }
                },
                series: [
                    {
                        name: 'Доходы',
                        type: 'bar',
                        data: incomeData,
                        itemStyle: {
                            borderRadius: [6, 6, 0, 0],
                            color: '#27AE60'
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: (params) => params.value.toLocaleString(),
                            fontSize: 9
                        }
                    },
                    {
                        name: 'Расходы',
                        type: 'bar',
                        data: expenseData,
                        itemStyle: {
                            borderRadius: [6, 6, 0, 0],
                            color: '#E74C3C'
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: (params) => params.value.toLocaleString(),
                            fontSize: 9
                        }
                    }
                ]
            };
            chartInstanceRef.current.setOption(option, true);
        }
    }, [transactions, categories, chartType]);

    return (
        <div className="expense-chart">
            <div className="chart-header">
                <h3>Аналитика</h3>
                <div className="chart-type-selector">
                    <button 
                        className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                        onClick={() => setChartType('pie')}
                    >
                        Расходы
                    </button>
                    <button 
                        className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                        onClick={() => setChartType('line')}
                    >
                        Динамика
                    </button>
                    <button 
                        className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setChartType('bar')}
                    >
                        Доходы/Расходы
                    </button>
                </div>
            </div>
            <div ref={chartRef} style={{ height: '380px', width: '100%' }} />
        </div>
    );
}

export default ExpenseChart;