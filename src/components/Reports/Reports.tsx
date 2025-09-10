import React, { useState, useEffect } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { useProducts } from '../../contexts/ProductContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { reportsService } from '../../services/reportsService';
import { extractProductName, calculateItemTotal, getProductNameById, getItemUnitPrice } from '../../utils/productUtils';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Loader2,
  FileText,
  PieChart,
  BarChart,
  RefreshCw,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye
} from 'lucide-react';

// Add Chart.js for visualizations
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController
);

export function Reports() {
  const { sales, loading, error } = useSales();
  const { products } = useProducts();
  const { customers } = useCustomers();
  // Change default date range to 'week'
  const [dateRange, setDateRange] = useState('week');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // New state for sales records
  const [salesRecords, setSalesRecords] = useState<any[]>([]);
  const [filteredSalesRecords, setFilteredSalesRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  // Professional report colors and styles
  const reportTheme = {
    primary: 'bg-slate-700 text-white',
    secondary: 'bg-gray-100 text-gray-700',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let filteredSales = sales;
  if (dateRange === 'today') {
    filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp || sale.createdAt || new Date());
      return saleDate.toDateString() === today.toDateString();
    });
  } else if (dateRange === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    filteredSales = sales.filter(sale => new Date(sale.timestamp || sale.createdAt || new Date()) >= weekAgo);
  } else if (dateRange === 'month') {
    filteredSales = sales.filter(sale => new Date(sale.timestamp || sale.createdAt || new Date()) >= startOfMonth);
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || sale.total_price), 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Payment method breakdown with customer information
  const paymentBreakdown = filteredSales.reduce((acc, sale) => {
    const paymentMethod = sale.payment_method || (sale as any).paymentMethod || 'unknown';
    const total = sale.total || sale.total_price;
    const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
    
    if (!acc[paymentMethod]) {
      acc[paymentMethod] = { amount: 0, transactions: 0, customerSales: 0, walkInSales: 0 };
    }
    
    acc[paymentMethod].amount += total;
    acc[paymentMethod].transactions += 1;
    
    if (customer) {
      acc[paymentMethod].customerSales += 1;
    } else {
      acc[paymentMethod].walkInSales += 1;
    }
    
    return acc;
  }, {} as Record<string, { amount: number; transactions: number; customerSales: number; walkInSales: number }>);

  // Customer sales breakdown
  const customerSalesBreakdown = filteredSales
    .filter(sale => sale.customer_id)
    .reduce((acc, sale) => {
      const customer = customers.find(c => c.id === sale.customer_id);
      if (customer) {
        const key = customer.name;
        if (!acc[key]) {
          acc[key] = { 
            customerId: customer.id,
            customerName: customer.name,
            cardNumber: customer.cardRefId || customer.card_number || 'No Card',
            transactions: 0, 
            totalSpent: 0,
            averageOrder: 0
          };
        }
        acc[key].transactions += 1;
        acc[key].totalSpent += (sale.total || sale.total_price);
        acc[key].averageOrder = acc[key].totalSpent / acc[key].transactions;
      }
      return acc;
    }, {} as Record<string, { customerId: number; customerName: string; cardNumber: string; transactions: number; totalSpent: number; averageOrder: number }>);

  const topCustomers = Object.values(customerSalesBreakdown)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Top selling products
  const productSales = filteredSales
    .filter(sale => sale.items && Array.isArray(sale.items))
    .flatMap(sale => sale.items)
    .reduce((acc, item) => {
      const key = extractProductName(item, products);
      if (!acc[key]) {
        acc[key] = { quantity: 0, revenue: 0 };
      }
      acc[key].quantity += item.quantity || 0;
      acc[key].revenue += calculateItemTotal(item, products) || 0;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 5);

  // Chart data
  const paymentMethodChartData = {
    labels: Object.keys(paymentBreakdown),
    datasets: [
      {
        label: 'Payment Methods',
        data: Object.values(paymentBreakdown).map(data => data.amount),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts.map(([name]) => name),
    datasets: [
      {
        label: 'Revenue',
        data: topProducts.map(([, data]) => data.revenue),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Generate dynamic daily sales data based on actual sales
  const generateDailySalesData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay = Array(7).fill(0);
    
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp || sale.createdAt || new Date());
      const dayIndex = saleDate.getDay();
      salesByDay[dayIndex] += sale.total || sale.total_price || 0;
    });
    
    return {
      labels: days,
      datasets: [
        {
          label: 'Daily Sales',
          data: salesByDay,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const dailySalesData = generateDailySalesData();

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (content: string, filename: string) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #334155;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 80px;
            height: auto;
            margin: 0 auto 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f8fafc;
            font-weight: bold;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background-color: #f8fafc;
          }
          .summary-title {
            font-weight: bold;
            color: #475569;
            margin-bottom: 8px;
          }
          .summary-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #334155;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.svg" alt="Cafe D Revenue Logo" class="logo" />
          <h1>Cafe D Revenue</h1>
          <h2>${filename}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        ${content}
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 4px; cursor: pointer;">Print/Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const exportOverviewReport = () => {
    const overviewData = [
      {
        'Report Type': 'Overview',
        'Date Range': dateRange,
        'Total Revenue': `PKR ${totalRevenue.toLocaleString()}`,
        'Total Transactions': totalTransactions,
        'Average Order Value': `PKR ${Math.round(averageOrderValue).toLocaleString()}`,
        'Products Sold': Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0),
        'Generated At': new Date().toLocaleString()
      }
    ];

    // Add payment breakdown with customer information
    const paymentData = Object.entries(paymentBreakdown).map(([method, data]) => ({
      'Payment Method': method,
      'Amount': `PKR ${data.amount.toLocaleString()}`,
      'Transactions': data.transactions,
      'Customer Sales': data.customerSales,
      'Walk-in Sales': data.walkInSales,
      'Percentage': `${totalRevenue > 0 ? ((data.amount / totalRevenue) * 100).toFixed(1) : 0}%`
    }));

    // Add customer breakdown
    const customerData = topCustomers.map((customer, index) => ({
      'Rank': index + 1,
      'Customer Name': customer.customerName,
      'Card Number': customer.cardNumber,
      'Transactions': customer.transactions,
      'Total Spent': `PKR ${customer.totalSpent.toLocaleString()}`,
      'Average Order': `PKR ${customer.averageOrder.toFixed(0)}`
    }));

    // Add top products
    const topProductsData = topProducts.map(([name, data], index) => ({
      'Rank': index + 1,
      'Product Name': name,
      'Quantity Sold': data.quantity,
      'Revenue': `PKR ${data.revenue.toLocaleString()}`
    }));

    exportToCSV([...overviewData, ...paymentData, ...customerData, ...topProductsData], 'overview_report');
  };

  const exportCurrentReport = () => {
    if (!reportData) {
      alert('No report data to export');
      return;
    }

    try {
      let dataToExport: any[] = [];
      let filename = '';

      switch (selectedReport) {
        case 'sales_by_date':
          if (reportData.sales_by_date && reportData.sales_by_date.length > 0) {
            dataToExport = reportData.sales_by_date;
            filename = 'sales_by_date_report';
          }
          break;
        case 'sales_by_product':
          if (reportData.products && reportData.products.length > 0) {
            dataToExport = reportData.products;
            filename = 'sales_by_product_report';
          }
          break;
        case 'sales_by_salesman':
          const salesmanData = [];
          if (reportData.settled_sales) {
            salesmanData.push({ 
              Type: 'Settled Sales', 
              Count: reportData.settled_sales.count,
              'Total Amount': `PKR ${reportData.settled_sales.total_amount?.toLocaleString() || '0'}`,
              'Average Order Value': `PKR ${reportData.settled_sales.average_order_value?.toLocaleString() || '0'}`
            });
          }
          if (reportData.pending_sales) {
            salesmanData.push({ 
              Type: 'Pending Sales', 
              Count: reportData.pending_sales.count,
              'Total Amount': `PKR ${reportData.pending_sales.total_amount?.toLocaleString() || '0'}`,
              'Average Order Value': 'N/A'
            });
          }
          if (reportData.overall) {
            salesmanData.push({ 
              Type: 'Overall', 
              Count: reportData.overall.total_transactions,
              'Total Amount': `PKR ${reportData.overall.total_gross_sales?.toLocaleString() || '0'}`,
              'Settlement Rate': `${reportData.overall.settlement_rate?.toFixed(1) || '0'}%`
            });
          }
          dataToExport = salesmanData;
          filename = 'sales_summary_report';
          break;
        case 'payment_breakdown':
          if (reportData.payment_methods && reportData.payment_methods.length > 0) {
            dataToExport = reportData.payment_methods;
            filename = 'payment_breakdown_report';
          }
          break;
        default:
          alert('Export not available for this report type');
          return;
      }

      if (dataToExport.length > 0) {
        exportToCSV(dataToExport, filename);
      } else {
        alert('No data available to export for this report');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report data');
    }
  };

  const exportCurrentReportToPDF = () => {
    if (selectedReport === 'overview') {
      // Generate overview PDF content
      const content = `
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-title">Total Revenue</div>
            <div class="summary-value">PKR ${totalRevenue.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Total Transactions</div>
            <div class="summary-value">${totalTransactions}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Average Order Value</div>
            <div class="summary-value">PKR ${Math.round(averageOrderValue).toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">Products Sold</div>
            <div class="summary-value">${Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0)}</div>
          </div>
        </div>
        
        <h3>Payment Methods Breakdown</h3>
        <table>
          <tr><th>Payment Method</th><th>Amount</th><th>Transactions</th><th>Customer Sales</th><th>Walk-in Sales</th><th>Percentage</th></tr>
          ${Object.entries(paymentBreakdown).map(([method, data]) => {
            const percentage = totalRevenue > 0 ? (data.amount / totalRevenue * 100).toFixed(1) : 0;
            return `<tr><td>${method}</td><td>PKR ${data.amount.toLocaleString()}</td><td>${data.transactions}</td><td>${data.customerSales}</td><td>${data.walkInSales}</td><td>${percentage}%</td></tr>`;
          }).join('')}
        </table>
        
        <h3>Top Customers</h3>
        <table>
          <tr><th>Rank</th><th>Customer Name</th><th>Card Number</th><th>Transactions</th><th>Total Spent</th><th>Average Order</th></tr>
          ${topCustomers.map((customer, index) => 
            `<tr><td>${index + 1}</td><td>${customer.customerName}</td><td>${customer.cardNumber}</td><td>${customer.transactions}</td><td>PKR ${customer.totalSpent.toLocaleString()}</td><td>PKR ${customer.averageOrder.toFixed(0)}</td></tr>`
          ).join('')}
        </table>
        
        <h3>Top Selling Products</h3>
        <table>
          <tr><th>Rank</th><th>Product</th><th>Quantity Sold</th><th>Revenue</th></tr>
          ${topProducts.map(([name, data], index) => 
            `<tr><td>${index + 1}</td><td>${name}</td><td>${data.quantity}</td><td>PKR ${data.revenue.toLocaleString()}</td></tr>`
          ).join('')}
        </table>
      `;
      exportToPDF(content, 'Overview Report');
    } else if (reportData) {
      // Generate PDF for other reports
      const reportContent = document.querySelector('.report-content');
      if (reportContent) {
        exportToPDF(reportContent.innerHTML, `${selectedReport.replace('_', ' ')} Report`);
      }
    } else {
      alert('No report data to export');
    }
  };

  // Render report content based on type
  const renderReportContent = () => {
    if (!reportData) return null;
    
    try {
      switch (selectedReport) {
        case 'sales_by_date':
          return renderSalesByDateReport(reportData);
        case 'sales_by_product':
          return renderSalesByProductReport(reportData);
        case 'sales_by_salesman':
          return renderSalesSummaryReport(reportData);
        case 'payment_breakdown':
          return renderPaymentBreakdownReport(reportData);
        default:
          return (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          );
      }
    } catch (error) {
      return (
        <div className="text-red-600 p-4 border border-red-200 rounded">
          <p>Error parsing report data: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <details className="mt-2">
            <summary className="cursor-pointer">Raw Data</summary>
            <pre className="mt-2 text-xs">{JSON.stringify(reportData, null, 2)}</pre>
          </details>
        </div>
      );
    }
  };
  
  const renderSalesByDateReport = (data: any) => (
    <div className="space-y-4">
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900">Total Sales</h4>
            <p className="text-2xl font-bold text-blue-600">PKR {data.summary.total_sales?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900">Total Transactions</h4>
            <p className="text-2xl font-bold text-green-600">{data.summary.total_transactions || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900">Avg Daily Sales</h4>
            <p className="text-2xl font-bold text-purple-600">PKR {data.summary.average_daily_sales?.toLocaleString() || '0'}</p>
          </div>
        </div>
      )}
      
      {data.sales_by_date && data.sales_by_date.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Date</th>
                <th className="border border-gray-300 p-2 text-right">Transactions</th>
                <th className="border border-gray-300 p-2 text-right">Total Sales</th>
                <th className="border border-gray-300 p-2 text-right">Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {data.sales_by_date.map((row: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2">{row.date}</td>
                  <td className="border border-gray-300 p-2 text-right">{row.transaction_count}</td>
                  <td className="border border-gray-300 p-2 text-right">PKR {row.total_sales?.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">PKR {row.average_order_value?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No sales data available for the selected date range.</p>
      )}
    </div>
  );
  
  const renderSalesByProductReport = (data: any) => (
    <div className="space-y-4">
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900">Total Revenue</h4>
            <p className="text-2xl font-bold text-amber-600">PKR {data.summary.total_revenue?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900">Total Quantity Sold</h4>
            <p className="text-2xl font-bold text-indigo-600">{data.summary.total_quantity_sold || 0}</p>
          </div>
        </div>
      )}
      
      {data.products && data.products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Product</th>
                <th className="border border-gray-300 p-2 text-right">Quantity Sold</th>
                <th className="border border-gray-300 p-2 text-right">Revenue</th>
                <th className="border border-gray-300 p-2 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2 font-medium">{product.product_name}</td>
                  <td className="border border-gray-300 p-2 text-right">{product.quantity_sold}</td>
                  <td className="border border-gray-300 p-2 text-right">PKR {product.total_revenue?.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{product.percentage_of_total}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No product sales data available for the selected date range.</p>
      )}
    </div>
  );
  
  const renderSalesSummaryReport = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.settled_sales && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Settled Sales</h4>
            <p className="text-lg font-bold text-green-600">Count: {data.settled_sales.count}</p>
            <p className="text-lg font-bold text-green-600">Amount: PKR {data.settled_sales.total_amount?.toLocaleString()}</p>
            <p className="text-sm text-green-700">Avg: PKR {data.settled_sales.average_order_value?.toLocaleString()}</p>
          </div>
        )}
        
        {data.pending_sales && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">Pending Sales</h4>
            <p className="text-lg font-bold text-orange-600">Count: {data.pending_sales.count}</p>
            <p className="text-lg font-bold text-orange-600">Amount: PKR {data.pending_sales.total_amount?.toLocaleString()}</p>
          </div>
        )}
      </div>
      
      {data.overall && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Overall Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Transactions</p>
              <p className="text-xl font-bold text-blue-600">{data.overall.total_transactions}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Gross Sales</p>
              <p className="text-xl font-bold text-blue-600">PKR {data.overall.total_gross_sales?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Settlement Rate</p>
              <p className="text-xl font-bold text-blue-600">{data.overall.settlement_rate?.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderPaymentBreakdownReport = (data: any) => (
    <div className="space-y-4">
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <h4 className="font-semibold text-teal-900">Total Amount</h4>
            <p className="text-2xl font-bold text-teal-600">PKR {data.summary.total_amount?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <h4 className="font-semibold text-cyan-900">Total Transactions</h4>
            <p className="text-2xl font-bold text-cyan-600">{data.summary.total_transactions || 0}</p>
          </div>
        </div>
      )}
      
      {data.payment_methods && data.payment_methods.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Payment Method</th>
                  <th className="border border-gray-300 p-2 text-right">Transactions</th>
                  <th className="border border-gray-300 p-2 text-right">Total Amount</th>
                  <th className="border border-gray-300 p-2 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.payment_methods.map((method: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-2 font-medium capitalize">{method.payment_method}</td>
                    <td className="border border-gray-300 p-2 text-right">{method.transaction_count}</td>
                    <td className="border border-gray-300 p-2 text-right">PKR {method.total_amount?.toLocaleString()}</td>
                    <td className="border border-gray-300 p-2 text-right">{method.percentage_of_total}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Visual breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Payment Method Distribution</h4>
            <div className="space-y-2">
              {data.payment_methods.map((method: any, index: number) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={'w-4 h-4 rounded ' + colors[index % colors.length]}></div>
                      <span className="capitalize font-medium">{method.payment_method}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{method.percentage_of_total}%</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={'h-2 rounded-full ' + colors[index % colors.length]}
                          style={{ width: method.percentage_of_total + '%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No payment data available for the selected date range.</p>
      )}
    </div>
  );

  // Helper function to get date range
  const getDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (dateRange) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'month':
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'custom':
        return {
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate
        };
      default:
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
    }
  };

  // Fetch reports from API
  const fetchReport = async (reportType: string) => {
    setReportLoading(true);
    setReportError(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      let data: any;
      
      switch (reportType) {
        case 'sales_by_date':
          data = await reportsService.getSalesByDate(startDate, endDate);
          break;
        case 'sales_by_product':
          data = await reportsService.getSalesByProduct(startDate, endDate);
          break;
        case 'sales_by_salesman':
          data = await reportsService.getSalesBySalesman(startDate, endDate);
          break;
        case 'payment_breakdown':
          data = await reportsService.getPaymentBreakdown();
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(data);
      setLastUpdated(new Date().toLocaleString());
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      setReportError(error.message || 'Failed to fetch report');
    } finally {
      setReportLoading(false);
    }
  };

  // Handle report selection
  const handleReportSelect = (reportType: string) => {
    setSelectedReport(reportType);
    if (reportType !== 'overview' && reportType !== 'sales_records') {
      fetchReport(reportType);
    }
  };

  // Initialize sales records
  useEffect(() => {
    setSalesRecords(filteredSales);
    setFilteredSalesRecords(filteredSales);
  }, [filteredSales]);

  // Filter sales records based on search and payment method
  useEffect(() => {
    let result = [...salesRecords];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => {
        const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
        const customerName = customer ? customer.name.toLowerCase() : '';
        const invoiceNumber = sale.invoiceNumber ? sale.invoiceNumber.toLowerCase() : '';
        const items = sale.items && Array.isArray(sale.items) 
          ? sale.items.map((item: any) => extractProductName(item, products)).join(' ').toLowerCase()
          : '';
        
        return (
          customerName.includes(term) ||
          invoiceNumber.includes(term) ||
          items.includes(term) ||
          (sale.total || sale.total_price || 0).toString().includes(term)
        );
      });
    }
    
    // Apply payment method filter
    if (selectedPaymentMethod !== 'all') {
      result = result.filter(sale => 
        (sale.payment_method || (sale as any).paymentMethod || 'unknown') === selectedPaymentMethod
      );
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'date':
            aValue = new Date(a.timestamp || a.createdAt || new Date()).getTime();
            bValue = new Date(b.timestamp || b.createdAt || new Date()).getTime();
            break;
          case 'customer':
            const aCustomer = a.customer_id ? customers.find(c => c.id === a.customer_id) : null;
            const bCustomer = b.customer_id ? customers.find(c => c.id === b.customer_id) : null;
            aValue = aCustomer ? aCustomer.name : 'Walk-in Customer';
            bValue = bCustomer ? bCustomer.name : 'Walk-in Customer';
            break;
          case 'amount':
            aValue = a.total || a.total_price || 0;
            bValue = b.total || b.total_price || 0;
            break;
          case 'invoice':
            aValue = a.invoiceNumber || '';
            bValue = b.invoiceNumber || '';
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredSalesRecords(result);
  }, [salesRecords, searchTerm, selectedPaymentMethod, sortConfig, customers, products]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const reportStats = [
    {
      title: 'Total Revenue',
      value: `PKR ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Avg Order Value',
      value: `PKR ${Math.round(averageOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Products Sold',
      value: Object.values(productSales).reduce((sum, p) => sum + p.quantity, 0).toString(),
      icon: Package,
      color: 'bg-slate-500'
    }
  ];

  if (loading && sales.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your cafe revenue management</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-amber-900 focus:ring-amber-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">Auto-refresh</label>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button
            onClick={() => selectedReport !== 'overview' && selectedReport !== 'sales_records' && fetchReport(selectedReport)}
            disabled={reportLoading}
            className={`${reportTheme.primary} px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2 disabled:opacity-50`}
          >
            <RefreshCw size={16} className={reportLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={exportOverviewReport}
            className={`${reportTheme.primary} px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2`}
          >
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Input */}
      {dateRange === 'custom' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => handleReportSelect('overview')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'overview'
                ? 'border-slate-700 bg-slate-50 text-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Overview</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_records')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_records'
                ? 'border-slate-700 bg-slate-50 text-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales Records</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_by_date')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_by_date'
                ? 'border-slate-700 bg-slate-50 text-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales by Date</span>
          </button>
          <button
            onClick={() => handleReportSelect('sales_by_product')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'sales_by_product'
                ? 'border-slate-700 bg-slate-50 text-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Sales by Product</span>
          </button>
          <button
            onClick={() => handleReportSelect('payment_breakdown')}
            className={`p-4 rounded-lg border transition-colors ${
              selectedReport === 'payment_breakdown'
                ? 'border-slate-700 bg-slate-50 text-slate-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PieChart className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Payment Breakdown</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {reportError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{reportError}</p>
        </div>
      )}

      {/* Report Content */}
      {selectedReport === 'overview' ? (
        <>          
          {/* Stats Grid with Export */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overview Statistics</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const statsData = reportStats.map(stat => ({
                      'Metric': stat.title,
                      'Value': stat.value
                    }));
                    exportToCSV(statsData, 'overview_statistics');
                  }}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportCurrentReportToPDF}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <FileText size={12} />
                  <span>Full PDF</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reportStats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
              <div className="h-80">
                <Pie data={paymentMethodChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Top Products Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
              <div className="h-80">
                <Bar data={topProductsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Daily Sales Trend Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Sales Trend</h3>
            <div className="h-80">
              <Line data={dailySalesData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Payment Methods</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const paymentData = Object.entries(paymentBreakdown).map(([method, data]) => ({
                    'Payment Method': method,
                    'Amount': `PKR ${data.amount.toLocaleString()}`,
                    'Transactions': data.transactions,
                    'Customer Sales': data.customerSales,
                    'Walk-in Sales': data.walkInSales,
                    'Percentage': `${totalRevenue > 0 ? ((data.amount / totalRevenue) * 100).toFixed(1) : 0}%`
                  }));
                  exportToCSV(paymentData, 'payment_methods');
                }}
                className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => {
                  const content = `
                    <h3>Payment Methods Breakdown</h3>
                    <table>
                      <tr><th>Payment Method</th><th>Amount</th><th>Transactions</th><th>Customer Sales</th><th>Walk-in Sales</th><th>Percentage</th></tr>
                      ${Object.entries(paymentBreakdown).map(([method, data]) => {
                        const percentage = totalRevenue > 0 ? (data.amount / totalRevenue * 100).toFixed(1) : 0;
                        return `<tr><td>${method}</td><td>PKR ${data.amount.toLocaleString()}</td><td>${data.transactions}</td><td>${data.customerSales}</td><td>${data.walkInSales}</td><td>${percentage}%</td></tr>`;
                      }).join('')}
                    </table>
                  `;
                  exportToPDF(content, 'Payment Methods Report');
                }}
                className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
              >
                <FileText size={12} />
                <span>PDF</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(paymentBreakdown).map(([method, data]) => {
              const percentage = totalRevenue > 0 ? (data.amount / totalRevenue * 100) : 0;
              return (
                <div key={method} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="capitalize font-semibold text-lg">{method}</span>
                    <span className="text-lg font-bold">PKR {data.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}% of total</span>
                    <span className="text-sm font-medium">{data.transactions} transactions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="text-center">
                      <span className="font-medium">{data.customerSales}</span>
                      <p className="text-xs">Customer Sales</p>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">{data.walkInSales}</span>
                      <p className="text-xs">Walk-in Sales</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-slate-700 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Customers & Top Products Combined */}
        <div className="space-y-8">
          {/* Top Customers */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Top Customers</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const customerData = topCustomers.map((customer, index) => ({
                      'Rank': index + 1,
                      'Customer Name': customer.customerName,
                      'Card Number': customer.cardNumber,
                      'Transactions': customer.transactions,
                      'Total Spent': `PKR ${customer.totalSpent.toLocaleString()}`,
                      'Average Order': `PKR ${customer.averageOrder.toFixed(0)}`
                    }));
                    exportToCSV(customerData, 'top_customers');
                  }}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => {
                    const content = `
                      <h3>Top Customers</h3>
                      <table>
                        <tr><th>Rank</th><th>Customer Name</th><th>Card Number</th><th>Transactions</th><th>Total Spent</th><th>Average Order</th></tr>
                        ${topCustomers.map((customer, index) => 
                          `<tr><td>${index + 1}</td><td>${customer.customerName}</td><td>${customer.cardNumber}</td><td>${customer.transactions}</td><td>PKR ${customer.totalSpent.toLocaleString()}</td><td>PKR ${customer.averageOrder.toFixed(0)}</td></tr>`
                        ).join('')}
                      </table>
                    `;
                    exportToPDF(content, 'Top Customers Report');
                  }}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <FileText size={12} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {topCustomers.length > 0 ? topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{customer.customerName}</p>
                      <p className="text-sm text-gray-600">Card: {customer.cardNumber}</p>
                      <p className="text-xs text-gray-500">{customer.transactions} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">PKR {customer.totalSpent.toLocaleString()}</span>
                    <p className="text-sm text-gray-500">Avg: PKR {customer.averageOrder.toFixed(0)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-8">No customer sales data available</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Top Selling Products</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const topProductsData = topProducts.map(([name, data], index) => ({
                      'Rank': index + 1,
                      'Product Name': name,
                      'Quantity Sold': data.quantity,
                      'Revenue': `PKR ${data.revenue.toLocaleString()}`
                    }));
                    exportToCSV(topProductsData, 'top_products');
                  }}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => {
                    const content = `
                      <h3>Top Selling Products</h3>
                      <table>
                        <tr><th>Rank</th><th>Product</th><th>Quantity Sold</th><th>Revenue</th></tr>
                        ${topProducts.map(([name, data], index) => 
                          `<tr><td>${index + 1}</td><td>${name}</td><td>${data.quantity}</td><td>PKR ${data.revenue.toLocaleString()}</td></tr>`
                        ).join('')}
                      </table>
                    `;
                    exportToPDF(content, 'Top Products Report');
                  }}
                  className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
                >
                  <FileText size={12} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {topProducts.length > 0 ? topProducts.map(([productName, data], index) => (
                <div key={productName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-amber-900 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{productName}</p>
                      <p className="text-sm text-gray-600">{data.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-900">PKR {data.revenue.toLocaleString()}</span>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-8">No product sales data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const transactionsData = filteredSales.slice(-10).reverse().map((sale) => {
                  const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                  return {
                    'Invoice': sale.invoiceNumber,
                    'Customer': customer ? customer.name : 'Walk-in Customer',
                    'Card Number': customer ? (customer.cardRefId || customer.card_number || 'No Card') : 'N/A',
                    'Items': sale.items && sale.items.length > 0 ? sale.items.map((item: any) => extractProductName(item, products)).join(', ') : 'No items',
                    'Payment Method': ((sale.payment_method || (sale as any).paymentMethod) || 'Unknown').toUpperCase(),
                    'Amount': `PKR ${(sale.total || sale.total_price || 0).toLocaleString()}`,
                    'Date': new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleDateString(),
                    'Time': new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()
                  };
                });
                exportToCSV(transactionsData, 'recent_transactions');
              }}
              className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
            >
              <Download size={12} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => {
                const content = `
                  <h3>Recent Transactions</h3>
                  <table>
                    <tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Payment</th><th>Amount</th><th>Date & Time</th></tr>
                    ${filteredSales.slice(-10).reverse().map((sale) => {
                      const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                      const customerName = customer ? customer.name : 'Walk-in Customer';
                      const items = sale.items && sale.items.length > 0 ? sale.items.map(item => extractProductName(item, products)).join(', ') : 'No items';
                      const payment = ((sale.payment_method || (sale as any).paymentMethod) || 'Unknown').toUpperCase();
                      const amount = `PKR ${(sale.total || sale.total_price || 0).toLocaleString()}`;
                      const dateTime = `${new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleDateString()} ${new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()}`;
                      return `<tr><td>${sale.invoiceNumber}</td><td>${customerName}</td><td>${items}</td><td>${payment}</td><td>${amount}</td><td>${dateTime}</td></tr>`;
                    }).join('')}
                  </table>
                `;
                exportToPDF(content, 'Recent Transactions Report');
              }}
              className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors flex items-center space-x-1"
            >
              <FileText size={12} />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Invoice</th>
                <th className="text-left py-3 font-medium text-gray-700">Customer</th>
                <th className="text-left py-3 font-medium text-gray-700">Items</th>
                <th className="text-left py-3 font-medium text-gray-700">Payment</th>
                <th className="text-left py-3 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 font-medium text-gray-700">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(-10).reverse().map((sale) => {
                const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                return (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium">{sale.invoiceNumber}</td>
                    <td className="py-3 text-gray-600">
                      {customer ? (
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.cardRefId || customer.card_number || 'No Card'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Walk-in Customer</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-600">
                      {sale.items && sale.items.length > 0 ? sale.items.map(item => extractProductName(item, products)).join(', ') : 'No items'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (sale.payment_method || (sale as any).paymentMethod) === 'cash' ? 'bg-green-100 text-green-800' :
                        (sale.payment_method || (sale as any).paymentMethod) === 'card' ? 'bg-blue-100 text-blue-800' :
                        (sale.payment_method || (sale as any).paymentMethod) === 'easypaisa' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {((sale.payment_method || (sale as any).paymentMethod) || 'Unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">PKR {(sale.total || sale.total_price || 0).toLocaleString()}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleDateString()} {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
    ) : selectedReport === 'sales_records' ? (
      /* Detailed Sales Records Section */
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Sales Records</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {getDateRange().startDate} to {getDateRange().endDate}
            </span>
            <button
              onClick={() => {
                const salesData = filteredSalesRecords.map(sale => {
                  const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                  return {
                    'Invoice': sale.invoiceNumber,
                    'Customer': customer ? customer.name : 'Walk-in Customer',
                    'Card Number': customer ? (customer.cardRefId || customer.card_number || 'No Card') : 'N/A',
                    'Items': sale.items && sale.items.length > 0 ? sale.items.map((item: any) => extractProductName(item, products)).join(', ') : 'No items',
                    'Payment Method': ((sale.payment_method || (sale as any).paymentMethod) || 'Unknown').toUpperCase(),
                    'Amount': `PKR ${(sale.total || sale.total_price || 0).toLocaleString()}`,
                    'Date': new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleDateString(),
                    'Time': new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()
                  };
                });
                exportToCSV(salesData, 'detailed_sales_records');
              }}
              className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600 flex items-center space-x-1"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer, invoice, items, or amount..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>
        </div>

        {/* Sales Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('invoice')}
                >
                  <div className="flex items-center">
                    <span>Invoice</span>
                    {sortConfig?.key === 'invoice' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center">
                    <span>Customer</span>
                    {sortConfig?.key === 'customer' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 font-medium text-gray-700">Items</th>
                <th 
                  className="text-left py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    <span>Amount</span>
                    {sortConfig?.key === 'amount' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    <span>Date & Time</span>
                    {sortConfig?.key === 'date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 font-medium text-gray-700">Payment</th>
                <th className="text-left py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesRecords.length > 0 ? (
                filteredSalesRecords.map((sale) => {
                  const customer = sale.customer_id ? customers.find(c => c.id === sale.customer_id) : null;
                  return (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{sale.invoiceNumber}</td>
                      <td className="py-3 text-gray-600">
                        {customer ? (
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.cardRefId || customer.card_number || 'No Card'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {sale.items && sale.items.length > 0 ? (
                            sale.items.map((item: any, index: number) => (
                              <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {extractProductName(item, products)} x{item.quantity}
                              </span>
                            ))
                          ) : (
                            <span>No items</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-semibold">PKR {(sale.total || sale.total_price || 0).toLocaleString()}</td>
                      <td className="py-3 text-gray-500">
                        <div>
                          {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          {new Date(sale.createdAt || sale.timestamp || new Date()).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (sale.payment_method || (sale as any).paymentMethod) === 'cash' ? 'bg-green-100 text-green-800' :
                          (sale.payment_method || (sale as any).paymentMethod) === 'card' ? 'bg-blue-100 text-blue-800' :
                          (sale.payment_method || (sale as any).paymentMethod) === 'easypaisa' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {((sale.payment_method || (sale as any).paymentMethod) || 'Unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-slate-600 hover:text-slate-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No sales records found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredSalesRecords.length} of {salesRecords.length} records
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 text-sm bg-slate-700 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded">
              Next
            </button>
          </div>
        </div>
      </div>
    ) : (
        /* API Report Display */
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedReport === 'sales_by_date' && 'Sales by Date Report'}
              {selectedReport === 'sales_by_product' && 'Sales by Product Report'}
              {selectedReport === 'sales_by_salesman' && 'Sales Summary Report'}
              {selectedReport === 'payment_breakdown' && 'Payment Breakdown Report'}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {getDateRange().startDate} to {getDateRange().endDate}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchReport(selectedReport)}
                  disabled={reportLoading}
                  className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 flex items-center space-x-1"
                >
                  <RefreshCw size={12} className={reportLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={exportCurrentReport}
                  disabled={!reportData}
                  className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Download size={12} />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportCurrentReportToPDF}
                  disabled={!reportData}
                  className="px-3 py-1 text-sm bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 flex items-center space-x-1"
                >
                  <FileText size={12} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
                <p className="text-gray-600">Loading report data...</p>
              </div>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 report-content">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Data</h3>
                {renderReportContent()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Click "Refresh" to load report data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}