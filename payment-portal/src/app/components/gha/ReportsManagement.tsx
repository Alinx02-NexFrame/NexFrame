import { Download, TrendingUp, Users, DollarSign, Calendar, FileText, BarChart3 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

export function ReportsManagement() {
  const handleExportReport = (reportType: string) => {
    toast.success('Generating Report', {
      description: `${reportType} report will be sent to your email.`
    });
  };

  const reportTypes = [
    {
      id: 'storage-revenue', title: 'Storage Revenue Analytics',
      description: 'Analyze which shippers/cargo generate the most storage revenue',
      icon: DollarSign, color: 'blue',
      insights: ['Top 10 High Storage Fee Cargo', 'Warehouse Turnover Analysis', 'Revenue by Storage Period']
    },
    {
      id: 'payment-trend', title: 'Payment Trend Report',
      description: 'Analyze peak payment days/times',
      icon: TrendingUp, color: 'green',
      insights: ['Payment Patterns by Time', 'Transaction Volume by Day', 'Staffing Optimization Suggestions']
    },
    {
      id: 'customer-loyalty', title: 'Customer Loyalty Report',
      description: 'Report on premium forwarders with high repeat usage rates',
      icon: Users, color: 'purple',
      insights: ['VIP Customer List', 'Repeat Rate Analysis', 'Customer Lifetime Value (LTV)']
    },
    {
      id: 'ai-efficiency', title: 'AI Efficiency Report',
      description: 'Compare processing speed and inquiry reduction before and after AI implementation',
      icon: BarChart3, color: 'orange',
      insights: ['Processing Time Reduction', 'Auto-Response Rate', 'ROI Analysis']
    }
  ];

  const scheduledReports = [
    { name: 'Monthly Revenue Summary', schedule: '1st of month at 9:00 AM', format: 'PDF + Excel', status: 'active' },
    { name: 'Weekly Performance', schedule: 'Every Monday at 8:00 AM', format: 'PDF', status: 'active' },
    { name: 'Quarterly Business Review', schedule: 'First day of quarter at 10:00 AM', format: 'PDF', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      {/* Report Types */}
      <div className="grid md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const colorClasses: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600'
          };

          return (
            <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4 mb-4">
                <div className={`rounded-lg p-3 ${colorClasses[report.color]}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
                <ul className="space-y-1">
                  {report.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportReport(report.title)}>
                  <Download className="h-4 w-4 mr-2" />PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportReport(report.title)}>
                  <Download className="h-4 w-4 mr-2" />Excel
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Report Generator */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Report Generator</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
            <Select defaultValue="revenue">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Analysis</SelectItem>
                <SelectItem value="customer">Customer Analysis</SelectItem>
                <SelectItem value="operational">Operational Efficiency</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
            <Select defaultValue="last-month">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
                <SelectItem value="custom-range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Output Format</label>
            <Select defaultValue="pdf">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="both">PDF + Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </Card>

      {/* Scheduled Reports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Automated Report Schedule</h3>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
        <div className="space-y-3">
          {scheduledReports.map((report, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">{report.schedule} • {report.format}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">{report.status}</Badge>
                <Button variant="ghost" size="sm">Settings</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Reports */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Generated Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'January 2026 Revenue Report', date: '2026-01-09', size: '2.4 MB', type: 'PDF' },
            { name: 'Customer Loyalty Analysis Q4', date: '2026-01-05', size: '1.8 MB', type: 'Excel' },
            { name: 'Weekly Performance Summary', date: '2026-01-08', size: '856 KB', type: 'PDF' },
            { name: 'AI Efficiency Metrics December', date: '2026-01-03', size: '1.2 MB', type: 'PDF' },
          ].map((report, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">{report.date} • {report.size} • {report.type}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Insights */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">This Month's Key Insights</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800">+15%</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
            <p className="font-semibold text-gray-900">15% increase from last month</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">+3</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">New Customers</p>
            <p className="font-semibold text-gray-900">3 new companies registered</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-800">82%</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">AI Automation Rate</p>
            <p className="font-semibold text-gray-900">Inquiry handling automation</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-800">VIP</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Top Customer</p>
            <p className="font-semibold text-gray-900">Global Freight Solutions</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
