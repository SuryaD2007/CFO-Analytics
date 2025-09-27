import { financialProcessor } from './financial-data';
import { openaiAnalyzer } from './openai-analyzer';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
  chartType?: 'revenue' | 'grossMargin' | 'opex' | 'ebitda' | 'cash';
}

export interface AgentResponse {
  message: string;
  chartData?: any;
  chartType?: 'revenue' | 'grossMargin' | 'opex' | 'ebitda' | 'cash';
  metrics?: any;
}

class CFOChatAgent {
  private patterns = {
    revenue: /revenue|sales|income/i,
    budget: /budget|plan|target/i,
    grossMargin: /gross\s?margin|gm/i,
    opex: /opex|operating\s?expense|operational\s?cost/i,
    ebitda: /ebitda|earnings/i,
    cashRunway: /cash\s?runway|burn\s?rate|cash|improve.*cash/i,
    trend: /trend|over\s?time|last\s?\d+\s?months?/i,
    breakdown: /breakdown|break\s?down|by\s?category/i,
    comparison: /vs|versus|compared?\s?to|against/i,
    june2025: /june\s?2025/i,
    lastThreeMonths: /last\s?3\s?months?|past\s?3\s?months?/i,
    risks: /risk|threat|challenge|danger|problem/i,
    growth: /grow|growth|expand|scale|opportunity/i,
    strategy: /strategy|strategic|plan|roadmap/i,
    efficiency: /efficiency|optimize|improve|streamline/i,
    competition: /compet|market|position/i
  };

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private extractMonth(query: string): string | undefined {
    const monthMatch = query.match(/(\w+)\s?20\d{2}/i);
    if (monthMatch) {
      const [, month, year] = monthMatch;
      return `${year}-${this.getMonthNumber(month).toString().padStart(2, '0')}`;
    }
    return undefined;
  }

  private getMonthNumber(monthName: string): number {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                   'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months.findIndex(m => monthName.toLowerCase().startsWith(m)) + 1;
  }

