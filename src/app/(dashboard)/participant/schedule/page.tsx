"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin } from "lucide-react";

type ScheduleItem = {
  time: string;
  title: string;
  // description: string;
  // venue: string;
};

const scheduleData: Record<string, ScheduleItem[]> = {
  day1: [
    { time: "08:00 - 09:30 AM", title: "Breakfast",  },
    { time: "08:30 - 05:00 PM", title: "Registration Open",  },
    { time: "12:30 - 01:30 PM", title: "Lunch",  },
    { time: "02:30 - 04:00 PM", title: "Opening Ceremony",  },
    { time: "04:00 - 04:30 PM", title: "Tech Talk - JetBrains",  },
    { time: "05:00 - 07:00 PM", title: "Practice Contest",  },
    { time: "07:30 - 10:00 PM", title: "Banquet Dinner",  },
  ],
  day2: [
    { time: "07:00 - 08:00 AM", title: "Breakfast",  },
    { time: "08:30 - 01:30 PM", title: "Main Contest",  },
    { time: "02:30 - 03:30 PM", title: "Lunch",  },
    { time: "03:30 - 04:30 PM", title: "Cultural Programs",  },
    { time: "04:30 - 06:30 PM", title: "Closing Ceremony & Awards",  },
    { time: "06:30 - 07:00 PM", title: "Goodies Distribution",  },
    { time: "07:30 - 08:30 PM", title: "Dinner",  },
  ],
};

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState<"day1" | "day2">("day1");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Schedule</h1>
          <p className="text-muted-foreground mt-1">
            View the complete schedule for the event
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            List View
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Timeline View
          </Button>
        </div>

        {/* Day Filter */}
        <div className="flex gap-2">
          <Button
            variant={activeDay === "day1" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDay("day1")}
          >
            Day 1
          </Button>
          <Button
            variant={activeDay === "day2" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDay("day2")}
          >
            Day 2
          </Button>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-3">
                {scheduleData[activeDay].map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md"
                  >
                    {/* Time */}
                    <Badge variant="secondary" className="w-fit font-mono text-sm px-3 py-1">
                      {item.time}
                    </Badge>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {/* <p className="text-sm text-muted-foreground">{item.description}</p> */}
                    </div>

                    {/* Venue */}
                    {/* <Badge variant="outline" className="w-fit flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.venue}
                    </Badge> */}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <Card>
            <ScrollArea className="h-[600px]">
              <div className="p-8">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

                  {scheduleData[activeDay].map((item, index) => (
                    <div key={index} className="relative mb-8 pl-16">
                      {/* Timeline dot */}
                      <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-sm"></div>

                      {/* Content */}
                      <div className="space-y-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {item.time}
                        </Badge>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {/* <p className="text-sm text-muted-foreground">{item.description}</p> */}
                        {/* <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {item.venue}
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}