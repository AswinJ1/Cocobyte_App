'use client';

import React from "react";
import Image from "next/image";
import DashboardHeader from "@/components/dashboard-header";
import BoardingPassValidator from "@/components/forms/webcheckin-form";

const BoardingTaskPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Left side - Form Content */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <BoardingPassValidator />
        </div>
        
        {/* Right side - Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/30 p-8">
          <div className="relative w-full max-w-md aspect-square">
            <Image
              src="/flight.jpg"
              alt="Boarding Pass Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardingTaskPage;
