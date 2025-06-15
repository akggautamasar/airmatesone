
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { MonthlyReportData } from '@/hooks/useMonthlyReport';
import { IndianRupee } from 'lucide-react';

interface ReportDisplayProps {
    data: MonthlyReportData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#F1C40F'];

export const ReportDisplay = ({ data }: ReportDisplayProps) => {
    const { totalSpent, balance, expenseCount, categoryData, month, year, userName } = data;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    if (expenseCount === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Report for {monthName} {year}</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12">
                     <p className="text-muted-foreground">No expenses recorded for you this month.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Report for {monthName} {year}</CardTitle>
                    <CardDescription>A summary of {userName}'s expenses and contributions.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Total You Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center">
                        <IndianRupee className="h-6 w-6 mr-2 text-blue-500"/>
                        <p className="text-2xl font-bold">
                            {totalSpent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Your Net Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                             <IndianRupee className={`h-6 w-6 mr-2 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}/>
                             <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                             </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {balance >= 0 ? 'You are owed this amount' : 'You owe this amount'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Expenses Involved In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{expenseCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>Total spending in categories you were involved in.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
