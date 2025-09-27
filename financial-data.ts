import * as XLSX from 'xlsx';

export interface FinancialRecord {
  month: string;
  entity: string;
  account_category: string;
  amount: number;
  currency: string;
}

export interface ProcessedMetrics {
  revenue: { actual: number; budget?: number; };
  cogs: number;
  grossMargin: number;
  grossMarginPercent: number;
  opex: { [category: string]: number };
  totalOpex: number;
  ebitda: number;
  month: string;
}

// Enhanced Exchange rates with real data
const FX_RATES: { [key: string]: { [month: string]: number } } = {};

export interface CashBalance {
  month: string;
  entity: string;
  balance: number;
  currency: string;
}

export interface FXRate {
  month: string;
  currency: string;
  rate: number;
}

class FinancialDataProcessor {
  private actualsData: FinancialRecord[] = [];
  private budgetData: FinancialRecord[] = [];
  private fxRates: FXRate[] = [];
  private cashData: CashBalance[] = [];

  async loadData() {
    try {
      const response = await fetch('/data/financial-data-complete.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      console.log('Available sheets:', workbook.SheetNames);

      // Load actuals (first sheet)
      if (workbook.SheetNames.length > 0) {
        const actualsSheet = workbook.Sheets[workbook.SheetNames[0]];
        this.actualsData = XLSX.utils.sheet_to_json(actualsSheet) as FinancialRecord[];
      }

      // Load budget data (second sheet)
      if (workbook.SheetNames.length > 1) {
        const budgetSheet = workbook.Sheets[workbook.SheetNames[1]];
        this.budgetData = XLSX.utils.sheet_to_json(budgetSheet) as FinancialRecord[];
      }

      // Load FX rates (third sheet)
      if (workbook.SheetNames.length > 2) {
        const fxSheet = workbook.Sheets[workbook.SheetNames[2]];
        this.fxRates = XLSX.utils.sheet_to_json(fxSheet) as FXRate[];
        this.buildFXLookup();
      }

      // Simulate cash data based on EBITDA flows
      this.generateCashData();

      console.log('Financial data loaded:', {
        actuals: this.actualsData.length,
        budget: this.budgetData.length,
        fx: this.fxRates.length,
        cash: this.cashData.length
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
      // Fallback to previous simple structure
      this.loadFallbackData();
    }
  }

  private buildFXLookup() {
    this.fxRates.forEach(rate => {
      if (!FX_RATES[rate.currency]) {
        FX_RATES[rate.currency] = {};
      }
      FX_RATES[rate.currency][rate.month] = rate.rate;
    });
  }

  private async loadFallbackData() {
    try {
      const response = await fetch('/data/financials.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const actualsSheet = workbook.Sheets[workbook.SheetNames[0]];
      this.actualsData = XLSX.utils.sheet_to_json(actualsSheet) as FinancialRecord[];
    } catch (error) {
      console.error('Failed to load fallback data:', error);
    }
  }

  private convertToUSD(amount: number, currency: string, month?: string): number {
    if (currency === 'USD') return amount;
    
    // Use real FX rates if available
    if (month && FX_RATES[currency] && FX_RATES[currency][month]) {
      return amount * FX_RATES[currency][month];
    }
    
    // Fallback rates
    const fallbackRates: { [key: string]: number } = {
      USD: 1.0,
      EUR: 1.08,
      GBP: 1.25,
    };
    
    return amount * (fallbackRates[currency] || 1);
  }

  private generateCashData() {
    // Generate realistic cash flow data based on EBITDA
    const monthlyMetrics = this.getMonthlyMetrics();
    let cashBalance = 2500000; // Starting cash position
    
    this.cashData = monthlyMetrics.map(metric => {
      const netCashFlow = metric.ebitda * 0.8; // Assume 80% of EBITDA converts to cash
      cashBalance += netCashFlow;
      
      return {
        month: metric.month,
        entity: 'Consolidated',
        balance: Math.max(0, cashBalance), // Don't go negative
        currency: 'USD'
      };
    });
  }

  private aggregateByMonth(data: FinancialRecord[]): { [month: string]: { [category: string]: number } } {
    const result: { [month: string]: { [category: string]: number } } = {};
    
    data.forEach(record => {
      const month = record.month;
      const category = record.account_category;
      const amountUSD = this.convertToUSD(record.amount, record.currency, month);
      
      if (!result[month]) result[month] = {};
      if (!result[month][category]) result[month][category] = 0;
      
      result[month][category] += amountUSD;
    });
    
    return result;
  }

  getMonthlyMetrics(): ProcessedMetrics[] {
    const monthlyData = this.aggregateByMonth(this.actualsData);
    const budgetData = this.aggregateByMonth(this.budgetData);
    
    return Object.entries(monthlyData).map(([month, categories]) => {
      const revenue = categories['Revenue'] || 0;
      const cogs = categories['COGS'] || 0;
      const grossMargin = revenue - cogs;
      const grossMarginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
      
      // Calculate Opex by category
      const opex: { [category: string]: number } = {};
      let totalOpex = 0;
      
      Object.entries(categories).forEach(([category, amount]) => {
        if (category.startsWith('Opex:')) {
          const opexCategory = category.replace('Opex:', '');
          opex[opexCategory] = amount;
          totalOpex += amount;
        }
      });
      
      const ebitda = grossMargin - totalOpex;
      
      return {
        month,
        revenue: { 
          actual: revenue, 
          budget: budgetData[month]?.['Revenue'] 
        },
        cogs,
        grossMargin,
        grossMarginPercent,
        opex,
        totalOpex,
        ebitda
      };
    }).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  getRevenueVsBudget(month?: string): { actual: number; budget: number; variance: number; variancePercent: number } {
    const metrics = this.getMonthlyMetrics();
    
    if (month) {
      const monthMetrics = metrics.find(m => m.month === month);
      if (monthMetrics) {
        const actual = monthMetrics.revenue.actual;
        const budget = monthMetrics.revenue.budget || 0;
        const variance = actual - budget;
        const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
        
        return { actual, budget, variance, variancePercent };
      }
    }
    
    // Return latest month if no specific month requested
    const latest = metrics[metrics.length - 1];
    const actual = latest.revenue.actual;
    const budget = latest.revenue.budget || 0;
    const variance = actual - budget;
    const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
    
    return { actual, budget, variance, variancePercent };
  }

  getGrossMarginTrend(months: number = 3): ProcessedMetrics[] {
    const metrics = this.getMonthlyMetrics();
    return metrics.slice(-months);
  }

  getOpexBreakdown(month?: string): { [category: string]: number } {
    const metrics = this.getMonthlyMetrics();
    
    if (month) {
      const monthMetrics = metrics.find(m => m.month === month);
      return monthMetrics?.opex || {};
    }
    
    // Return latest month
    const latest = metrics[metrics.length - 1];
    return latest?.opex || {};
  }

  getCashRunway(): { runway: number; currentCash: number; monthlyBurn: number; trend: Array<{month: string, balance: number}> } {
    if (this.cashData.length === 0) {
      // Fallback calculation
      const metrics = this.getMonthlyMetrics();
      const lastThreeMonths = metrics.slice(-3);
      
      const avgMonthlyEbitda = lastThreeMonths.reduce((sum, m) => sum + m.ebitda, 0) / lastThreeMonths.length;
      const monthlyBurn = Math.abs(avgMonthlyEbitda);
      const currentCash = 2500000;
      const runway = monthlyBurn > 0 ? currentCash / monthlyBurn : Infinity;
      
      return {
        runway: Math.round(runway * 10) / 10,
        currentCash,
        monthlyBurn,
        trend: []
      };
    }

    // Use real cash data
    const latestCash = this.cashData[this.cashData.length - 1];
    const currentCash = latestCash.balance;
    
    // Calculate burn rate from last 3 months of cash changes
    const recentCash = this.cashData.slice(-4); // Last 4 months to calculate 3 month changes
    let totalBurn = 0;
    let burnPeriods = 0;
    
    for (let i = 1; i < recentCash.length; i++) {
      const change = recentCash[i].balance - recentCash[i-1].balance;
      if (change < 0) {
        totalBurn += Math.abs(change);
        burnPeriods++;
      }
    }
    
    const monthlyBurn = burnPeriods > 0 ? totalBurn / burnPeriods : 0;
    const runway = monthlyBurn > 0 ? currentCash / monthlyBurn : Infinity;
    
    return {
      runway: Math.round(runway * 10) / 10,
      currentCash,
      monthlyBurn,
      trend: this.cashData.slice(-12).map(c => ({
        month: new Date(c.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        balance: Math.round(c.balance / 1000) // Show in thousands
      }))
    };
  }

  getDataForChart(type: 'revenue' | 'grossMargin' | 'opex' | 'ebitda' | 'cash', months: number = 12): any[] {
    const metrics = this.getMonthlyMetrics().slice(-months);
    
    switch (type) {
      case 'revenue':
        return metrics.map(m => ({
          month: new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          actual: Math.round(m.revenue.actual / 1000),
          budget: m.revenue.budget ? Math.round(m.revenue.budget / 1000) : 0,
          variance: m.revenue.budget ? Math.round((m.revenue.actual - m.revenue.budget) / 1000) : 0
        }));
        
      case 'grossMargin':
        return metrics.map(m => ({
          month: new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          percentage: Math.round(m.grossMarginPercent * 10) / 10,
          amount: Math.round(m.grossMargin / 1000)
        }));
        
      case 'opex':
        const latest = metrics[metrics.length - 1];
        return Object.entries(latest?.opex || {}).map(([category, amount]) => ({
          category,
          amount: Math.round(amount / 1000),
          percentage: Math.round((amount / latest.totalOpex) * 100)
        }));
        
      case 'ebitda':
        return metrics.map(m => ({
          month: new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          ebitda: Math.round(m.ebitda / 1000),
          margin: Math.round((m.ebitda / m.revenue.actual) * 100 * 10) / 10
        }));
        
      case 'cash':
        if (this.cashData.length > 0) {
          return this.cashData.slice(-months).map(c => ({
            month: new Date(c.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            balance: Math.round(c.balance / 1000)
          }));
        }
        return [];
        
      default:
        return [];
    }
  }
}

export const financialProcessor = new FinancialDataProcessor();