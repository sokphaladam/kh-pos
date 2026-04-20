interface SettingHeaderProps {
  label: string;
  description?: string;
}

export const SettingHeader: React.FC<SettingHeaderProps> = ({
  label,
  description,
}) => (
  <div className="bg-white border-b border-gray-200 p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {label}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  </div>
);
