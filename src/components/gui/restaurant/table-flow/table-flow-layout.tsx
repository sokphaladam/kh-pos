"use client";
import { table_restaurant_tables } from "@/generated/tables";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  MiniMap,
  NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import "@xyflow/react/dist/style.css";
import moment from "moment-timezone";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { sheetCreateTable } from "../table/sheet-create-table";
import { TableFlowControls } from "./table-flow-controls";
import { TableFlowNode, TableNodeData } from "./table-flow-node";
import { useTablePositions } from "./use-table-positions";
import { tableQRCode } from "./table-qr-code";

const nodeTypes: NodeTypes = {
  tableNode: TableFlowNode,
};

// Grid layout helpers
const GRID_SIZE = 20;
const TABLE_WIDTH = 200;
const TABLE_HEIGHT = 120;
const TABLE_SPACING = 40;

function TableFlowLayoutContent(
  props: WithLayoutPermissionProps & {
    autoRefresh: boolean;
    setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  },
) {
  const { state, isRequest } = useRestaurant();
  const router = useRouter();
  const pathname = usePathname();
  const { selectTable, removeTable, resetTableToAvailable } =
    useRestaurantActions();
  const { savePositions, loadPositions, clearPositions, isSaving } =
    useTablePositions();
  const [showMinimap, setShowMinimap] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // For debugging purposes, create some sample tables if none exist and we're in development
  const debugTables = useMemo(() => {
    if (
      process.env.NODE_ENV === "development" &&
      (!state?.tables || state.tables.length === 0)
    ) {
      return [
        {
          id: "debug-1",
          table_name: "Table 1",
          setting_capacity: 4,
          section: "Main",
          table_shape: "round",
          location_description: "Near window",
          special_features: "Window view",
          addional_notes: "Sample table",
          status: "available" as const,
          created_at: new Date().toISOString(),
          created_by: "debug",
          warehouse_id: "debug",
          deleted_at: null,
          deleted_by: null,
          position_x: "100",
          position_y: "100",
        },
        {
          id: "debug-2",
          table_name: "Table 2",
          setting_capacity: 2,
          section: "Main",
          table_shape: "square",
          location_description: "Center area",
          special_features: "",
          addional_notes: "Sample table",
          status: "order_taken" as const,
          created_at: new Date().toISOString(),
          created_by: "debug",
          warehouse_id: "debug",
          deleted_at: null,
          deleted_by: null,
          position_x: "350",
          position_y: "100",
        },
      ];
    }
    return state?.tables || [];
  }, [state?.tables]);

  const handleTableClick = useCallback(
    (table: table_restaurant_tables) => {
      const params = new URLSearchParams();
      selectTable(table);
      if (table.status === "available") {
        params.set("table", table.id);
        params.set("tab", "menu");
      }
      if (table.status === "order_taken") {
        params.set("table", table.id);
        params.set("tab", "menu");
      }
      router.push(`${pathname}?${params.toString()}`);
      // toast.success(`Table ${table.table_name} selected`);
    },
    [pathname, router, selectTable],
  );

  const handleTableEdit = useCallback((table: table_restaurant_tables) => {
    sheetCreateTable.show({
      id: table.id,
      data: {
        tableNumber: table.table_name,
        seatingCapacity: table.setting_capacity,
        section: table.section || "",
        tableShape: table.table_shape || "",
        locationDescription: table.location_description || "",
        features: table.special_features
          ? table.special_features.split(", ")
          : [],
        additionalNotes: table.addional_notes || "",
      },
    });
  }, []);

  const handleTableDelete = useCallback(
    (table: table_restaurant_tables) => {
      if (
        window.confirm(
          `Are you sure you want to delete table ${table.table_name}?`,
        )
      ) {
        removeTable(table);
        toast.success(`Table ${table.table_name} deleted`);
      }
    },
    [removeTable],
  );

  const handleTableReset = useCallback(
    (table: table_restaurant_tables) => {
      resetTableToAvailable(table);
      toast.success(`Table ${table.table_name} reset to available`);
    },
    [resetTableToAvailable],
  );

  const handleTableQRCode = useCallback(
    async (table: table_restaurant_tables) => {
      await tableQRCode.show({ tableId: table.id });
    },
    [],
  );

  // Initialize nodes with better positioning
  const initialNodes = useMemo(() => {
    const positions = loadPositions(debugTables);
    const tablesToUse = debugTables;

    if (!tablesToUse || tablesToUse.length === 0) {
      return [];
    }

    return tablesToUse.map((table, index) => {
      // Calculate grid position if no saved position
      const row = Math.floor(index / 4);
      const col = index % 4;
      const defaultX = col * (TABLE_WIDTH + TABLE_SPACING) + 50;
      const defaultY = row * (TABLE_HEIGHT + TABLE_SPACING) + 50;

      // Get order info for the table
      const activeTable = state.activeTables.find(
        (at) => at.tables?.id === table.id,
      );
      const orderCount = activeTable?.orders?.items?.length || 0;
      const createdAt = activeTable?.orders?.createdAt
        ? activeTable?.orders?.createdAt
        : "";
      const orderElapsedTime = createdAt
        ? moment(createdAt).fromNow(true)
        : undefined;

      // Calculate total order amount after discount
      const totalOrder =
        activeTable?.orders?.items?.reduce((sum, item) => {
          const totalAmount =
            typeof item.totalAmount === "number"
              ? item.totalAmount
              : parseFloat(item.totalAmount || "0");
          return sum + totalAmount;
        }, 0) || 0;

      // Calculate total discount amount
      const totalDiscount =
        activeTable?.orders?.items?.reduce((sum, item) => {
          const discountAmount =
            typeof item.discountAmount === "number"
              ? item.discountAmount
              : parseFloat(item.discountAmount || "0");
          return sum + discountAmount;
        }, 0) || 0;

      // Check if any item has been sent to kitchen (has kitchenLogs) and is still
      // cooking for more than 5 minutes
      const OVERDUE_COOKING_MINUTES = 5;
      const hasOverdueCooking =
        activeTable?.orders?.items?.some((item) => {
          const logs = item.kitchenLogs;
          if (!logs || logs.length === 0) return false;
          const cookingStatus = item.status?.find(
            (s) => s.status === "cooking",
          );
          if (!cookingStatus || cookingStatus.qty <= 0) return false;
          const latestLog = logs.reduce((a, b) =>
            new Date(b.printedAt || 0) > new Date(a.printedAt || 0) ? b : a,
          );
          if (!latestLog.printedAt) return false;
          const minutesSince =
            (Date.now() - new Date(latestLog.printedAt).getTime()) / 1000 / 60;
          return minutesSince > OVERDUE_COOKING_MINUTES;
        }) || false;

      const tableData: TableNodeData = {
        ...table,
        orderCount,
        orderElapsedTime,
        totalOrder,
        totalDiscount,
        hasOverdueCooking,
        customer: activeTable?.orders?.customer || 0,
        printCount: activeTable?.orders?.printCount || 0,
        onTableClick: handleTableClick,
        onTableEdit: handleTableEdit,
        onTableDelete: handleTableDelete,
        onTableReset: handleTableReset,
        onTableQRCode: handleTableQRCode,
        permission: {
          allowUpdate: props.allowUpdate,
          allowDelete: props.allowDelete,
          allowCreate: props.allowCreate,
          allowViewOnly: props.allowViewOnly,
        },
      };

      return {
        id: `table-${table.id}`,
        type: "tableNode",
        position: positions[table.id] || { x: defaultX, y: defaultY },
        data: tableData as unknown as Record<string, unknown>,
        draggable: editMode,
        selectable: true,
      };
    });
  }, [
    state.activeTables,
    debugTables,
    handleTableClick,
    handleTableEdit,
    handleTableDelete,
    handleTableReset,
    loadPositions,
    editMode,
    props,
    handleTableQRCode,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when state changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // --- Overdue cooking sound + vibration alert ---
  const alertIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playOverdueAlert = useCallback(() => {
    // Web Audio API beep — two short pulses
    try {
      const ctx = new AudioContext();
      const beep = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      };
      beep(ctx.currentTime);
      beep(ctx.currentTime + 0.35);
    } catch {
      // AudioContext may be blocked in some browsers; fail silently
    }
    // Vibration API — two pulses
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const anyOverdueCooking = useMemo(
    () =>
      initialNodes.some(
        (n) =>
          (n.data as unknown as { hasOverdueCooking?: boolean })
            .hasOverdueCooking,
      ),
    [initialNodes],
  );

  useEffect(() => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    if (anyOverdueCooking) {
      playOverdueAlert();
      alertIntervalRef.current = setInterval(playOverdueAlert, 30_000);
    }
    return () => {
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
        alertIntervalRef.current = null;
      }
    };
  }, [anyOverdueCooking, playOverdueAlert]);
  // --- end overdue alert ---

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Save positions to localStorage
  const handleSaveLayout = useCallback(() => {
    savePositions(nodes);
  }, [nodes, savePositions]);

  // Reset to grid layout
  const handleResetLayout = useCallback(() => {
    const updatedNodes = nodes.map((node, index) => {
      if (node.id.startsWith("table-")) {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = col * (TABLE_WIDTH + TABLE_SPACING) + 50;
        const y = row * (TABLE_HEIGHT + TABLE_SPACING) + 50;
        return { ...node, position: { x, y } };
      }
      return node;
    });
    setNodes(updatedNodes);
    clearPositions(debugTables);
    toast.success("Layout reset to grid");
  }, [nodes, setNodes, clearPositions, debugTables]);

  // Auto-arrange in grid
  const handleAutoArrange = useCallback(() => {
    const availableTables = nodes.filter((n) => n.data?.status === "available");
    const occupiedTables = nodes.filter((n) => n.data?.status !== "available");

    let nodeIndex = 0;
    const updatedNodes = [...occupiedTables, ...availableTables].map((node) => {
      const row = Math.floor(nodeIndex / 4);
      const col = nodeIndex % 4;
      const x = col * (TABLE_WIDTH + TABLE_SPACING) + 50;
      const y = row * (TABLE_HEIGHT + TABLE_SPACING) + 50;
      nodeIndex++;
      return { ...node, position: { x, y } };
    });

    setNodes(updatedNodes);
    toast.success("Tables arranged by status");
  }, [nodes, setNodes]);

  const handleAddTable = useCallback(() => {
    sheetCreateTable.show({});
  }, []);

  // Stats for display
  const stats = useMemo(() => {
    const available = nodes.filter(
      (n) => n.data?.status === "available",
    ).length;
    const occupied = nodes.filter(
      (n) => n.data?.status === "order_taken",
    ).length;
    const cleaning = nodes.filter((n) => n.data?.status === "cleaning").length;
    return { available, occupied, cleaning, total: nodes.length };
  }, [nodes]);

  // Show loading or empty state if no tables
  if (!state || !state.tables || state.tables.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-2">
            {!state ? "Loading..." : "No Tables Found"}
          </div>
          <div className="text-sm text-gray-500 mb-6">
            {!state
              ? "Please wait while we load your restaurant data."
              : "Create your first table to start managing your restaurant layout."}
          </div>
          {state && (
            <button
              onClick={handleAddTable}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Add First Table
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        defaultViewport={{ x: 0, y: 0, zoom: 0.2 }}
        minZoom={0.2}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        elementsSelectable={true}
        panOnDrag={isRequest ? false : true}
        zoomOnScroll={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Background gap={GRID_SIZE} size={1} />
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              switch (node.data?.status) {
                case "available":
                  return "#10b981";
                case "order_taken":
                  return "#3b82f6";
                case "cleaning":
                  return "#f59e0b";
                default:
                  return "#6b7280";
              }
            }}
            pannable
            zoomable
          />
        )}

        {/* Top Panel - Stats */}
        <Panel position="top-left" className="m-4">
          <TableFlowControls
            stats={stats}
            onSaveLayout={handleSaveLayout}
            onResetLayout={handleResetLayout}
            onAutoArrange={handleAutoArrange}
            onAddTable={handleAddTable}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
            isSaving={isSaving}
            isEditMode={editMode}
            onToggleEditMode={() => {
              setEditMode(!editMode);
              props.setAutoRefresh(!props.autoRefresh);
            }}
            {...props}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function TableFlowLayout(
  props: WithLayoutPermissionProps & {
    autoRefresh: boolean;
    setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  },
) {
  const { state, dispatch } = useRestaurant();

  // Check if restaurant context is available
  if (!state) {
    console.error("Restaurant state is null or undefined");
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Restaurant context not available</p>
          <p className="text-sm text-gray-500">
            Please check restaurant provider setup
          </p>
        </div>
      </div>
    );
  }

  if (!dispatch) {
    console.error("Restaurant dispatch not available");
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Restaurant dispatch not available</p>
          <p className="text-sm text-gray-500">
            Please check restaurant provider setup
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[90vh] w-full relative">
      <ReactFlowProvider>
        <TableFlowLayoutContent
          {...props}
          autoRefresh={props.autoRefresh}
          setAutoRefresh={props.setAutoRefresh}
        />
      </ReactFlowProvider>
    </div>
  );
}
