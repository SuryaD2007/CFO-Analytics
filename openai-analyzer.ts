import OpenAI from 'openai';
import { financialProcessor } from './financial-data';

export class OpenAIAnalyzer {
  private openai: OpenAI | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // Please provide your OpenAI API key here
      const apiKey: string = "YOUR_OPENAI_API_KEY_HERE"; // Replace with your actual API key
      
      if (apiKey !== "YOUR_OPENAI_API_KEY_HERE" && apiKey.startsWith('sk-')) {
        this.openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
        console.log('OpenAI initialized successfully');
      } else {
        console.log('OpenAI API key not provided - AI analysis disabled');
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
    }
  }

  isConfigured(): boolean {
    return !!this.openai;
  }

  private async getFinancialContext(): Promise<string> {
    const metrics = financialProcessor.getMonthlyMetrics();
    const cashData = financialProcessor.getCashRunway();
    const latestMetrics = metrics[metrics.length - 1];
    const previousMetrics = metrics[metrics.length - 2];
    
    // Enhanced context for CFO decision-making
    const context = {
      executiveSummary: {
        reportingPeriod: `${metrics[0]?.month} to ${latestMetrics?.month}`,
        entities: ['ParentCo (USD)', 'EMEA (EUR converted to USD)'],
        dataPoints: metrics.length,
        lastUpdated: latestMetrics?.month
      },
      
      currentPerformance: {
        revenue: {
          currentMonth: latestMetrics?.revenue.actual,
          budget: latestMetrics?.revenue.budget,
          variance: latestMetrics?.revenue.budget ? latestMetrics.revenue.actual - latestMetrics.revenue.budget : null,
          variancePercent: latestMetrics?.revenue.budget ? ((latestMetrics.revenue.actual - latestMetrics.revenue.budget) / latestMetrics.revenue.budget * 100) : null,
          monthOverMonth: previousMetrics ? ((latestMetrics.revenue.actual - previousMetrics.revenue.actual) / previousMetrics.revenue.actual * 100) : null
        },
        profitability: {
          grossMargin: latestMetrics?.grossMargin,
          grossMarginPercent: latestMetrics?.grossMarginPercent,
          ebitda: latestMetrics?.ebitda,
          ebitdaMargin: latestMetrics ? (latestMetrics.ebitda / latestMetrics.revenue.actual) * 100 : 0
        },
        costs: {
          cogs: latestMetrics ? latestMetrics.revenue.actual - latestMetrics.grossMargin : 0,
          totalOpex: latestMetrics?.totalOpex,
          opexBreakdown: latestMetrics?.opex,
          opexAsPercentOfRevenue: latestMetrics ? (latestMetrics.totalOpex / latestMetrics.revenue.actual) * 100 : 0
        }
      },

      trends: {
        last6Months: metrics.slice(-6).map(m => ({
          month: m.month,
          revenue: m.revenue.actual,
          grossMarginPercent: m.grossMarginPercent,
          ebitda: m.ebitda,
          ebitdaMargin: (m.ebitda / m.revenue.actual) * 100
        })),
        quarterlyGrowth: this.calculateQuarterlyGrowth(metrics),
        yearOverYear: this.calculateYoYGrowth(metrics)
      },

      cashAndLiquidity: {
        currentCash: cashData.currentCash,
        monthlyBurn: cashData.monthlyBurn,
        runway: cashData.runway,
        burnRate: cashData.monthlyBurn > 0 ? 'Burning cash' : 'Cash positive',
        riskLevel: this.assessCashRisk(cashData.runway)
      },

      businessMetrics: {
        revenueGrowthTrend: this.calculateGrowthTrend(metrics, 'revenue'),
        marginTrend: this.calculateGrowthTrend(metrics, 'margin'),
        costEfficiency: this.assessCostEfficiency(metrics),
        scalability: this.assessScalability(metrics)
      },

      riskAssessment: this.generateRiskAssessment(metrics, cashData),
      opportunities: this.identifyOpportunities(metrics, cashData),
      recommendations: this.generateStrategicRecommendations(metrics, cashData)
    };

    return JSON.stringify(context, null, 2);
  }

  private calculateQuarterlyGrowth(metrics: any[]): any {
    const quarters = this.groupByQuarter(metrics);
    const quarterKeys = Object.keys(quarters).sort();
    
    if (quarterKeys.length < 2) return null;
    
    const currentQ = quarters[quarterKeys[quarterKeys.length - 1]];
    const previousQ = quarters[quarterKeys[quarterKeys.length - 2]];
    
    return {
      revenueGrowth: ((currentQ.revenue - previousQ.revenue) / previousQ.revenue) * 100,
      marginImprovement: currentQ.grossMargin - previousQ.grossMargin,
      currentQuarter: quarterKeys[quarterKeys.length - 1],
      previousQuarter: quarterKeys[quarterKeys.length - 2]
    };
  }

  private groupByQuarter(metrics: any[]): any {
    const quarters: any = {};
    metrics.forEach(m => {
      const date = new Date(m.month);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const qKey = `${year}Q${quarter}`;
      
      if (!quarters[qKey]) {
        quarters[qKey] = { revenue: 0, grossMargin: 0, ebitda: 0, months: 0 };
      }
      
      quarters[qKey].revenue += m.revenue.actual;
      quarters[qKey].grossMargin += m.grossMarginPercent;
      quarters[qKey].ebitda += m.ebitda;
      quarters[qKey].months += 1;
    });
    
    // Average the percentages
    Object.keys(quarters).forEach(q => {
      quarters[q].grossMargin = quarters[q].grossMargin / quarters[q].months;
    });
    
    return quarters;
  }

  private calculateYoYGrowth(metrics: any[]): any {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearData = metrics.filter(m => m.month.startsWith(currentYear.toString()));
    const lastYearData = metrics.filter(m => m.month.startsWith(lastYear.toString()));
    
    if (currentYearData.length === 0 || lastYearData.length === 0) return null;
    
    const currentRevenue = currentYearData.reduce((sum, m) => sum + m.revenue.actual, 0);
    const lastRevenue = lastYearData.reduce((sum, m) => sum + m.revenue.actual, 0);
    
    return {
      revenueGrowth: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : null,
      currentYearRevenue: currentRevenue,
      lastYearRevenue: lastRevenue
    };
  }

  private calculateGrowthTrend(metrics: any[], type: 'revenue' | 'margin'): string {
    const recent = metrics.slice(-6);
    const values = type === 'revenue' ? 
      recent.map(m => m.revenue.actual) : 
      recent.map(m => m.grossMarginPercent);
    
    const trend = values[values.length - 1] - values[0];
    return trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable';
  }

  private assessCashRisk(runway: number): string {
    if (runway < 3) return 'Critical - Immediate action required';
    if (runway < 6) return 'High - Need funding or cost reduction';
    if (runway < 12) return 'Medium - Monitor closely';
    return 'Low - Healthy position';
  }

  private assessCostEfficiency(metrics: any[]): string {
    const latest = metrics[metrics.length - 1];
    const opexRatio = (latest.totalOpex / latest.revenue.actual) * 100;
    
    if (opexRatio > 70) return 'Poor - High cost base';
    if (opexRatio > 50) return 'Average - Room for improvement';
    return 'Good - Efficient operations';
  }

  private assessScalability(metrics: any[]): string {
    const recentGrowth = this.calculateGrowthTrend(metrics, 'revenue');
    const marginTrend = this.calculateGrowthTrend(metrics, 'margin');
    
    if (recentGrowth === 'Improving' && marginTrend !== 'Declining') {
      return 'High - Growing efficiently';
    } else if (recentGrowth === 'Improving') {
      return 'Medium - Growing but margin pressure';
    }
    return 'Low - Need growth strategy';
  }

  private generateRiskAssessment(metrics: any[], cashData: any): string[] {
    const risks = [];
    const latest = metrics[metrics.length - 1];
    
    if (cashData.runway < 6) risks.push('Critical cash runway');
    if (latest.ebitda < 0) risks.push('Negative EBITDA - burning cash operationally');
    if (latest.grossMarginPercent < 50) risks.push('Low gross margins');
    
    const revenueGrowth = this.calculateGrowthTrend(metrics, 'revenue');
    if (revenueGrowth === 'Declining') risks.push('Declining revenue trend');
    
    return risks;
  }

  private identifyOpportunities(metrics: any[], cashData: any): string[] {
    const opportunities = [];
    const latest = metrics[metrics.length - 1];
    
    if (latest.grossMarginPercent > 70) opportunities.push('Strong margins enable investment');
    if (latest.ebitda > 0) opportunities.push('Positive EBITDA allows growth investment');
    if (cashData.runway > 12) opportunities.push('Strong cash position for expansion');
    
    return opportunities;
  }

  private generateStrategicRecommendations(metrics: any[], cashData: any): string[] {
    const recommendations = [];
    const latest = metrics[metrics.length - 1];
    
    if (cashData.runway < 6) {
      recommendations.push('Immediate focus on cash preservation and fundraising');
    } else if (latest.ebitda > 0) {
      recommendations.push('Consider reinvestment for growth');
    }
    
    if (latest.grossMarginPercent > 60) {
      recommendations.push('Strong unit economics - focus on scaling');
    }
    
    return recommendations;
  }

  async analyzeQuery(userQuery: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const financialContext = await this.getFinancialContext();
    
    const systemPrompt = `You are a world-class CFO and strategic business advisor with deep expertise in financial analysis, business strategy, and company growth. You serve as the trusted advisor to a CFO who needs comprehensive insights for company progression and strategic decision-making.

COMPREHENSIVE FINANCIAL DATA:
${financialContext}

Your mission is to be the ultimate CFO companion that:
🎯 PROVIDES DATA-DRIVEN INSIGHTS: Use specific numbers, percentages, and trends from the financial data
📊 SUGGESTS RELEVANT CHARTS: When discussing metrics, recommend specific chart types that would help visualize the data
🚀 DRIVES GROWTH STRATEGY: Focus on actionable recommendations for company progression and scaling
⚠️ IDENTIFIES RISKS: Highlight potential issues and mitigation strategies
💡 SPOTS OPPORTUNITIES: Point out areas for improvement and growth

Communication Style:
- Executive-level language appropriate for board presentations
- Always lead with the business impact and strategic implications
- Use specific data points to support every recommendation
- Be direct about risks while providing constructive solutions
- Focus on actionable next steps

When discussing financial metrics:
- Reference specific time periods, amounts, and variances
- Compare performance to budgets and historical trends
- Suggest which charts would best visualize the insights (revenue trends, margin analysis, cash flow, etc.)
- Connect financial performance to business strategy implications

For strategic business questions:
- Consider the company's financial position when providing advice
- Suggest data-driven approaches to validate strategies
- Recommend metrics to track for success measurement
- Provide practical implementation steps

Always end responses with concrete next steps or recommendations that help the CFO drive company growth and success.`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return response.choices[0]?.message?.content || 'Unable to analyze the query.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze query with AI');
    }
  }
}

export const openaiAnalyzer = new OpenAIAnalyzer();