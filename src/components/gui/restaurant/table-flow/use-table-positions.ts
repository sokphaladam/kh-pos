import { useMutationUpdateTableLayout } from "@/app/hooks/use-query-table";
import { useCallback } from "react";
import { toast } from "sonner";

interface SavedPosition {
  x: number;
  y: number;
}

// Extended table interface that includes position fields
interface TableWithPosition {
  id: string;
  position_x?: string | null;
  position_y?: string | null;
}

export function useTablePositions() {
  const updateLayoutMutation = useMutationUpdateTableLayout();

  // Save positions directly to backend
  const savePositions = useCallback(
    async (nodes: { id: string; position: { x: number; y: number } }[]) => {
      try {
        // Show loading toast
        const loadingToast = toast.loading("Saving table layout...", {
          description: "Please wait while we save your changes",
        });

        // Prepare data for backend mutation
        const layoutUpdates: {
          id: string;
          positionX?: string;
          positionY?: string;
        }[] = [];

        console.log(nodes);

        nodes.forEach((node) => {
          if (node.id.startsWith("table-")) {
            const tableId = node.id.replace("table-", "");

            // For backend API (convert to strings as expected by the API)
            layoutUpdates.push({
              id: tableId,
              positionX: node.position.x.toString(),
              positionY: node.position.y.toString(),
            });
          }
        });

        // Save to backend
        if (layoutUpdates.length > 0) {
          await updateLayoutMutation.trigger(layoutUpdates);
        }

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Table layout saved successfully!", {
          description: `Saved ${layoutUpdates.length} table positions`,
          duration: 2000,
        });

        return true;
      } catch (error) {
        console.error("Failed to save table positions:", error);
        toast.error("Failed to save layout", {
          description:
            error instanceof Error ? error.message : "Please try again",
          duration: 3000,
        });
        return false;
      }
    },
    [updateLayoutMutation]
  );

  // Load positions from table data (from state.tables)
  const loadPositions = useCallback((tables?: TableWithPosition[]) => {
    try {
      if (!tables) return {};

      const positions: Record<string, SavedPosition> = {};

      tables.forEach((table) => {
        if (table.position_x && table.position_y) {
          const x = parseFloat(table.position_x);
          const y = parseFloat(table.position_y);

          if (!isNaN(x) && !isNaN(y)) {
            positions[table.id] = { x, y };
          }
        }
      });

      return positions;
    } catch (error) {
      console.error("Failed to load table positions:", error);
      return {};
    }
  }, []);

  // Clear saved positions (reset positions in database)
  const clearPositions = useCallback(
    async (tables?: TableWithPosition[]) => {
      try {
        if (!tables || tables.length === 0) {
          toast.error("No tables to clear positions for");
          return false;
        }

        // Show loading toast
        const loadingToast = toast.loading("Clearing table positions...", {
          description: "Resetting all table positions",
        });

        // Prepare data to clear positions (set to null)
        const layoutUpdates = tables.map((table) => ({
          id: table.id,
          positionX: undefined,
          positionY: undefined,
        }));

        // Clear positions in backend
        await updateLayoutMutation.trigger(layoutUpdates);

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Table positions cleared", {
          description: "Tables will return to default positions",
          duration: 2000,
        });

        return true;
      } catch (error) {
        console.error("Failed to clear table positions:", error);
        toast.error("Failed to clear positions", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
        return false;
      }
    },
    [updateLayoutMutation]
  );

  // Get layout info from tables
  const getLayoutInfo = useCallback((tables?: TableWithPosition[]) => {
    try {
      if (!tables) return null;

      const tablesWithPositions = tables.filter(
        (table) => table.position_x && table.position_y
      );

      return {
        tableCount: tablesWithPositions.length,
        totalTables: tables.length,
        hasPositions: tablesWithPositions.length > 0,
      };
    } catch (error) {
      console.error("Failed to get layout info:", error);
      return null;
    }
  }, []);

  return {
    savePositions,
    loadPositions,
    clearPositions,
    getLayoutInfo,
    isSaving: updateLayoutMutation.isMutating,
    saveError: updateLayoutMutation.error,
  };
}
