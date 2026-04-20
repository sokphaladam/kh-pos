import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { usePermission } from "@/hooks/use-permissions";
import { useReactFlow } from "@xyflow/react";
import {
  Edit,
  Eye,
  EyeOff,
  Grid3x3,
  LayoutGrid,
  Lock,
  Maximize2,
  Move,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface TableFlowControlsProps extends WithLayoutPermissionProps {
  stats: {
    available: number;
    occupied: number;
    cleaning: number;
    total: number;
  };
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onAutoArrange: () => void;
  onAddTable: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  isSaving?: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export function TableFlowControls({
  stats,
  onSaveLayout,
  onResetLayout,
  onAutoArrange,
  onAddTable,
  showMinimap,
  onToggleMinimap,
  isSaving = false,
  isEditMode = false,
  onToggleEditMode,
  ...rest
}: TableFlowControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const hasTablePermission = usePermission("table");
  const canCreate = hasTablePermission.includes("create");
  const canUpdate = hasTablePermission.includes("update");

  return (
    <>
      {/* Stats Panel */}
      <Card className="p-3 sm:p-4 bg-white/95 backdrop-blur-sm shadow-lg border-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Table Layout
            </h2>
            <Badge variant="outline" className="text-xs">
              {stats.total} tables
            </Badge>
            <Badge
              variant={isEditMode ? "default" : "secondary"}
              className={`text-xs ${
                isEditMode
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isEditMode ? (
                <>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  View Only
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium text-green-700 text-xs sm:text-sm">
                      {stats.available}
                    </span>
                    <span className="hidden sm:inline text-xs text-green-600">
                      avail
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available tables</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-blue-700 text-xs sm:text-sm">
                      {stats.occupied}
                    </span>
                    <span className="hidden sm:inline text-xs text-blue-600">
                      busy
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Occupied tables</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500"></div>
                    <span className="font-medium text-amber-700 text-xs sm:text-sm">
                      {stats.cleaning}
                    </span>
                    <span className="hidden sm:inline text-xs text-amber-600">
                      clean
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cleaning tables</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>

      {/* Main Controls */}
      {(canCreate || canUpdate) && (
        <Card className="p-2 bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Edit Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {rest.allowCreate || rest.allowUpdate ? (
                    <Button
                      size="sm"
                      variant={isEditMode ? "default" : "outline"}
                      onClick={onToggleEditMode}
                      className={`px-2 sm:px-3 ${
                        isEditMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : ""
                      }`}
                    >
                      {isEditMode ? (
                        <Edit className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      <span className="hidden md:inline ml-1">
                        {isEditMode ? "Edit Mode" : "View Only"}
                      </span>
                    </Button>
                  ) : (
                    <></>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isEditMode
                      ? "Disable editing (tables can be moved/modified)"
                      : "Enable editing (lock table positions)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-6 bg-gray-300 mx-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddTable}
                    disabled={!isEditMode}
                    className="px-2 sm:px-3"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Add Table</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isEditMode
                      ? "Add new table (Ctrl+N)"
                      : "Enable edit mode to add tables"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAutoArrange}
                    disabled={!isEditMode}
                    className="px-2 sm:px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Auto</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isEditMode
                      ? "Arrange tables by status (Ctrl+A)"
                      : "Enable edit mode to arrange tables"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onResetLayout}
                    disabled={!isEditMode}
                    className="px-2 sm:px-3"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Grid</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isEditMode
                      ? "Reset to grid layout (Ctrl+R)"
                      : "Enable edit mode to reset layout"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSaveLayout}
                    disabled={isSaving || !isEditMode}
                    className="px-2 sm:px-3"
                  >
                    <Save
                      className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`}
                    />
                    <span className="hidden md:inline ml-1">
                      {isSaving ? "Saving..." : "Save"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isEditMode
                      ? "Save current layout (Ctrl+S)"
                      : "Enable edit mode to save layout"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* View Controls - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => zoomIn()}
                      className="px-2"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom in</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => zoomOut()}
                      className="px-2"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fitView()}
                      className="px-2"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fit view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onToggleMinimap}
                      className="px-2"
                    >
                      {showMinimap ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showMinimap ? "Hide" : "Show"} minimap</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="px-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Mobile view controls */}
                <div className="sm:hidden">
                  <DropdownMenuItem onClick={() => zoomIn()}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => zoomOut()}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom Out
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fitView()}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fit View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleMinimap}>
                    {showMinimap ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showMinimap ? "Hide" : "Show"} Minimap
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={onToggleEditMode}>
                  {isEditMode ? (
                    <Lock className="h-4 w-4 mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode ? "Lock Layout" : "Enable Edit Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => localStorage.removeItem("table-positions")}
                  disabled={!isEditMode}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Saved Positions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Move className="h-4 w-4 mr-2" />
                  Print Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      )}
    </>
  );
}
