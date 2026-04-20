"use client";

import { CinemaHall } from "@/classes/cinema/hall";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users } from "lucide-react";

interface HallSelectionStepProps {
  halls: CinemaHall[];
  loading: boolean;
  onHallSelect: (hall: CinemaHall) => void;
}

export function HallSelection({
  halls,
  loading,
  onHallSelect,
}: HallSelectionStepProps) {
  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            Select Hall
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose which cinema hall you want to scan tickets for
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-xl">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          Select Hall
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Choose which cinema hall you want to scan tickets for
        </p>
      </CardHeader>
      <CardContent>
        {halls.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              No active halls found
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Please ensure halls are configured and active
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall) => {
              const totalSeatNotVailable = hall.seats.filter(
                (f) => f.type === "blocked",
              ).length;
              return (
                <Card
                  key={hall.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-200 active:scale-95"
                  onClick={() => onHallSelect(hall)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-colors">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-blue-700 transition-colors">
                            {hall.name}
                          </h3>
                          <Badge
                            className="mt-1"
                            variant={
                              hall.status === "active" ? "default" : "secondary"
                            }
                          >
                            {hall.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {hall.totalSeats - totalSeatNotVailable} total seats
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tap to select this hall
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