  async processQuery(query: string): Promise<AgentResponse> {
    const lowerQuery = query.toLowerCase();
    
    try {
      // Revenue vs Budget queries
      if (this.patterns.revenue.test(query) && (this.patterns.budget.test(query) || this.patterns.comparison.test(query))) {
        const month = this.extractMonth(query);
        const data = financialProcessor.getRevenueVsBudget(month);
        
        let message = `Revenue vs Budget Analysis\n\n`;
        message += `• Actual Revenue: ${this.formatCurrency(data.actual)}\n`;
        message += `• Budgeted Revenue: ${this.formatCurrency(data.budget)}\n`;
        message += `• Variance: ${this.formatCurrency(data.variance)} (${this.formatPercentage(data.variancePercent)})\n`;
        
        if (data.variance > 0) {
          message += `\n✅ Above budget by ${this.formatCurrency(data.variance)}`;
        } else {
          message += `\n⚠️ Below budget by ${this.formatCurrency(Math.abs(data.variance))}`;
        }

        return {
          message,
          chartData: financialProcessor.getDataForChart('revenue', 6),
          chartType: 'revenue'
        };
      }

      // Gross Margin Trend queries
      if (this.patterns.grossMargin.test(query) && this.patterns.trend.test(query)) {
        const trendData = financialProcessor.getGrossMarginTrend(3);
        
        let message = `Gross Margin Trend (Last 3 Months)\n\n`;
        trendData.forEach(data => {
          const monthName = new Date(data.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          message += `• ${monthName}: ${this.formatPercentage(data.grossMarginPercent)} (${this.formatCurrency(data.grossMargin)})\n`;
        });

        const avgMargin = trendData.reduce((sum, d) => sum + d.grossMarginPercent, 0) / trendData.length;
        message += `\n📊 Average: ${this.formatPercentage(avgMargin)}`;

        return {
          message,
          chartData: financialProcessor.getDataForChart('grossMargin', 6),
          chartType: 'grossMargin'
        };
      }

      // Opex Breakdown queries
      if (this.patterns.opex.test(query) && this.patterns.breakdown.test(query)) {
        const month = this.extractMonth(query);
        const opexData = financialProcessor.getOpexBreakdown(month);
        
        let message = `Operating Expenses Breakdown\n\n`;
        let total = 0;
        
        Object.entries(opexData).forEach(([category, amount]) => {
          message += `• ${category}: ${this.formatCurrency(amount)}\n`;
          total += amount;
        });
        
        message += `\n💰 Total OpEx: ${this.formatCurrency(total)}`;

        return {
          message,
          chartData: financialProcessor.getDataForChart('opex'),
          chartType: 'opex'
        };
      }

      // Cash Runway queries
      if (this.patterns.cashRunway.test(query)) {
        const cashData = financialProcessor.getCashRunway();
        const metrics = financialProcessor.getMonthlyMetrics();
        const latest = metrics[metrics.length - 1];
        
        let message = `Cash Runway & Strategic Enhancement\n\n`;
        message += `Current Financial Position:\n`;
        message += `• Cash Position: ${this.formatCurrency(cashData.currentCash)}\n`;
        message += `• Monthly Burn Rate: ${this.formatCurrency(cashData.monthlyBurn)}\n`;
        message += `• Runway Duration: ${cashData.runway.toFixed(1)} months\n\n`;
        
        message += `Strategic Enhancement Initiatives:\n\n`;
        
        // Revenue Growth Strategies
        message += `Revenue Acceleration Framework:\n`;
        message += `• Current Monthly Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
        message += `• 10% Growth Impact: +${this.formatCurrency(latest.revenue.actual * 0.1)} monthly\n`;
        message += `• Customer expansion opportunities via upselling programs\n`;
        message += `• Sales cycle optimization for faster deal closure\n\n`;
        
        // Cost Optimization
        const opexRatio = (latest.totalOpex / latest.revenue.actual) * 100;
        message += `Operational Excellence Program:\n`;
        message += `• Current Operating Expenses: ${this.formatCurrency(latest.totalOpex)} (${opexRatio.toFixed(1)}% of revenue)\n`;
        if (opexRatio > 60) {
          message += `• Target Efficiency: 15-20% expense reduction\n`;
          message += `• Potential Monthly Savings: ${this.formatCurrency(latest.totalOpex * 0.15)} - ${this.formatCurrency(latest.totalOpex * 0.2)}\n`;
        }
        message += `• Software and vendor optimization review\n`;
        message += `• Marketing ROI enhancement initiatives\n`;
        message += `• Workspace efficiency improvements\n\n`;
        
        // Cash Management
        message += `Cash Flow Optimization:\n`;
        message += `• Supplier payment term negotiations\n`;
        message += `• Customer payment acceleration programs\n`;
        message += `• Invoice factoring for immediate liquidity\n`;
        message += `• Revenue-based financing exploration\n\n`;
        
        // Funding Strategy
        if (cashData.runway < 12) {
          message += `Capital Strategy:\n`;
          message += `• Initiate fundraising process (3-6 month timeline)\n`;
          message += `• Target 18-24 months operational runway\n`;
          message += `• Bridge financing evaluation if required\n`;
          message += `• Strategic partnership development\n\n`;
        }
        
        // Risk Assessment
        if (cashData.runway < 6) {
          message += `Immediate Action Requirements:\n`;
          message += `• Emergency cost reduction implementation\n`;
          message += `• Accelerated fundraising execution\n`;
          message += `• Bridge loan and credit facility evaluation\n`;
          message += `• Focus on highest-ROI activities exclusively\n`;
        } else if (cashData.runway < 12) {
          message += `Medium-term Strategic Focus:\n`;
          message += `• Proactive fundraising preparation\n`;
          message += `• Burn rate optimization for sustainability\n`;
          message += `• Revenue predictability enhancement\n`;
        } else {
          message += `Strategic Growth Position:\n`;
          message += `• Strong liquidity enables growth investment\n`;
          message += `• Focus on efficient revenue scaling\n`;
          message += `• Strategic acquisition consideration\n`;
        }

        return {
          message,
          chartData: cashData.trend && cashData.trend.length > 0 ? cashData.trend : financialProcessor.getDataForChart('cash', 12),
          chartType: 'cash',
          metrics: cashData
        };
      }

      // EBITDA queries
      if (this.patterns.ebitda.test(query)) {
        const metrics = financialProcessor.getMonthlyMetrics();
        const latest = metrics[metrics.length - 1];
        
        let message = `EBITDA Analysis\n\n`;
        message += `• Latest EBITDA: ${this.formatCurrency(latest.ebitda)}\n`;
        message += `• Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
        message += `• Gross Margin: ${this.formatCurrency(latest.grossMargin)}\n`;
        message += `• Total OpEx: ${this.formatCurrency(latest.totalOpex)}\n`;

        const ebitdaMargin = (latest.ebitda / latest.revenue.actual) * 100;
        message += `\n📈 EBITDA Margin: ${this.formatPercentage(ebitdaMargin)}`;

        return {
          message,
          chartData: financialProcessor.getDataForChart('ebitda', 6),
          chartType: 'ebitda'
        };
      }

      // General revenue queries
      if (this.patterns.revenue.test(query)) {
        const metrics = financialProcessor.getMonthlyMetrics();
        const latest = metrics[metrics.length - 1];
        
        let message = `Revenue Summary\n\n`;
        message += `• Current Month: ${this.formatCurrency(latest.revenue.actual)}\n`;
        message += `• Gross Margin: ${this.formatPercentage(latest.grossMarginPercent)}\n`;
        
        const previousMonth = metrics[metrics.length - 2];
        if (previousMonth) {
          const growth = ((latest.revenue.actual - previousMonth.revenue.actual) / previousMonth.revenue.actual) * 100;
          message += `• Month-over-Month: ${this.formatPercentage(growth)}\n`;
        }

        return {
          message,
          chartData: financialProcessor.getDataForChart('revenue', 6),
          chartType: 'revenue'
        };
      }

      // Business Risk Analysis
      if (this.patterns.risks.test(query)) {
        return this.generateRiskAnalysis();
      }

      // Growth Strategy queries
      if (this.patterns.growth.test(query)) {
        return this.generateGrowthStrategy();
      }

      // Strategy and Planning queries
      if (this.patterns.strategy.test(query)) {
        return this.generateStrategicAnalysis();
      }

      // Enhanced AI analysis with potential chart generation
      if (openaiAnalyzer.isConfigured()) {
        try {
          const aiResponse = await openaiAnalyzer.analyzeQuery(query);
          
          // Analyze AI response for chart recommendations and generate appropriate charts
          const chartRecommendation = this.analyzeForChartNeeds(query, aiResponse);
          
          return {
            message: aiResponse,
            chartData: chartRecommendation.chartData,
            chartType: chartRecommendation.chartType
          };
        } catch (error) {
          console.error('AI analysis failed:', error);
          // Fall through to comprehensive business analysis
        }
      }
      
      // Comprehensive business analysis for unmatched queries
      return this.generateComprehensiveAnalysis(query);

    } catch (error) {
      console.error('Error processing query:', error);
      return {
        message: "I encountered an error processing your request. Please try rephrasing your question or contact support if the issue persists."
      };
    }
  }

  private analyzeForChartNeeds(query: string, aiResponse: string): { chartData?: any, chartType?: any } {
    const lowerQuery = query.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
    // Determine if charts would enhance the response
    if (this.patterns.revenue.test(query) || lowerResponse.includes('revenue')) {
      return {
        chartData: financialProcessor.getDataForChart('revenue', 12),
        chartType: 'revenue'
      };
    }
    
    if (this.patterns.grossMargin.test(query) || lowerResponse.includes('margin')) {
      return {
        chartData: financialProcessor.getDataForChart('grossMargin', 12),
        chartType: 'grossMargin'
      };
    }
    
    if (this.patterns.opex.test(query) || lowerResponse.includes('opex') || lowerResponse.includes('cost')) {
      return {
        chartData: financialProcessor.getDataForChart('opex'),
        chartType: 'opex'
      };
    }
    
    if (this.patterns.ebitda.test(query) || lowerResponse.includes('ebitda') || lowerResponse.includes('profit')) {
      return {
        chartData: financialProcessor.getDataForChart('ebitda', 12),
        chartType: 'ebitda'
      };
    }
    
    if (this.patterns.cashRunway.test(query) || lowerResponse.includes('cash')) {
      return {
        chartData: financialProcessor.getDataForChart('cash', 12),
        chartType: 'cash'
      };
    }
    
    return {};
  }

  private generateRiskAnalysis(): AgentResponse {
    const metrics = financialProcessor.getMonthlyMetrics();
    const cashData = financialProcessor.getCashRunway();
    const latest = metrics[metrics.length - 1];
    
    let message = `Enterprise Risk Assessment & Mitigation Framework\n\n`;
    
    // Financial Risk Portfolio
    message += `Financial Risk Analysis:\n`;
    if (cashData.runway < 6) {
      message += `• Critical Liquidity Risk: ${cashData.runway.toFixed(1)} months operational runway\n`;
      message += `  Mitigation: Emergency capital mobilization, immediate cost restructuring\n`;
    } else if (cashData.runway < 12) {
      message += `• Moderate Cash Flow Risk: ${cashData.runway.toFixed(1)} months operational runway\n`;
      message += `  Mitigation: Proactive fundraising initiation, burn optimization\n`;
    }
    
    if (latest.ebitda < 0) {
      message += `• Operational Profitability Risk: ${this.formatCurrency(latest.ebitda)} EBITDA\n`;
      message += `  Mitigation: Cost structure optimization, pricing strategy enhancement\n`;
    }
    
    if (latest.grossMarginPercent < 50) {
      message += `• Unit Economics Risk: ${this.formatPercentage(latest.grossMarginPercent)} gross margin\n`;
      message += `  Mitigation: Pricing model refinement, cost base optimization\n`;
    }
    
    // Growth & Market Risk Portfolio
    message += `\nMarket & Growth Risk Analysis:\n`;
    const revenueGrowth = this.calculateRevenueGrowth(metrics);
    if (revenueGrowth < 5) {
      message += `• Growth Momentum Risk: ${this.formatPercentage(revenueGrowth)} month-over-month revenue growth\n`;
      message += `  Mitigation: Sales acceleration programs, product innovation initiatives\n`;
    }
    
    message += `• Competitive Pressure Risk: Intensifying market competition\n`;
    message += `  Mitigation: Competitive differentiation strengthening, customer loyalty programs\n`;
    message += `• Customer Concentration Risk: Key account dependency exposure\n`;
    message += `  Mitigation: Customer base diversification, market segment expansion\n`;
    
    // Operational Risk Portfolio
    message += `\nOperational Risk Analysis:\n`;
    const opexRatio = (latest.totalOpex / latest.revenue.actual) * 100;
    if (opexRatio > 70) {
      message += `• Cost Structure Risk: ${this.formatPercentage(opexRatio)} operational expense ratio\n`;
      message += `  Mitigation: Process automation implementation, efficiency optimization\n`;
    }
    
    message += `• Human Capital Risk: Critical talent dependency\n`;
    message += `  Mitigation: Succession planning development, retention strategy enhancement\n`;
    message += `• Technology Infrastructure Risk: System scalability constraints\n`;
    message += `  Mitigation: Infrastructure modernization, platform scalability investment\n`;
    
    // Enterprise Risk Scoring
    let riskScore = 0;
    if (cashData.runway < 6) riskScore += 3;
    else if (cashData.runway < 12) riskScore += 2;
    if (latest.ebitda < 0) riskScore += 2;
    if (latest.grossMarginPercent < 50) riskScore += 1;
    if (revenueGrowth < 5) riskScore += 2;
    
    message += `\nOverall Enterprise Risk Level: ${riskScore < 3 ? 'Low' : riskScore < 6 ? 'Medium' : 'High'}\n`;
    message += `\nExecutive Action Items:\n`;
    message += `• Prioritize highest-impact risk mitigation initiatives\n`;
    message += `• Develop comprehensive contingency planning\n`;
    message += `• Implement weekly risk monitoring cadence\n`;
    message += `• Maintain transparent stakeholder communication\n`;

    return {
      message,
      chartData: financialProcessor.getDataForChart('cash', 12),
      chartType: 'cash'
    };
  }

  private generateGrowthStrategy(): AgentResponse {
    const metrics = financialProcessor.getMonthlyMetrics();
    const latest = metrics[metrics.length - 1];
    const cashData = financialProcessor.getCashRunway();
    
    let message = `Strategic Growth Framework & Market Expansion\n\n`;
    
    // Performance Foundation
    message += `Current Performance Foundation:\n`;
    message += `• Monthly Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
    message += `• Gross Margin: ${this.formatPercentage(latest.grossMarginPercent)}\n`;
    message += `• EBITDA Performance: ${this.formatCurrency(latest.ebitda)}\n`;
    message += `• Liquidity Position: ${cashData.runway.toFixed(1)} months operational runway\n\n`;
    
    // Growth Opportunity Matrix
    message += `Growth Opportunity Matrix:\n\n`;
    
    message += `Revenue Expansion Initiatives:\n`;
    message += `• Current Monthly Recurring Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
    message += `• Customer expansion opportunity: 15-25% revenue increase via upselling\n`;
    message += `• Cross-selling penetration: Enhanced product adoption within accounts\n`;
    message += `• Value-based pricing optimization: Revenue per customer enhancement\n\n`;
    
    message += `Market Expansion Strategy:\n`;
    message += `• Geographic market penetration: New regional territories\n`;
    message += `• Vertical market expansion: Target industry diversification\n`;
    message += `• Strategic partnership development: Channel network leverage\n`;
    message += `• Product portfolio extension: Adjacent market offerings\n\n`;
    
    message += `Operational Excellence Framework:\n`;
    const opexRatio = (latest.totalOpex / latest.revenue.actual) * 100;
    if (opexRatio > 60) {
      message += `• Cost structure optimization: Current OpEx at ${this.formatPercentage(opexRatio)} of revenue\n`;
      message += `• Process automation implementation: Manual operation reduction\n`;
    }
    message += `• Sales efficiency enhancement: Conversion optimization and cycle improvement\n`;
    message += `• Customer success optimization: Churn reduction and retention enhancement\n\n`;
    
    // Investment Strategy
    message += `Investment Strategy Framework:\n`;
    if (cashData.runway > 12 && latest.ebitda > 0) {
      message += `• Strong financial position enables aggressive growth investment\n`;
      message += `• Strategic focus: Sales team expansion, marketing acceleration\n`;
      message += `• Growth target: 2-3x revenue expansion over 12-18 months\n`;
    } else if (cashData.runway > 6) {
      message += `• Moderate investment in validated growth channels\n`;
      message += `• Strategic focus: Customer acquisition cost optimization\n`;
      message += `• Growth target: Sustainable 20-30% quarterly expansion\n`;
    } else {
      message += `• Conservative approach: Efficiency-focused initiatives\n`;
      message += `• Strategic focus: High-ROI, rapid-payback programs\n`;
      message += `• Growth target: Profitability before acceleration\n`;
    }
    
    message += `\nRecommended Implementation Timeline:\n`;
    message += `• Week 1-2: Customer segment analysis for expansion opportunities\n`;
    message += `• Week 3-4: Pricing and upselling strategy development\n`;
    message += `• Month 2: Targeted expansion campaign launch\n`;
    message += `• Month 3: Performance measurement and optimization\n`;

    return {
      message,
      chartData: financialProcessor.getDataForChart('revenue', 12),
      chartType: 'revenue'
    };
  }

  private generateStrategicAnalysis(): AgentResponse {
    const metrics = financialProcessor.getMonthlyMetrics();
    const latest = metrics[metrics.length - 1];
    const cashData = financialProcessor.getCashRunway();
    
    let message = `Executive Strategic Analysis & Planning Framework\n\n`;
    
    // Strategic Position Assessment
    message += `Current Strategic Position:\n`;
    const ebitdaMargin = (latest.ebitda / latest.revenue.actual) * 100;
    message += `• Monthly Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
    message += `• Profitability Margin: ${this.formatPercentage(ebitdaMargin)} EBITDA margin\n`;
    message += `• Unit Economics: ${this.formatPercentage(latest.grossMarginPercent)} gross margin\n`;
    message += `• Financial Resilience: ${cashData.runway.toFixed(1)} months operational runway\n\n`;
    
    // Strategic Priority Framework
    message += `Strategic Priority Framework:\n\n`;
    
    if (latest.ebitda < 0) {
      message += `1. Profitability Achievement (Critical Priority)\n`;
      message += `• Current monthly operational deficit: ${this.formatCurrency(Math.abs(latest.ebitda))}\n`;
      message += `• Target timeline: Break-even within 6 months\n`;
      message += `• Strategic focus: Cost optimization and revenue efficiency\n\n`;
    } else {
      message += `1. Profitable Growth Acceleration (Primary Priority)\n`;
      message += `• Strong unit economics foundation enables scaling\n`;
      message += `• Target performance: Maintain >15% EBITDA during growth\n`;
      message += `• Strategic focus: Market expansion and operational excellence\n\n`;
    }
    
    message += `2. Market Leadership Development\n`;
    message += `• Competitive differentiation strengthening\n`;
    message += `• Sustainable competitive advantage development\n`;
    message += `• Core market segment share expansion\n\n`;
    
    message += `3. Operational Excellence Implementation\n`;
    const opexRatio = (latest.totalOpex / latest.revenue.actual) * 100;
    message += `• Current operational efficiency: ${this.formatPercentage(opexRatio)} OpEx ratio\n`;
    message += `• Target performance: Best-in-class operational metrics\n`;
    message += `• Strategic focus: Process optimization and automation\n\n`;
    
    // Resource Allocation Framework
    message += `Resource Allocation Strategy:\n`;
    if (cashData.runway > 12) {
      message += `• Growth initiatives: 40% (sales, marketing)\n`;
      message += `• Product development: 30%\n`;
      message += `• Operational improvements: 20%\n`;
      message += `• Strategic reserves: 10%\n`;
    } else if (cashData.runway > 6) {
      message += `• Growth initiatives: 30%\n`;
      message += `• Product development: 25%\n`;
      message += `• Operational efficiency: 35%\n`;
      message += `• Cash preservation: 10%\n`;
    } else {
      message += `• Selective growth: 20%\n`;
      message += `• Critical product features: 15%\n`;
      message += `• Cost optimization: 50%\n`;
      message += `• Fundraising preparation: 15%\n`;
    }
    
    message += `\nKey Performance Indicators:\n`;
    message += `• Revenue growth: >20% quarterly\n`;
    message += `• Gross margin: >60%\n`;
    message += `• EBITDA margin: >15%\n`;
    message += `• Cash efficiency: <${this.formatCurrency(latest.totalOpex * 0.8)} monthly burn\n`;
    
    message += `\n90-Day Strategic Action Plan:\n`;
    message += `• Month 1: Strategic alignment and quick win implementation\n`;
    message += `• Month 2: Core initiative execution\n`;
    message += `• Month 3: Performance measurement and course correction\n`;

    return {
      message,
      chartData: financialProcessor.getDataForChart('ebitda', 12),
      chartType: 'ebitda'
    };
  }

  private generateComprehensiveAnalysis(query: string): AgentResponse {
    const metrics = financialProcessor.getMonthlyMetrics();
    const latest = metrics[metrics.length - 1];
    const cashData = financialProcessor.getCashRunway();
    
    let message = `CFO Executive Business Analysis\n\n`;
    message += `Query Analysis: "${query}"\n\n`;
    
    message += `Current Business Performance Overview:\n`;
    message += `• Monthly Revenue: ${this.formatCurrency(latest.revenue.actual)}\n`;
    message += `• Gross Margin: ${this.formatPercentage(latest.grossMarginPercent)}\n`;
    message += `• EBITDA Performance: ${this.formatCurrency(latest.ebitda)}\n`;
    message += `• Cash Runway: ${cashData.runway.toFixed(1)} months\n\n`;
    
    // Contextual analysis based on query
    if (query.toLowerCase().includes('improve') || query.toLowerCase().includes('better')) {
      message += `Strategic Improvement Opportunities:\n`;
      message += `• Revenue optimization through advanced pricing strategy\n`;
      message += `• Cost efficiency enhancement programs\n`;
      message += `• Customer retention and expansion initiatives\n`;
      message += `• Operational process optimization framework\n\n`;
    }
    
    if (query.toLowerCase().includes('board') || query.toLowerCase().includes('investors')) {
      message += `Board and Investor Communication Highlights:\n`;
      const revenueGrowth = this.calculateRevenueGrowth(metrics);
      message += `• Revenue growth trajectory: ${this.formatPercentage(revenueGrowth)} month-over-month\n`;
      message += `• Unit economics foundation: Strong ${this.formatPercentage(latest.grossMarginPercent)} margins\n`;
      message += `• Runway assessment: ${cashData.runway > 12 ? 'Strong position' : cashData.runway > 6 ? 'Adequate liquidity' : 'Requires attention'}\n\n`;
    }
    
    message += `Executive Strategic Recommendations:\n`;
    message += `• Profitable growth initiative prioritization\n`;
    message += `• Cash efficiency and runway optimization\n`;
    message += `• Competitive positioning strengthening\n`;
    message += `• Scalable operational process development\n\n`;
    
    message += `For comprehensive executive analysis, consider these strategic inquiries:\n`;
    message += `• "What are our primary business risks?"\n`;
    message += `• "How can we accelerate sustainable growth?"\n`;
    message += `• "Show me profitability trend analysis"\n`;
    message += `• "What's our path to market leadership?"\n`;

    // Auto-select most relevant chart
    const chartType = this.selectRelevantChart(query);
    
    return {
      message,
      chartData: financialProcessor.getDataForChart(chartType, 12),
      chartType: chartType
    };
  }

  private calculateRevenueGrowth(metrics: any[]): number {
    if (metrics.length < 2) return 0;
    const current = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    return ((current.revenue.actual - previous.revenue.actual) / previous.revenue.actual) * 100;
  }

  private selectRelevantChart(query: string): 'revenue' | 'grossMargin' | 'opex' | 'ebitda' | 'cash' {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('cash') || lowerQuery.includes('runway')) return 'cash';
    if (lowerQuery.includes('profit') || lowerQuery.includes('ebitda')) return 'ebitda';
    if (lowerQuery.includes('margin') || lowerQuery.includes('cost')) return 'grossMargin';
    if (lowerQuery.includes('expense') || lowerQuery.includes('opex')) return 'opex';
    return 'revenue'; // default
  }
}

export const chatAgent = new CFOChatAgent();