import React from 'react';
import HospitableListingImporter from '@/components/HospitableListingImporter';
import { Meta } from '@/lib/seo';

const HospitableImport: React.FC = () => {
  return (
    <>
      <Meta 
        title="Import Hospitable Listings | StayDirectly"
        description="Import your property listings from Hospitable to display on your website"
        canonical="/admin/import"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Import Listings</h1>
          <p className="text-gray-600 mb-8">
            Connect your Hospitable account and import properties to display on your website.
            This will sync properties from Hospitable to your StayDirectly website.
          </p>
          
          <HospitableListingImporter />
        </div>
      </div>
    </>
  );
};

export default HospitableImport;