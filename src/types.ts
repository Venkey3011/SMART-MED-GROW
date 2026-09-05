/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age: number;
  gender: string;
  bodyWeight?: number;
  healthInfo?: string;
  dietaryPreference?: string;
  adminId: string; // Every user belongs to a specific administrator
  createdAt: string;
}

export interface Microgreen {
  id: string;
  name: string;
  difficulty: 'Easiest' | 'Easy' | 'One quirk';
  daysToHarvest: number;
  seedQuantityPerTray: string;
  soakRequired: boolean;
  soakDuration: string;
  freshYield: string;
  growingNotes: string;
  preparationNotes: string;
  
  // Nutrient fields
  nitrateValue: string; // e.g., "Low" | "Medium" | "High"
  nitrateDataQuality: string;
  vitaminCLevel: string;
  ironMgPer100g: number;
  zincMgPer100g: number;

  // Moisture thresholds
  minimumMoistureThreshold: number; // e.g., 30%
  targetMoisture: number; // e.g., 55%
  maximumMoisture: number; // e.g., 80%
  pumpDuration: number; // pump ON duration in seconds
  active: boolean;
}

export interface Recommendation {
  id: string;
  userId: string;
  recommendedMicrogreenId: string;
  reason: string;
  alternatives: string[]; // List of alternative microgreen IDs
  servingSuggestions: string; // Grams by age/group
  createdAt: string;
}

export interface Cultivation {
  id: string;
  userId: string;
  microgreenId: string;
  deviceId: string;
  startDate: string;
  expectedHarvestDate: string;
  currentDay: number;
  status: 'Not Started' | 'Growing' | 'Ready to Harvest' | 'Harvested' | 'Completed';
  currentMoisture: number;
  pumpStatus: 'ON' | 'OFF';
  lastWatered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  esp32Identifier: string; // MAC or unique code
  assignedUserId?: string;
  cultivationId?: string;
  status: 'Online' | 'Offline' | 'Warning';
  lastSeen: string;
  firmwareVersion: string;
  authToken: string; // for security
  esp32CamStreamUrl?: string; // ESP32-CAM live stream feed URL
  esp32CamIpAddress?: string; // ESP32-CAM Local IP
  usePhysicalCam?: boolean;  // Toggles physical vs simulation mode
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  cultivationId: string;
  moistureValue: number;
  moistureStatus: 'Low' | 'Optimal' | 'High' | 'Sensor Error';
  recordedAt: string;
}

export interface WateringLog {
  id: string;
  deviceId: string;
  cultivationId: string;
  moistureBefore: number;
  moistureAfter: number;
  pumpStartedAt: string;
  pumpStoppedAt: string;
  durationSeconds: number;
  triggerReason: 'Automatic Moisture Threshold' | 'Manual Admin Action' | 'Manual User Action' | 'Scheduled/Configured Event' | 'Emergency Stop';
  status: 'Completed' | 'Failed' | 'Interrupted';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  recheckDelayMinutes: number;
  maxContinuousPumpSeconds: number;
  safetyCooldownMinutes: number;
  isDemoMode: boolean;
}

// Age and serving size dictionary
export interface AgeServingLimit {
  group: string;
  limitGrams: number;
}

export interface CultivationSnapshot {
  id: string;
  cultivationId: string;
  imageUrl: string;
  timestamp: string;
  dayNumber: number;
  notes?: string;
  soilMoistureAtCapture?: number;
}

