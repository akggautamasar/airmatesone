import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { MonthlyReportData } from '@/hooks/useMonthlyReport';
import { IndianRupee, ShoppingBag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from 'date-fns';

interface ReportDisplayProps {
    data: MonthlyReportData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#F1C40F'];

export const ReportDisplay = ({ data }: ReportDisplayProps) => {
    const { totalSpent, balance, expenseCount, categoryData, month, year, userName, purchasedItems, moneySent, moneyReceived } = data;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    if (expenseCount === 0 && purchasedItems.length === 0 && moneySent.length === 0 && moneyReceived.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Report for {monthName} {year}</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12">
                     <p className="text-muted-foreground">No activity recorded for you this month.</p>
                </CardContent>
            </Card>
        )
    }

    const totalMoneySent = moneySent.reduce((sum, item) => sum + item.amount, 0);
    const totalMoneyReceived = moneyReceived.reduce((sum, item) => sum + item.amount, 0);

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

            {categoryData.length > 0 && (
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
            )}

            {purchasedItems && purchasedItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5" />Shopping Summary</CardTitle>
                        <CardDescription>Items you purchased this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="text-right">Purchased On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchasedItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.custom_product_name || item.product?.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">{item.purchased_at ? format(new Date(item.purchased_at), 'PPP') : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {(moneySent.length > 0 || moneyReceived.length > 0) && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Settlements Summary</CardTitle>
                        <CardDescription>Money sent and received for settlements this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center"><ArrowUpRight className="mr-2 h-5 w-5 text-red-500" />Money Sent</h3>
                            {moneySent.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>To</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {moneySent.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell>{s.name}</TableCell>
                                                <TableCell>{s.settledDate ? format(new Date(s.settledDate), 'PP') : '-'}</TableCell>
                                                <TableCell className="text-right">{s.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                            <TableCell className="text-right font-bold">{totalMoneySent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            ) : <p className="text-sm text-muted-foreground">No money sent this month.</p>}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center"><ArrowDownLeft className="mr-2 h-5 w-5 text-green-500" />Money Received</h3>
                             {moneyReceived.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>From</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {moneyReceived.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell>{s.name}</TableCell>
                                                <TableCell>{s.settledDate ? format(new Date(s.settledDate), 'PP') : '-'}</TableCell>
                                                <TableCell className="text-right">{s.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                            <TableCell className="text-right font-bold">{totalMoneyReceived.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            ) : <p className="text-sm text-muted-foreground">No money received this month.</p>}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
