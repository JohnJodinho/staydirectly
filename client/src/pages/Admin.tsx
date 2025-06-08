import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PropertyEmbedsManager from '@/components/admin/PropertyEmbedsManager';
import { Card } from '@/components/ui/card';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('embeds');
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="embeds" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="embeds">Embed Codes</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="embeds">
          <Card className="p-6">
            <PropertyEmbedsManager />
          </Card>
        </TabsContent>
        
        <TabsContent value="properties">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Property Management</h2>
            <p>Property management functionality will be implemented in future updates.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">User Management</h2>
            <p>User management functionality will be implemented in future updates.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;