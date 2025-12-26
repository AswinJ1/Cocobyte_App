"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ScheduleItem = {
  time: string;
  title: string;
  description: string;
  venue: string;
};

const scheduleData: Record<string, ScheduleItem[]> = {
  day1: [
    { time: "09:00 AM", title: "Registration", description: "Check-in and welcome kit collection", venue: "Main Hall" },
    { time: "10:00 AM", title: "Opening Ceremony", description: "Welcome speech and event overview", venue: "Auditorium" },
    { time: "11:30 AM", title: "Workshop 1", description: "Introduction to Web Development", venue: "Room A" },
    { time: "01:00 PM", title: "Lunch Break", description: "Networking lunch", venue: "Cafeteria" },
    { time: "02:00 PM", title: "Hackathon Begins", description: "Team formation and project kickoff", venue: "Lab 1" },
    { time: "06:00 PM", title: "Day 1 Wrap-up", description: "Progress review and announcements", venue: "Main Hall" },
  ],
  day2: [
    { time: "09:00 AM", title: "Day 2 Kickoff", description: "Morning briefing and updates", venue: "Main Hall" },
    { time: "10:00 AM", title: "Workshop 2", description: "Advanced React Techniques", venue: "Room B" },
    { time: "12:00 PM", title: "Lunch Break", description: "Networking lunch", venue: "Cafeteria" },
    { time: "01:00 PM", title: "Project Submissions", description: "Final project submission deadline", venue: "Online" },
    { time: "03:00 PM", title: "Presentations", description: "Team project presentations", venue: "Auditorium" },
    { time: "05:00 PM", title: "Closing Ceremony", description: "Awards and certificates distribution", venue: "Auditorium" },
  ],
};

export default function SchedulePage() {
  const [activeDay, setActiveDay] = useState<"day1" | "day2">("day1");

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

        {/* Schedule List */}
        <Card>
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-3">
              {/* {scheduleData[activeDay].map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md"
                > */}
                  {/* Time */}
                  {/* <Badge variant="secondary" className="w-fit font-mono text-sm px-3 py-1">
                    {item.time}
                  </Badge> */}

                  {/* Content */}
                  {/* <div className="flex-1 space-y-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div> */}

                  {/* Venue */}
                  {/* <Badge variant="outline" className="w-fit">
                    {item.venue}
                  </Badge>
                </div>
              ))} */}
              <p className="text-center text-muted-foreground">Schedule details will be available soon.</p>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}