import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import './ExpenseChart.css';

function ExpenseChart({ transactions, categories }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [chartType, setChartType] = useState('pie');
    const [period, setPeriod] = useState('month');

    // Фильтрация транзакций по выбранному периоду
    const getFilteredTransactions = () => {
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        return transactions.filter(t => new Date(t.date) >= startDate);
    };

    // Получение суммы в BYN для транзакции
    const getAmountInBYN = (transaction) => {
        if (transaction.amountInBYN !== undefined && transaction.amountInBYN !== null) {
            return Number(transaction.amountInBYN);
        }
        return Number(transaction.amount);
    };

    // Инициализация графика
    useEffect(() => {
        if (chartRef.current && !chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(chartRef.current);
        }

        const handleResize = () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        const resizeObserver = new ResizeObserver(() => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.resize();
            }
        });

        if (chartRef.current) {
            resizeObserver.observe(chartRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            if (chartInstanceRef.current) {
                chartInstanceRef.current.dispose();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    // Обновление графика при изменении данных, типа или периода
    useEffect(() => {
        if (!chartInstanceRef.current) return;

        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        const filteredTransactions = getFilteredTransactions();

        // Круговая диаграмма (Расходы по категориям)
        if (chartType === 'pie') {
            const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
            const categoryTotals = {};

            expenseTransactions.forEach(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const categoryName = category ? category.name : 'Без категории';
                const amountInBYN = getAmountInBYN(transaction);
                categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amountInBYN;
            });

            const chartData = Object.entries(categoryTotals)
                .map(([name, value], index) => ({
                    name,
                    value,
                    itemStyle: {
                        color: categories.find(c => c.name === name)?.color || `hsl(${index * 45}, 70%, 50%)`
                    }
                }))
                .sort((a, b) => b.value - a.value);

            const totalAmount = expenseTransactions.reduce((sum, t) => sum + getAmountInBYN(t), 0);

            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        return `${params.name}: ${params.percent.toFixed(1)}% (${params.value.toLocaleString()} BYN)`;
                    },
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
                    itemGap: 10,
                    formatter: (name) => {
                        const item = chartData.find(d => d.name === name);
                        if (item) {
                            const percent = ((item.value / totalAmount) * 100).toFixed(1);
                            return `${name} - ${item.value.toLocaleString()} BYN (${percent}%)`;
                        }
                        return name;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['40%', '60%'],
                    center: ['50%', '42%'],
                    data: chartData,
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: '{b}',
                        fontSize: 11,
                        color: '#2C3E2F'
                    },
                    labelLine: {
                        length: 10,
                        length2: 8,
                        smooth: true
                    },
                    // Полностью отключаем все эффекты при наведении
                    emphasis: {
                        disabled: true
                    },
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }
                }]
            };
            
            // Адаптация для мобильных устройств
            if (isMobile) {
                option.legend = {
                    orient: 'horizontal',
                    left: 'center',
                    bottom: 0,
                    textStyle: { color: '#7F8C8D', fontSize: isSmallMobile ? 9 : 10 },
                    itemWidth: 10,
                    itemHeight: 10,
                    itemGap: 8,
                    formatter: (name) => {
                        if (isSmallMobile) {
                            return name.length > 12 ? name.substring(0, 10) + '...' : name;
                        }
                        return name.length > 15 ? name.substring(0, 13) + '...' : name;
                    }
                };
                option.series[0].radius = ['30%', '55%'];
                option.series[0].center = ['50%', '42%'];
                option.series[0].label.show = false;
                option.series[0].labelLine.length = 0;
            }

            chartInstanceRef.current.setOption(option, true);
        }
        // Линейный график (Динамика баланса)
        else if (chartType === 'line') {
            const sortedTransactions = [...filteredTransactions].sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );

            const dateMap = new Map();

            for (const transaction of sortedTransactions) {
                const dateStr = transaction.date;
                const current = dateMap.get(dateStr) || 0;
                const amountInBYN = getAmountInBYN(transaction);
                const amount = transaction.type === 'income' ? amountInBYN : -amountInBYN;
                dateMap.set(dateStr, current + amount);
            }

            let cumulativeBalance = 0;
            const dates = [];
            const balances = [];
            const sortedDates = Array.from(dateMap.keys()).sort();

            for (const date of sortedDates) {
                cumulativeBalance += dateMap.get(date);
                dates.push(date);
                balances.push(cumulativeBalance);
            }

            const step = isMobile ? Math.ceil(dates.length / 6) : Math.ceil(dates.length / 10);

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
                    textStyle: { color: '#2C3E2F', fontSize: isMobile ? 10 : 12 }
                },
                grid: {
                    left: '12%',
                    right: '8%',
                    top: '12%',
                    bottom: isMobile ? '12%' : '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    axisLabel: {
                        rotate: isMobile ? 45 : 30,
                        fontSize: isMobile ? (isSmallMobile ? 7 : 8) : 10,
                        color: '#7F8C8D',
                        interval: step,
                        showMinLabel: true,
                        showMaxLabel: true
                    },
                    axisLine: { lineStyle: { color: '#E8E5DF' } }
                },
                yAxis: {
                    type: 'value',
                    name: 'Баланс, BYN',
                    nameTextStyle: { fontSize: isMobile ? 9 : 11, color: '#7F8C8D' },
                    axisLabel: {
                        fontSize: isMobile ? 8 : 10,
                        color: '#7F8C8D',
                        formatter: (value) => value.toLocaleString()
                    },
                    splitLine: { lineStyle: { color: '#E8E5DF' } }
                },
                series: [{
                    type: 'line',
                    data: balances,
                    smooth: true,
                    lineStyle: { color: '#27AE60', width: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
                            { offset: 1, color: 'rgba(39, 174, 96, 0.05)' }
                        ])
                    },
                    symbol: 'circle',
                    symbolSize: isMobile ? 3 : 4,
                    itemStyle: { color: '#27AE60' },
                    label: { show: false },
                    emphasis: { disabled: true }
                }]
            };
            chartInstanceRef.current.setOption(option, true);
        }
        // Столбчатая диаграмма (Доходы/Расходы по месяцам)
        else if (chartType === 'bar') {
            const monthlyIncome = {};
            const monthlyExpense = {};

            filteredTransactions.forEach(transaction => {
                const month = transaction.date.slice(0, 7);
                const amountInBYN = getAmountInBYN(transaction);
                
                if (transaction.type === 'income') {
                    monthlyIncome[month] = (monthlyIncome[month] || 0) + amountInBYN;
                } else {
                    monthlyExpense[month] = (monthlyExpense[month] || 0) + amountInBYN;
                }
            });

            let months = [...new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])].sort();

            if (isMobile && months.length > 6) {
                months = months.slice(-6);
            }

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
                    textStyle: { color: '#2C3E2F', fontSize: isMobile ? 10 : 12 }
                },
                legend: {
                    data: ['Доходы', 'Расходы'],
                    left: 'center',
                    top: 0,
                    textStyle: { color: '#7F8C8D', fontSize: isMobile ? 10 : 12 },
                    itemWidth: isMobile ? 20 : 25,
                    itemHeight: isMobile ? 10 : 14
                },
                grid: {
                    left: '12%',
                    right: '5%',
                    top: isMobile ? '18%' : '15%',
                    bottom: isMobile ? '12%' : '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: months,
                    axisLabel: {
                        rotate: isMobile ? 45 : 30,
                        fontSize: isMobile ? (isSmallMobile ? 8 : 9) : 10,
                        color: '#7F8C8D'
                    },
                    axisLine: { lineStyle: { color: '#E8E5DF' } }
                },
                yAxis: {
                    type: 'value',
                    name: 'BYN',
                    nameTextStyle: { fontSize: isMobile ? 9 : 11, color: '#7F8C8D' },
                    axisLabel: {
                        fontSize: isMobile ? 8 : 10,
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
                            show: !isMobile && !isSmallMobile,
                            position: 'top',
                            formatter: (params) => params.value.toLocaleString(),
                            fontSize: 9
                        },
                        emphasis: { disabled: true }
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
                            show: !isMobile && !isSmallMobile,
                            position: 'top',
                            formatter: (params) => params.value.toLocaleString(),
                            fontSize: 9
                        },
                        emphasis: { disabled: true }
                    }
                ]
            };
            chartInstanceRef.current.setOption(option, true);
        }

        setTimeout(() => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.resize();
            }
        }, 100);

    }, [transactions, categories, chartType, period]);

    return (
        <div className="expense-chart">
            <div className="chart-header">
                <div className="chart-title-section">
                    <h3>Аналитика</h3>
                    <div className="chart-period-selector">
                        <button
                            className={`period-btn ${period === 'week' ? 'active' : ''}`}
                            onClick={() => setPeriod('week')}
                        >
                            Неделя
                        </button>
                        <button
                            className={`period-btn ${period === 'month' ? 'active' : ''}`}
                            onClick={() => setPeriod('month')}
                        >
                            Месяц
                        </button>
                        <button
                            className={`period-btn ${period === 'year' ? 'active' : ''}`}
                            onClick={() => setPeriod('year')}
                        >
                            Год
                        </button>
                    </div>
                </div>
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
            <div ref={chartRef} style={{ height: '450px', width: '100%' }} />
        </div>
    );
}

export default ExpenseChart;