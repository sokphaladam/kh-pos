"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormDataHall } from "../hall-seat-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Feather,
  Monitor,
  Volume2,
  Armchair,
  Coffee,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  form: UseFormReturn<FormDataHall>;
}

export function HallFeature({ form }: Props) {
  const { setValue, watch } = form;
  const features =
    (watch("features") as Record<string, Record<string, boolean>>) || {};
  const [isOpen, setIsOpen] = useState(false);

  // Count total selected features
  const totalSelectedFeatures = Object.values(features).reduce(
    (total, category) => {
      return total + Object.values(category || {}).filter(Boolean).length;
    },
    0
  );

  const handleFeatureChange = (
    category: string,
    feature: string,
    checked: boolean
  ) => {
    const currentFeatures = { ...features };
    if (!currentFeatures[category]) {
      currentFeatures[category] = {};
    }
    currentFeatures[category][feature] = checked;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue("features", currentFeatures as any, { shouldDirty: true });
  };

  const FeatureSection = ({
    title,
    icon: Icon,
    category,
    items,
  }: {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    category: string;
    items: { key: string; label: string }[];
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-500" />
        <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
        {items.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`${category}-${key}`}
              checked={features[category]?.[key] || false}
              onCheckedChange={(checked) =>
                handleFeatureChange(category, key, !!checked)
              }
            />
            <Label
              htmlFor={`${category}-${key}`}
              className="text-sm cursor-pointer hover:text-blue-600"
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-4 hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-2">
                <Feather className="h-5 w-5 text-blue-500" />
                Hall Features
                {totalSelectedFeatures > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    {totalSelectedFeatures} selected
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </CardTitle>
            <CardDescription className="text-left">
              Select the special features and amenities available in this hall
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <FeatureSection
              title="Visual Features"
              icon={Monitor}
              category="visual"
              items={[
                { key: "imax", label: "IMAX" },
                { key: "3d", label: "3D Capable" },
                { key: "4dx", label: "4DX Motion Seats" },
                { key: "screenx", label: "ScreenX" },
                { key: "dolby_cinema", label: "Dolby Cinema" },
                { key: "laser_projection", label: "Laser Projection" },
              ]}
            />

            <FeatureSection
              title="Audio Features"
              icon={Volume2}
              category="audio"
              items={[
                { key: "dolby_atmos", label: "Dolby Atmos" },
                { key: "dts_x", label: "DTS:X" },
                { key: "thx_certified", label: "THX Certified" },
              ]}
            />

            <FeatureSection
              title="Seating Options"
              icon={Armchair}
              category="seating"
              items={[
                { key: "recliners", label: "Reclining Seats" },
                { key: "dbox", label: "D-BOX Motion Seats" },
                { key: "beds", label: "Bed Cinema" },
              ]}
            />

            <FeatureSection
              title="Amenities"
              icon={Coffee}
              category="amenities"
              items={[
                { key: "in_seat_dining", label: "In-Seat Dining" },
                { key: "vip_lounge", label: "VIP Lounge Access" },
                { key: "bar_service", label: "Bar Service" },
              ]}
            />

            <FeatureSection
              title="Specialty Cinema"
              icon={Star}
              category="specialty"
              items={[
                { key: "kids_cinema", label: "Kids Cinema" },
                { key: "adults_only", label: "Adults Only" },
                { key: "art_house", label: "Art House Films" },
              ]}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
