"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon, PlusIcon, XIcon, SpaceIcon } from "lucide-react";
import { useState } from "react";
import { SEAT_TYPES } from "../../components/seat-layout";

type SeatType = keyof typeof SEAT_TYPES;

export interface SeatPart {
  id: string;
  range: string;
  description?: string;
}

interface Props {
  selectedSeatType: SeatType;
  setSelectedSeatTypeAction: (type: SeatType) => void;
  parts: SeatPart[];
  setPartsAction: (parts: SeatPart[]) => void;
}

export function HallSeatConfiguration({
  selectedSeatType,
  setSelectedSeatTypeAction,
  parts,
  setPartsAction,
}: Props) {
  const [newPartRange, setNewPartRange] = useState("");
  const [newPartDescription, setNewPartDescription] = useState("");

  const validatePartRange = (range: string): boolean => {
    // Validate format like "A3:B3" or "A1:A5"
    const rangeRegex = /^[A-Z]\d+:[A-Z]\d+$/;
    return rangeRegex.test(range);
  };

  const addPart = () => {
    if (!newPartRange.trim()) return;

    if (!validatePartRange(newPartRange)) {
      alert("Please enter a valid range format (e.g., A3:B3)");
      return;
    }

    const newPart: SeatPart = {
      id: Date.now().toString(),
      range: newPartRange.toUpperCase(),
      description: newPartDescription.trim() || undefined,
    };

    setPartsAction([...parts, newPart]);
    setNewPartRange("");
    setNewPartDescription("");
  };

  const removePart = (partId: string) => {
    setPartsAction(parts.filter((part) => part.id !== partId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Seat Type Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <PlusIcon className="h-5 w-5 text-green-500" />
            Seat Configuration
          </CardTitle>
          <CardDescription>
            Select a seat type and click on seats to apply it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="seatType"
              className="text-sm font-medium text-slate-700"
            >
              Select Seat Type to Apply
            </Label>
            <Select
              value={selectedSeatType}
              onValueChange={(value: SeatType) =>
                setSelectedSeatTypeAction(value)
              }
            >
              <SelectTrigger className="w-full max-w-xs transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 border-slate-200">
                <SelectValue placeholder="Choose seat type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEAT_TYPES)
                  .filter(
                    ([key]) => key !== "reserved" && key !== "reserved-selected"
                  )
                  .map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-3 py-1">
                        <div className={`w-4 h-4 rounded ${type.color}`}></div>
                        <div className="flex flex-col">
                          <span className="font-medium text-left">
                            {type.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {type.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Alert className="border-blue-200 bg-blue-50/50">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                💡 Click on any seat in the layout below to apply the selected
                type. You can change seat types anytime before saving.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Parts Configuration */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <SpaceIcon className="h-5 w-5 text-purple-500" />
            Layout Parts Configuration
          </CardTitle>
          <CardDescription>
            Define spaces or sections in your layout using seat ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Part */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              Add New Part
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Range (e.g., A3:B3)"
                  value={newPartRange}
                  onChange={(e) => setNewPartRange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Description (optional)"
                  value={newPartDescription}
                  onChange={(e) => setNewPartDescription(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <Button
                onClick={addPart}
                className="bg-purple-500 hover:bg-purple-600 transition-colors"
                disabled={!newPartRange.trim()}
              >
                Add Part
              </Button>
            </div>
            <Alert className="border-purple-200 bg-purple-50/50">
              <InfoIcon className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-purple-700">
                💡 Use format like &quot;A3:B3&quot; to create a space from seat
                A3 to B3. This helps organize different sections of your cinema
                hall.
              </AlertDescription>
            </Alert>
          </div>

          {/* Current Parts List */}
          {parts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Current Parts ({parts.length})
              </Label>
              <div className="space-y-2">
                {parts.map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-700">
                          {part.range}
                        </span>
                        {part.description && (
                          <span className="text-sm text-slate-600">
                            - {part.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(part.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <SpaceIcon className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>No parts configured yet</p>
              <p className="text-sm">
                Add parts to organize your cinema layout
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
