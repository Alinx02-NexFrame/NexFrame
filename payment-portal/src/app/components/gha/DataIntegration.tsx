import { useState } from 'react';
import { Upload, Link2, Brain, CheckCircle, Settings, Sparkles, Database } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

export function DataIntegration() {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleTestConnection = () => {
    toast.success('Connection Test Successful', {
      description: 'API connection is working properly.'
    });
  };

  const handleUploadData = () => {
    toast.success('Data Upload Complete', {
      description: 'AI is analyzing the data.'
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-100 rounded-full p-3">
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900 mb-1">AI Smart Logistics System</h3>
            <p className="text-sm text-purple-700 mb-3">
              AI LLM automatically analyzes and cleanses unstructured logistics data for system integration.
            </p>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                AI Active
              </Badge>
              <span className="text-sm text-purple-700">
                • Auto Data Cleansing • Status Prediction • Smart Response
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="upload">Manual Upload</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
        </TabsList>

        {/* API Integration */}
        <TabsContent value="api">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Link2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Standard API Integration</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Real-time backend integration for large GHAs. Automatically synchronize cargo data via RESTful API.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-url">API Endpoint URL</Label>
                  <Input id="api-url" placeholder="https://api.your-gha.com/v1/cargo" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" type="password" placeholder="your-api-key-here" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-2" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto Sync</p>
                    <p className="text-sm text-gray-500">Automatically sync when data changes</p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleTestConnection} variant="outline">Test Connection</Button>
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enable Integration
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-3">API Integration Guide</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded font-mono">
                  <p className="text-gray-600 mb-1">POST /api/cargo/sync</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "awbNumber": "020-12345678",
  "arrivalDate": "2026-01-08",
  "customsStatus": "Released",
  "breakdownStatus": "Completed"
}`}
                  </pre>
                </div>
                <p className="text-gray-600">
                  For detailed API documentation, please refer to the <a href="#" className="text-blue-600 underline">Developer Guide</a>.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Manual Upload */}
        <TabsContent value="upload">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Web-API Link (Manual Upload)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Simple upload interface for small to mid-size GHAs. Upload Excel or CSV files and AI will analyze automatically.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Drag files here or click to upload</p>
                <p className="text-sm text-gray-500 mb-4">Supported formats: Excel (.xlsx), CSV (.csv), JSON (.json)</p>
                <Button onClick={handleUploadData}>Select File</Button>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">AI Automatic Data Cleansing</p>
                  <p>AI analyzes cargo data in different formats and automatically organizes it to match the system requirements.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Recent Upload History</h4>
              <div className="space-y-3">
                {[
                  { file: 'cargo_data_2026_01.xlsx', date: '2026-01-09 14:30', status: 'success', records: 45 },
                  { file: 'awb_list_batch_2.csv', date: '2026-01-08 09:15', status: 'success', records: 32 },
                  { file: 'shipment_update.json', date: '2026-01-07 16:45', status: 'processing', records: 28 },
                ].map((upload, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{upload.file}</p>
                        <p className="text-sm text-gray-500">{upload.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{upload.records} records</span>
                      {upload.status === 'success' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai-settings">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI LLM Feature Settings</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Configure AI features that will be provided on the customer portal.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">AI Data Cleansing</p>
                    <p className="text-sm text-gray-500">Automatically analyze and cleanse unstructured data</p>
                  </div>
                  <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">AI Status Prediction</p>
                    <p className="text-sm text-gray-500">AI predicts and provides cargo delivery availability time</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">AI Smart Response</p>
                    <p className="text-sm text-gray-500">AI chatbot automatically responds to customer inquiries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto Notification</p>
                    <p className="text-sm text-gray-500">Automatically notify customers when storage fees exceed limit</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">AI Performance Analytics</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Data Cleansing Rate</p>
                  <p className="text-3xl font-bold text-green-900">98.5%</p>
                  <p className="text-xs text-green-600 mt-1">Auto-processing success rate</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Workload Reduction</p>
                  <p className="text-3xl font-bold text-blue-900">82%</p>
                  <p className="text-xs text-blue-600 mt-1">Simple inquiries auto-handled</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 mb-1">Prediction Accuracy</p>
                  <p className="text-3xl font-bold text-purple-900">91.2%</p>
                  <p className="text-xs text-purple-600 mt-1">Delivery time prediction</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">AI Custom Settings</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-tone">AI Response Tone & Manner</Label>
                  <Textarea id="ai-tone" placeholder="E.g., Respond in a friendly and professional tone, answering customer inquiries promptly..." className="mt-2" rows={3} />
                </div>
                <div>
                  <Label htmlFor="auto-messages">Auto Notification Message Template</Label>
                  <Textarea id="auto-messages" placeholder="E.g., Hello [Customer Name], the free storage period for AWB [AWB Number] cargo expires on [Date]..." className="mt-2" rows={3} />
                </div>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
