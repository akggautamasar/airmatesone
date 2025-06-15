
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useMonthlyReport, MonthlyReportData } from '@/hooks/useMonthlyReport';
import { ReportDisplay } from './reports/ReportDisplay';

const getMonthYearOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
        options.push({
            value: `${date.getFullYear()}-${date.getMonth()}`,
            label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

export const ReportsPage = () => {
    const monthYearOptions = getMonthYearOptions();
    const [selectedMonthYear, setSelectedMonthYear] = useState(monthYearOptions[0].value);
    const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { calculateReport } = useMonthlyReport();

    const handleGenerateReport = () => {
        setIsLoading(true);
        const [year, month] = selectedMonthYear.split('-').map(Number);
        const data = calculateReport(year, month);
        setReportData(data);
        setIsLoading(false);
    };
    
    const handleDownloadPdf = () => {
        alert("PDF download functionality will be added in the next step!");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Summary Report</CardTitle>
                    <CardDescription>Generate a summary of your expenses for a selected month.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select a month" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthYearOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading ? "Generating..." : "Generate Report"}
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {reportData && !isLoading && (
                <>
                    <ReportDisplay data={reportData} />
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleDownloadPdf}>Download as PDF</Button>
                    </div>
                </>
            )}
        </div>
    );
};
