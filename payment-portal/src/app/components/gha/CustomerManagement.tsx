import { useState, useEffect } from 'react';
import { Search, Mail, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ghaApi } from '../../services/apiClient';

type Customer = { id: string; companyName: string; email: string; totalTransactions: number; lastPaymentDate: string; totalSpent: number };
type Activity = { type: string; description: string; timestamp: string };

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    ghaApi.getCustomers(1, 20).then(data => setCustomers(data.items)).catch(() => {});
    ghaApi.getRecentActivity(5).then(setActivities).catch(() => {});
  }, []);
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Customers</p>
              <p className="text-3xl font-bold text-green-600">{customers.length}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Transaction Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Transaction Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by company name or email..." className="pl-10" />
          </div>
          <Button variant="outline">Search</Button>
        </div>
      </Card>

      {/* Customer List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer List</h3>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="border rounded-lg p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-lg h-12 w-12 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{customer.companyName}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
                  <p className="text-lg font-semibold text-gray-900">{customer.totalTransactions} txns</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Payment</p>
                  <p className="text-lg font-semibold text-gray-900">{customer.lastPaymentDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Button variant="outline" size="sm">View History</Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Customer Activity Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customer Activity</h3>
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center border-2 border-blue-200">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
