// src/components/NeighborhoodInfo.tsx
import React from "react";

interface NeighborhoodInfoProps {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  safetyScore: number;
}

export default function NeighborhoodInfo({ walkScore, transitScore, bikeScore, safetyScore }: NeighborhoodInfoProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h4 className="font-semibold mb-2">Neighborhood info:</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">Walk Score: {walkScore}/100</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">Transit Score: {transitScore}/100</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
          <span className="text-sm">Bike Score: {bikeScore}/100</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-sm">Safety Score: {safetyScore}/100</span>
        </div>
      </div>
    </div>
  )
}




