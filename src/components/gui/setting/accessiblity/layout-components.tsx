import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Shield className="h-16 w-16 text-gray-400 mx-auto mb-6" />,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="text-center py-16 px-8">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
        {description}
      </p>
    </div>
  </div>
);

interface HeaderSectionProps {
  onAddRole: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ onAddRole }) => (
  <div className="flex items-center justify-between mb-10">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Role Permissions
      </h1>
      <p className="text-gray-500 text-lg">
        Manage access permissions for each role in your system
      </p>
    </div>
    <Button
      onClick={onAddRole}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-auto text-base font-medium rounded-xl"
    >
      <Plus className="h-5 w-5 mr-2" />
      Add New Role
    </Button>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      </div>
      <p className="text-gray-500 text-lg">Loading roles...</p>
    </div>
  </div>
);
