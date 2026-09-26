import { LatticeLoader } from "@/components/ui/lattice-loader";
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
  icon = <Shield className="h-16 w-16 text-muted-foreground/70 mx-auto mb-6" />,
}) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden">
    <div className="text-center py-16 px-8">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
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
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Role Permissions
      </h1>
      <p className="text-muted-foreground text-lg">
        Manage access permissions for each role in your system
      </p>
    </div>
    <Button
      onClick={onAddRole}
      className="px-4"
    >
      <Plus className="h-5 w-5 mr-2" />
      Add New Role
    </Button>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <LatticeLoader label="Loading roles" />
  </div>
);
