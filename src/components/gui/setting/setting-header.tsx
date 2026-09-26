interface SettingHeaderProps {
  label: string;
  description?: string;
}

export const SettingHeader: React.FC<SettingHeaderProps> = ({
  label,
  description,
}) => (
  <div className="bg-card border-b border-border p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground capitalize">
            {label}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  </div>
);
