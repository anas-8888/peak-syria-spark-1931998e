import ExcelJS from 'exceljs';
import { format } from 'date-fns';

interface ExportData {
  title: string;
  period: string;
  dateRange?: { from: Date | null; to: Date | null };
  stats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  categoryData?: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  topProducts?: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders?: Array<{
    id: string;
    customer: string;
    product: string;
    amount: string;
    status: string;
    date: string;
  }>;
  formatPrice: (price: number) => string;
  t: (key: string) => string;
}

export const exportToExcel = async (data: ExportData) => {
  const workbook = new ExcelJS.Workbook();
  
  // Helper function to format dates
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Get period label
  const getPeriodLabel = () => {
    if (data.period === 'all') {
      return data.t('All Time');
    } else if (data.period === 'custom' && data.dateRange?.from && data.dateRange?.to) {
      return `${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`;
    } else if (data.period === '7days') {
      return data.t('Last 7 Days');
    } else if (data.period === '30days') {
      return data.t('Last 30 Days');
    } else if (data.period === '3months') {
      return data.t('Last 3 Months');
    } else if (data.period === '6months') {
      return data.t('Last 6 Months');
    } else if (data.period === '1year') {
      return data.t('Last Year');
    } else if (data.period === '2years') {
      return data.t('Last 2 Years');
    }
    return data.t('All Time');
  };

  // Define colors
  const colors = {
    primary: 'FF1E40E5', // Blue
    secondary: 'FF2D3748', // Dark Gray
    accent: 'FF10B981', // Green
    headerBg: 'FFE0E7FF', // Light Blue
    border: 'FFCBD5E0', // Light Gray
    text: 'FF1A202C', // Dark Text
    success: 'FF10B981',
    warning: 'FFF59E0B',
  };

  // Sheet 1: Summary & Statistics
  const summarySheet = workbook.addWorksheet(data.t('Summary'));
  
  // Set column widths
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 35;

  // Add NEXA Group header
  const companyRow = summarySheet.addRow(['NEXA Group']);
  companyRow.getCell(1).font = { name: 'Arial', size: 20, bold: true, color: { argb: colors.primary } };
  companyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  companyRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors.headerBg }
  };
  summarySheet.mergeCells('A1:B1');
  companyRow.height = 35;

  // Add title
  const titleRow = summarySheet.addRow([data.title]);
  titleRow.getCell(1).font = { name: 'Arial', size: 16, bold: true, color: { argb: colors.text } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.mergeCells('A2:B2');
  titleRow.height = 25;

  // Add empty row
  summarySheet.addRow([]);

  // Add report info
  const periodRow = summarySheet.addRow([data.t('Report Period') + ':', getPeriodLabel()]);
  periodRow.getCell(1).font = { bold: true };
  periodRow.getCell(2).font = { color: { argb: colors.text } };

  const dateRow = summarySheet.addRow([data.t('Generated Date') + ':', format(new Date(), 'yyyy-MM-dd HH:mm:ss')]);
  dateRow.getCell(1).font = { bold: true };
  dateRow.getCell(2).font = { color: { argb: colors.text } };

  // Add empty row
  summarySheet.addRow([]);

  // Add Key Statistics header
  const statsHeaderRow = summarySheet.addRow([data.t('Key Statistics')]);
  statsHeaderRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  statsHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors.primary }
  };
  statsHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.mergeCells('A7:B7');
  statsHeaderRow.height = 25;

  // Add statistics
  const statsRows = [
    [data.t('Total Revenue') + ':', data.formatPrice(data.stats.totalRevenue)],
    [data.t('Total Orders') + ':', data.stats.totalOrders.toString()],
    [data.t('Average Order Value') + ':', data.formatPrice(data.stats.avgOrderValue)],
    [data.t('Revenue Growth') + ':', `${data.stats.revenueGrowth >= 0 ? '+' : ''}${data.stats.revenueGrowth.toFixed(2)}%`],
    [data.stats.revenueGrowth >= 0 ? data.t('Orders Growth') + ':' : data.t('Orders Growth') + ':', `${data.stats.ordersGrowth >= 0 ? '+' : ''}${data.stats.ordersGrowth.toFixed(2)}%`],
  ];

  statsRows.forEach((row, index) => {
    const statRow = summarySheet.addRow(row);
    statRow.getCell(1).font = { bold: true, color: { argb: colors.text } };
    statRow.getCell(2).font = { color: { argb: colors.text } };
    
    // Add borders
    statRow.getCell(1).border = {
      top: { style: 'thin', color: { argb: colors.border } },
      bottom: { style: 'thin', color: { argb: colors.border } },
      left: { style: 'thin', color: { argb: colors.border } },
      right: { style: 'thin', color: { argb: colors.border } },
    };
    statRow.getCell(2).border = {
      top: { style: 'thin', color: { argb: colors.border } },
      bottom: { style: 'thin', color: { argb: colors.border } },
      left: { style: 'thin', color: { argb: colors.border } },
      right: { style: 'thin', color: { argb: colors.border } },
    };

    // Color growth cells
    if (row[0].includes('Growth')) {
      const growthValue = parseFloat(row[1].replace(/[+%]/g, ''));
      statRow.getCell(2).font = { 
        color: { argb: growthValue >= 0 ? colors.success : 'FFFF0000' },
        bold: true 
      };
    }
  });

  // Sheet 2: Monthly/Period Data with Chart
  const trendSheet = workbook.addWorksheet(data.t('Trend Data'));
  
  trendSheet.getColumn(1).width = 25;
  trendSheet.getColumn(2).width = 20;
  trendSheet.getColumn(3).width = 15;

  // Add header
  const trendHeaderRow = trendSheet.addRow([
    data.t('Period'),
    data.t('Revenue'),
    data.t('Orders')
  ]);

  trendHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.primary }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: colors.border } },
      bottom: { style: 'thin', color: { argb: colors.border } },
      left: { style: 'thin', color: { argb: colors.border } },
      right: { style: 'thin', color: { argb: colors.border } },
    };
  });
  trendHeaderRow.height = 25;

  // Add data rows
  data.monthlyData.forEach((item) => {
    const row = trendSheet.addRow([
      item.month,
      item.revenue, // Store as number for chart
      item.orders
    ]);

    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'right', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } },
      };
      
      // Format revenue column
      if (colNumber === 2) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // Note: Charts are not supported in ExcelJS browser version
  // Data is formatted and ready for manual chart creation in Excel

  // Sheet 3: Category Distribution (if available)
  if (data.categoryData && data.categoryData.length > 0) {
    const categorySheet = workbook.addWorksheet(data.t('Category Sales'));
    
    categorySheet.getColumn(1).width = 30;
    categorySheet.getColumn(2).width = 20;
    categorySheet.getColumn(3).width = 15;

    const categoryHeaderRow = categorySheet.addRow([
      data.t('Category'),
      data.t('Sales'),
      data.t('Percentage')
    ]);

    categoryHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } },
      };
    });
    categoryHeaderRow.height = 25;

    data.categoryData.forEach((item) => {
      const row = categorySheet.addRow([
        item.name,
        item.value, // Store as number for chart
        item.percentage
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'right', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } },
        };
        
        if (colNumber === 2) {
          cell.numFmt = '#,##0.00';
        }
        if (colNumber === 3) {
          cell.numFmt = '0.0"%"';
        }
      });
    });

    // Note: Charts are not supported in ExcelJS browser version
    // Data is formatted and ready for manual chart creation in Excel
  }

  // Sheet 4: Top Products (if available)
  if (data.topProducts && data.topProducts.length > 0) {
    const productsSheet = workbook.addWorksheet(data.t('Top Products'));
    
    productsSheet.getColumn(1).width = 10;
    productsSheet.getColumn(2).width = 35;
    productsSheet.getColumn(3).width = 15;
    productsSheet.getColumn(4).width = 20;

    const productsHeaderRow = productsSheet.addRow([
      data.t('Rank'),
      data.t('Product Name'),
      data.t('Units Sold'),
      data.t('Revenue')
    ]);

    productsHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } },
      };
    });
    productsHeaderRow.height = 25;

    data.topProducts.forEach((item, index) => {
      const row = productsSheet.addRow([
        index + 1,
        item.name,
        item.sales,
        item.revenue // Store as number
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { 
          horizontal: colNumber === 2 ? 'left' : 'center', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } },
        };
        
        if (colNumber === 4) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // Note: Charts are not supported in ExcelJS browser version
    // Data is formatted and ready for manual chart creation in Excel
  }

  // Sheet 5: Recent Orders (if available)
  if (data.recentOrders && data.recentOrders.length > 0) {
    const ordersSheet = workbook.addWorksheet(data.t('Recent Orders'));
    
    ordersSheet.getColumn(1).width = 15;
    ordersSheet.getColumn(2).width = 25;
    ordersSheet.getColumn(3).width = 30;
    ordersSheet.getColumn(4).width = 20;
    ordersSheet.getColumn(5).width = 15;
    ordersSheet.getColumn(6).width = 15;

    const ordersHeaderRow = ordersSheet.addRow([
      data.t('Order ID'),
      data.t('Customer'),
      data.t('Product'),
      data.t('Amount'),
      data.t('Status'),
      data.t('Date')
    ]);

    ordersHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } },
      };
    });
    ordersHeaderRow.height = 25;

    data.recentOrders.forEach((item) => {
      const row = ordersSheet.addRow([
        item.id,
        item.customer,
        item.product,
        parseFloat(item.amount.replace(/[^\d.-]/g, '')) || 0, // Extract number
        item.status,
        item.date
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { 
          horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 ? 'center' : 'left', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } },
        };
        
        if (colNumber === 4) {
          cell.numFmt = '#,##0.00';
        }
      });
    });
  }

  // Generate filename with date and period
  const filename = `${data.title.replace(/\s+/g, '_')}_${getPeriodLabel().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  
  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
