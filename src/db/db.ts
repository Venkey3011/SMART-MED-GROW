/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  User, 
  Admin, 
  Microgreen, 
  Recommendation, 
  Cultivation, 
  Device, 
  SensorReading, 
  WateringLog, 
  Notification, 
  SystemSettings,
  CultivationSnapshot
} from '../types';

interface DBState {
  admins: any[];
  users: any[];
  microgreens: Microgreen[];
  recommendations: Recommendation[];
  cultivations: Cultivation[];
  devices: Device[];
  sensorReadings: SensorReading[];
  wateringLogs: WateringLog[];
  notifications: Notification[];
  systemSettings: SystemSettings;
  snapshots?: CultivationSnapshot[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

// Initial seed microgreens
const INITIAL_MICROGREENS: Microgreen[] = [
  {
    id: 'mg-radish',
    name: 'Radish',
    difficulty: 'Easiest',
    daysToHarvest: 10,
    seedQuantityPerTray: '10g per 25 × 25 cm tray',
    soakRequired: false,
    soakDuration: 'No',
    freshYield: 'approximately 141g',
    growingNotes: 'Sow dry and evenly; blackout for 3 days under a weighted tray, then light.',
    preparationNotes: 'Rinse well, consume fresh in salads or sandwiches. Rich and slightly spicy.',
    nitrateValue: 'Medium',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'High',
    ironMgPer100g: 0.9,
    zincMgPer100g: 0.3,
    minimumMoistureThreshold: 35,
    targetMoisture: 60,
    maximumMoisture: 80,
    pumpDuration: 10,
    active: true
  },
  {
    id: 'mg-fenugreek',
    name: 'Fenugreek',
    difficulty: 'Easiest',
    daysToHarvest: 9,
    seedQuantityPerTray: 'approximately 28g',
    soakRequired: true,
    soakDuration: '4–6 hours',
    freshYield: 'approximately 69g',
    growingNotes: 'Short soak; drain fully. Keep moisture consistent.',
    preparationNotes: 'Slightly bitter maple-like flavor. Traditional dietary planning aid for blood sugar support.',
    nitrateValue: 'Low',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'Medium',
    ironMgPer100g: 1.2,
    zincMgPer100g: 0.4,
    minimumMoistureThreshold: 30,
    targetMoisture: 55,
    maximumMoisture: 75,
    pumpDuration: 12,
    active: true
  },
  {
    id: 'mg-mung-bean',
    name: 'Mung Bean',
    difficulty: 'Easiest',
    daysToHarvest: 8,
    seedQuantityPerTray: 'approximately 69g',
    soakRequired: true,
    soakDuration: '8 hours',
    freshYield: 'approximately 94g',
    growingNotes: 'Rinse well after soaking. Grow in complete darkness for crunchy, yellow-headed sprouts.',
    preparationNotes: 'Rinse well, steam or stir-fry lightly, or consume raw. High fiber and protein.',
    nitrateValue: 'Low',
    nitrateDataQuality: 'Medium',
    vitaminCLevel: 'Medium',
    ironMgPer100g: 1.4,
    zincMgPer100g: 0.5,
    minimumMoistureThreshold: 40,
    targetMoisture: 65,
    maximumMoisture: 85,
    pumpDuration: 8,
    active: true
  },
  {
    id: 'mg-broccoli',
    name: 'Broccoli',
    difficulty: 'Easy',
    daysToHarvest: 11,
    seedQuantityPerTray: '6.3g',
    soakRequired: false,
    soakDuration: 'No',
    freshYield: 'approximately 91g',
    growingNotes: 'Sow dry; medium should be damp rather than soaked at sowing.',
    preparationNotes: 'Mild cabbage-like flavor. Extremely high in sulforaphane, excellent antioxidant source.',
    nitrateValue: 'Medium',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'High',
    ironMgPer100g: 0.8,
    zincMgPer100g: 0.3,
    minimumMoistureThreshold: 35,
    targetMoisture: 60,
    maximumMoisture: 80,
    pumpDuration: 10,
    active: true
  },
  {
    id: 'mg-kale',
    name: 'Kale',
    difficulty: 'Easy',
    daysToHarvest: 11,
    seedQuantityPerTray: '7.2g',
    soakRequired: false,
    soakDuration: 'No',
    freshYield: 'approximately 90g',
    growingNotes: 'Similar handling to broccoli and tolerates slightly drier conditions.',
    preparationNotes: 'Sweet, mild flavor. Exceptional vitamins A, C, and K values.',
    nitrateValue: 'Medium',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'High',
    ironMgPer100g: 1.0,
    zincMgPer100g: 0.3,
    minimumMoistureThreshold: 30,
    targetMoisture: 55,
    maximumMoisture: 75,
    pumpDuration: 10,
    active: true
  },
  {
    id: 'mg-mustard',
    name: 'Mustard',
    difficulty: 'Easy',
    daysToHarvest: 12,
    seedQuantityPerTray: '6.0g',
    soakRequired: false,
    soakDuration: 'No',
    freshYield: 'approximately 68g',
    growingNotes: 'Peppery taste. Harvest when first true leaves just start appearing.',
    preparationNotes: 'Strong, spicy mustard kick. Perfect to zest up wraps or salads.',
    nitrateValue: 'High',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'High',
    ironMgPer100g: 1.1,
    zincMgPer100g: 0.4,
    minimumMoistureThreshold: 35,
    targetMoisture: 60,
    maximumMoisture: 80,
    pumpDuration: 10,
    active: true
  },
  {
    id: 'mg-red-cabbage',
    name: 'Red Cabbage',
    difficulty: 'Easy',
    daysToHarvest: 13,
    seedQuantityPerTray: '5.0g',
    soakRequired: false,
    soakDuration: 'No',
    freshYield: 'approximately 78g',
    growingNotes: 'Longest of the easy set; purple stems indicate readiness.',
    preparationNotes: 'Sweet cabbage flavor, beautiful violet color. Rich in anthocyanins and Vitamin C.',
    nitrateValue: 'Medium',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'High',
    ironMgPer100g: 0.7,
    zincMgPer100g: 0.2,
    minimumMoistureThreshold: 35,
    targetMoisture: 60,
    maximumMoisture: 80,
    pumpDuration: 12,
    active: true
  },
  {
    id: 'mg-sunflower',
    name: 'Sunflower',
    difficulty: 'One quirk',
    daysToHarvest: 10,
    seedQuantityPerTray: '36g',
    soakRequired: true,
    soakDuration: '8 hours',
    freshYield: 'approximately 104g',
    growingNotes: 'Weight tray during blackout; remove remaining hulls manually at harvest.',
    preparationNotes: 'Crunchy, nutty flavor. High in proteins and essential fatty acids.',
    nitrateValue: 'Low',
    nitrateDataQuality: 'High',
    vitaminCLevel: 'Medium',
    ironMgPer100g: 1.8,
    zincMgPer100g: 0.6,
    minimumMoistureThreshold: 30,
    targetMoisture: 55,
    maximumMoisture: 75,
    pumpDuration: 15,
    active: true
  },
  {
    id: 'mg-pea-shoots',
    name: 'Pea Shoots',
    difficulty: 'One quirk',
    daysToHarvest: 10,
    seedQuantityPerTray: 'approximately 187g',
    soakRequired: true,
    soakDuration: '8–12 hours',
    freshYield: 'approximately 113g',
    growingNotes: 'Do not over-soak in hot weather; rinse before sowing.',
    preparationNotes: 'Crisp, sweet pea flavor. Rich in vitamins and fiber, excellent for kids.',
    nitrateValue: 'Medium',
    nitrateDataQuality: 'Medium',
    vitaminCLevel: 'Medium',
    ironMgPer100g: 1.6,
    zincMgPer100g: 0.5,
    minimumMoistureThreshold: 40,
    targetMoisture: 65,
    maximumMoisture: 85,
    pumpDuration: 15,
    active: true
  }
];

export class DB {
  private static state: DBState = {
    admins: [],
    users: [],
    microgreens: INITIAL_MICROGREENS,
    recommendations: [],
    cultivations: [],
    devices: [],
    sensorReadings: [],
    wateringLogs: [],
    notifications: [],
    systemSettings: {
      id: 'settings-global',
      recheckDelayMinutes: 5,
      maxContinuousPumpSeconds: 30,
      safetyCooldownMinutes: 15,
      isDemoMode: true
    },
    snapshots: []
  };

  static init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        DB.state = JSON.parse(fileContent);
        // Ensure microgreens match current dataset specification
        if (!DB.state.microgreens || DB.state.microgreens.length === 0) {
          DB.state.microgreens = INITIAL_MICROGREENS;
        }
        // Ensure snapshots exist
        if (!DB.state.snapshots) {
          DB.state.snapshots = [];
        }
        return;
      } catch (err) {
        console.error('Failed to read db file, recreating seed data...', err);
      }
    }

    // Generate seed data
    DB.generateSeedData();
    DB.save();
  }

  private static save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(DB.state, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to db file', err);
    }
  }

  private static generateSeedData() {
    // 1 Super Admin
    DB.state.admins = [
      {
        id: 'adm-super',
        name: 'System Root',
        email: 'superadmin@smartmedgrow.com',
        password: 'password', // in real apps we'd hash, but we support plaintext/simple comparison for demo
        role: 'superadmin'
      },
      {
        id: 'adm-1',
        name: 'Dr. Sarah Jenkins',
        email: 'admin1@smartmedgrow.com',
        password: 'password',
        role: 'admin'
      },
      {
        id: 'adm-2',
        name: 'Coach Michael Roberts',
        email: 'admin2@smartmedgrow.com',
        password: 'password',
        role: 'admin'
      }
    ];

    // 6 Users
    // Users for Admin 1 (Sarah Jenkins)
    DB.state.users = [
      {
        id: 'usr-1',
        name: 'John Doe',
        email: 'john@gmail.com',
        phone: '+1 555-0199',
        age: 34,
        gender: 'Male',
        bodyWeight: 78,
        healthInfo: 'Anemic tendencies, seeks natural dietary iron boosters.',
        dietaryPreference: 'None',
        adminId: 'adm-1',
        password: 'password',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'usr-2',
        name: 'Alice Smith',
        email: 'alice@gmail.com',
        phone: '+1 555-0144',
        age: 28,
        gender: 'Female',
        bodyWeight: 62,
        healthInfo: 'Planning pregnancy, wants high natural folate & Vitamin C.',
        dietaryPreference: 'Vegetarian',
        adminId: 'adm-1',
        password: 'password',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'usr-3',
        name: 'Robert Chen',
        email: 'robert@gmail.com',
        phone: '+1 555-0122',
        age: 68,
        gender: 'Male',
        bodyWeight: 70,
        healthInfo: 'Age-related fatigue, aims for high zinc and cell protection.',
        dietaryPreference: 'None',
        adminId: 'adm-1',
        password: 'password',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Users for Admin 2 (Michael Roberts)
      {
        id: 'usr-4',
        name: 'Emily Davis',
        email: 'emily@gmail.com',
        phone: '+1 555-0177',
        age: 22,
        gender: 'Female',
        bodyWeight: 55,
        healthInfo: 'Active marathon athlete, requires quick recovery antioxidants.',
        dietaryPreference: 'Vegan',
        adminId: 'adm-2',
        password: 'password',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'usr-5',
        name: 'David Miller',
        email: 'david@gmail.com',
        phone: '+1 555-0165',
        age: 45,
        gender: 'Male',
        bodyWeight: 85,
        healthInfo: 'Mild hypertension, looking for natural nitrate-based cardiovascular support.',
        dietaryPreference: 'None',
        adminId: 'adm-2',
        password: 'password',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'usr-6',
        name: 'Sophia Wilson',
        email: 'sophia@gmail.com',
        phone: '+1 555-0153',
        age: 12, // Child / Young Teen
        gender: 'Female',
        bodyWeight: 42,
        healthInfo: 'Growing child, school nutrition tracking.',
        dietaryPreference: 'None',
        adminId: 'adm-2',
        password: 'password',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Seed recommendations
    DB.state.recommendations = [
      {
        id: 'rec-1',
        userId: 'usr-1',
        recommendedMicrogreenId: 'mg-sunflower', // High Iron: 1.8mg
        reason: 'Recommended for iron-boosting support to aid with anemic tendencies, backed by highest iron content (1.8mg/100g) in the dataset.',
        alternatives: ['mg-pea-shoots', 'mg-mung-bean'],
        servingSuggestions: '50 g for Adult Male as daily planning aid maximum.',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-2',
        userId: 'usr-2',
        recommendedMicrogreenId: 'mg-broccoli', // High Vitamin C and Sulforaphane
        reason: 'Recommended for maternal planning, offering high organic vitamin C & folate values to support prenatal cellular development.',
        alternatives: ['mg-kale', 'mg-red-cabbage'],
        servingSuggestions: '50 g for Adult Female daily.',
        createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-3',
        userId: 'usr-3',
        recommendedMicrogreenId: 'mg-pea-shoots', // Rich in Zinc and Fiber
        reason: 'Provides a highly digestible source of proteins, zinc (0.5mg/100g) and fiber appropriate for mature digestive tracts and vigor.',
        alternatives: ['mg-mung-bean', 'mg-mustard'],
        servingSuggestions: '50 g for 65+ Adult daily.',
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-4',
        userId: 'usr-4',
        recommendedMicrogreenId: 'mg-radish', // Spicy, high Vitamin C
        reason: 'Fast-growing high Vitamin C antioxidant profile to accelerate muscle tissue recovery post-strenuous athletic activity.',
        alternatives: ['mg-mustard', 'mg-kale'],
        servingSuggestions: '50 g for Adult Female daily.',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-5',
        userId: 'usr-5',
        recommendedMicrogreenId: 'mg-mustard', // High Nitrates
        reason: 'Selected for rich organic nitrate values to support endothelial nitric oxide pathway and promote cardiorespiratory wellness.',
        alternatives: ['mg-red-cabbage', 'mg-radish'],
        servingSuggestions: '50 g for Adult Male daily.',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-6',
        userId: 'usr-6',
        recommendedMicrogreenId: 'mg-pea-shoots', // Sweet and easy for children
        reason: 'Sweet, highly palatable pea shoots rich in vitamin C and fiber, perfect for adolescent physical development.',
        alternatives: ['mg-radish', 'mg-broccoli'],
        servingSuggestions: '20 g for 7-12 years daily.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Seed devices
    DB.state.devices = [
      {
        deviceId: 'dev-bucket-1',
        deviceName: 'Smart Grow Bucket Alpha',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-E4:A5:C3:01:92:B1',
        assignedUserId: 'usr-1',
        cultivationId: 'cul-1',
        status: 'Online',
        lastSeen: new Date().toISOString(),
        firmwareVersion: 'v1.4.2-stable',
        authToken: 'secret_token_alpha_1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        deviceId: 'dev-bucket-2',
        deviceName: 'Smart Grow Bucket Beta',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-F2:D1:B4:85:AA:32',
        assignedUserId: 'usr-2',
        cultivationId: 'cul-2',
        status: 'Online',
        lastSeen: new Date().toISOString(),
        firmwareVersion: 'v1.4.2-stable',
        authToken: 'secret_token_beta_2',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        deviceId: 'dev-bucket-3',
        deviceName: 'Smart Grow Bucket Gamma',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-C1:0E:9F:34:61:55',
        assignedUserId: 'usr-3',
        cultivationId: 'cul-3',
        status: 'Online',
        lastSeen: new Date().toISOString(),
        firmwareVersion: 'v1.4.2-stable',
        authToken: 'secret_token_gamma_3',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        deviceId: 'dev-bucket-4',
        deviceName: 'Smart Grow Bucket Delta',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-A1:B2:C3:D4:E5:F6',
        assignedUserId: 'usr-4',
        cultivationId: 'cul-4',
        status: 'Online',
        lastSeen: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        firmwareVersion: 'v1.4.2-stable',
        authToken: 'secret_token_delta_4',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        deviceId: 'dev-bucket-5',
        deviceName: 'Smart Grow Bucket Epsilon',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-90:81:72:63:54:45',
        assignedUserId: 'usr-5',
        cultivationId: 'cul-5',
        status: 'Warning',
        lastSeen: new Date().toISOString(),
        firmwareVersion: 'v1.4.2-stable',
        authToken: 'secret_token_epsilon_5',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        deviceId: 'dev-bucket-6',
        deviceName: 'Smart Grow Bucket Zeta',
        deviceType: 'ESP32-CAM Bucket',
        esp32Identifier: 'ESP32-0F:1E:2D:3C:4B:5A',
        assignedUserId: 'usr-6',
        cultivationId: 'cul-6',
        status: 'Offline',
        lastSeen: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        firmwareVersion: 'v1.4.0-stable',
        authToken: 'secret_token_zeta_6',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Seed active cultivations
    DB.state.cultivations = [
      {
        id: 'cul-1',
        userId: 'usr-1',
        microgreenId: 'mg-sunflower',
        deviceId: 'dev-bucket-1',
        startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // Day 6
        expectedHarvestDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 10 days total
        currentDay: 6,
        status: 'Growing',
        currentMoisture: 48,
        pumpStatus: 'OFF',
        lastWatered: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cul-2',
        userId: 'usr-2',
        microgreenId: 'mg-broccoli',
        deviceId: 'dev-bucket-2',
        startDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // Day 11
        expectedHarvestDate: new Date(Date.now()).toISOString(), // Ready today!
        currentDay: 11,
        status: 'Ready to Harvest',
        currentMoisture: 62,
        pumpStatus: 'OFF',
        lastWatered: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cul-3',
        userId: 'usr-3',
        microgreenId: 'mg-pea-shoots',
        deviceId: 'dev-bucket-3',
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // Harvested
        expectedHarvestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        currentDay: 10,
        status: 'Completed',
        currentMoisture: 0,
        pumpStatus: 'OFF',
        lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cul-4',
        userId: 'usr-4',
        microgreenId: 'mg-radish',
        deviceId: 'dev-bucket-4',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Day 2
        expectedHarvestDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        currentDay: 2,
        status: 'Growing',
        currentMoisture: 58,
        pumpStatus: 'OFF',
        lastWatered: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cul-5',
        userId: 'usr-5',
        microgreenId: 'mg-mustard',
        deviceId: 'dev-bucket-5',
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Day 1
        expectedHarvestDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        currentDay: 1,
        status: 'Growing',
        currentMoisture: 24, // Triggering LOW MOISTURE alert
        pumpStatus: 'OFF',
        lastWatered: undefined,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cul-6',
        userId: 'usr-6',
        microgreenId: 'mg-pea-shoots',
        deviceId: 'dev-bucket-6',
        startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Day 4
        expectedHarvestDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        currentDay: 4,
        status: 'Growing',
        currentMoisture: 0, // Offline device
        pumpStatus: 'OFF',
        lastWatered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Seed sensor readings (history) for each cultivation (last 12 hours)
    const baseTime = Date.now();
    for (let i = 1; i <= 6; i++) {
      const culId = `cul-${i}`;
      const devId = `dev-bucket-${i}`;
      if (i === 3) continue; // completed cultivation has no recent readings
      
      const readings: SensorReading[] = [];
      const baseMoisture = i === 5 ? 26 : (i === 6 ? 0 : 50 + (i * 2)); // 5 is low, 6 is offline/0

      for (let hour = 12; hour >= 0; hour--) {
        const timeStamp = new Date(baseTime - hour * 3600 * 1000).toISOString();
        let value = baseMoisture + Math.floor(Math.sin(hour) * 4) + Math.floor(Math.random() * 3);
        if (i === 6) value = 0; // offline
        if (value < 0) value = 0;
        if (value > 100) value = 100;

        let status: 'Low' | 'Optimal' | 'High' | 'Sensor Error' = 'Optimal';
        if (value === 0 && i === 6) {
          status = 'Sensor Error';
        } else if (value < 30) {
          status = 'Low';
        } else if (value > 75) {
          status = 'High';
        }

        readings.push({
          id: `read-${culId}-${12 - hour}`,
          deviceId: devId,
          cultivationId: culId,
          moistureValue: value,
          moistureStatus: status,
          recordedAt: timeStamp
        });
      }
      DB.state.sensorReadings.push(...readings);
    }

    // Seed watering logs
    DB.state.wateringLogs = [
      {
        id: 'wl-1',
        deviceId: 'dev-bucket-1',
        cultivationId: 'cul-1',
        moistureBefore: 28,
        moistureAfter: 46,
        pumpStartedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        pumpStoppedAt: new Date(Date.now() - 4 * 3600 * 1000 + 15000).toISOString(), // 15s
        durationSeconds: 15,
        triggerReason: 'Automatic Moisture Threshold',
        status: 'Completed',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'wl-2',
        deviceId: 'dev-bucket-1',
        cultivationId: 'cul-1',
        moistureBefore: 29,
        moistureAfter: 48,
        pumpStartedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        pumpStoppedAt: new Date(Date.now() - 28 * 3600 * 1000 + 15000).toISOString(),
        durationSeconds: 15,
        triggerReason: 'Automatic Moisture Threshold',
        status: 'Completed',
        createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
      },
      {
        id: 'wl-3',
        deviceId: 'dev-bucket-2',
        cultivationId: 'cul-2',
        moistureBefore: 27,
        moistureAfter: 55,
        pumpStartedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        pumpStoppedAt: new Date(Date.now() - 8 * 3600 * 1000 + 12000).toISOString(), // 12s
        durationSeconds: 12,
        triggerReason: 'Automatic Moisture Threshold',
        status: 'Completed',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
      },
      {
        id: 'wl-4',
        deviceId: 'dev-bucket-4',
        cultivationId: 'cul-4',
        moistureBefore: 33,
        moistureAfter: 58,
        pumpStartedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        pumpStoppedAt: new Date(Date.now() - 12 * 3600 * 1000 + 10000).toISOString(),
        durationSeconds: 10,
        triggerReason: 'Manual User Action',
        status: 'Completed',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ];

    // Seed snapshots for growth gallery view
    DB.state.snapshots = [
      // Cultivation 1 (Sunflower - Day 6)
      {
        id: 'snap-1-1',
        cultivationId: 'cul-1',
        imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 1,
        notes: 'Germination stage. Tiny sunflower taproots visible, starting to push off hulls.',
        soilMoistureAtCapture: 65
      },
      {
        id: 'snap-1-2',
        cultivationId: 'cul-1',
        imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 3,
        notes: 'Blackout dome removed. Bright green cotyledons emerging, strong stem thickness.',
        soilMoistureAtCapture: 58
      },
      {
        id: 'snap-1-3',
        cultivationId: 'cul-1',
        imageUrl: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 5,
        notes: 'Vigorous vegetative growth. Dense canopy of sunflower leaves. Soil moisture optimal.',
        soilMoistureAtCapture: 55
      },

      // Cultivation 2 (Broccoli - Day 11, Ready to Harvest)
      {
        id: 'snap-2-1',
        cultivationId: 'cul-2',
        imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 1,
        notes: 'Broccoli seeds germinating evenly under weighted tray blackout.',
        soilMoistureAtCapture: 62
      },
      {
        id: 'snap-2-2',
        cultivationId: 'cul-2',
        imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 4,
        notes: 'First exposure to light. Quick chlorophyll development, tiny green leaves spread.',
        soilMoistureAtCapture: 59
      },
      {
        id: 'snap-2-3',
        cultivationId: 'cul-2',
        imageUrl: 'https://images.unsplash.com/photo-1508500383102-13099939947e?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 8,
        notes: 'High density broccoli forest. Secondary true leaves are starting to form.',
        soilMoistureAtCapture: 56
      },
      {
        id: 'snap-2-4',
        cultivationId: 'cul-2',
        imageUrl: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 10,
        notes: 'Peak maturity broccoli microgreens, extremely high sulforaphane antioxidant levels, ready for harvest!',
        soilMoistureAtCapture: 60
      },

      // Cultivation 4 (Radish - Day 2)
      {
        id: 'snap-4-1',
        cultivationId: 'cul-4',
        imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dayNumber: 1,
        notes: 'Dry sown radish seeds showing 95% germination rate, root hairs spreading.',
        soilMoistureAtCapture: 60
      }
    ];

    // Seed notifications
    DB.state.notifications = [
      {
        id: 'notif-1',
        userId: 'usr-1',
        role: 'user',
        title: 'Microgreen Recommendation Generated',
        message: 'Your personal SmartMedGrow recommendation is ready. You have been recommended Sunflower Microgreens.',
        type: 'success',
        read: true,
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'usr-1',
        role: 'user',
        title: 'Cultivation Started',
        message: 'Your Sunflower Microgreen cultivation has been initialized in Smart Grow Bucket Alpha.',
        type: 'info',
        read: false,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-3',
        userId: 'usr-2',
        role: 'user',
        title: 'Ready to Harvest!',
        message: 'Your Broccoli Microgreens have reached full maturity on Day 11. It is time to harvest!',
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif-4',
        userId: 'adm-1',
        role: 'admin',
        title: 'Sensor Alert: Sophia\'s Bucket Offline',
        message: 'Smart Grow Bucket Zeta belonging to Sophia Wilson has not sent signals for over 5 hours.',
        type: 'warning',
        read: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'notif-5',
        userId: 'adm-2',
        role: 'admin',
        title: 'Low Soil Moisture Alert',
        message: 'David Miller\'s Smart Grow Bucket Epsilon is reporting low soil moisture (24%). Auto-pump will trigger shortly.',
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // Admin Operations
  static getAdmins(): Admin[] {
    return DB.state.admins;
  }

  static getAdminByEmail(email: string) {
    return DB.state.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  static createAdmin(admin: any) {
    DB.state.admins.push(admin);
    DB.save();
    return admin;
  }

  // User Operations
  static getUsers(): User[] {
    return DB.state.users;
  }

  static getUserById(id: string): User | undefined {
    return DB.state.users.find(u => u.id === id);
  }

  static getUserByEmail(email: string) {
    return DB.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static createUser(user: any) {
    DB.state.users.push(user);
    DB.save();
    return user;
  }

  static updateUser(id: string, updates: Partial<User>) {
    const idx = DB.state.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      DB.state.users[idx] = { ...DB.state.users[idx], ...updates };
      DB.save();
      return DB.state.users[idx];
    }
    return null;
  }

  static deleteUser(id: string) {
    const initialLen = DB.state.users.length;
    DB.state.users = DB.state.users.filter(u => u.id !== id);
    
    // Cleanup other models linked to this user
    DB.state.devices = DB.state.devices.map(d => {
      if (d.assignedUserId === id) {
        const { assignedUserId, cultivationId, ...rest } = d;
        return { ...rest, status: 'Offline' as const };
      }
      return d;
    });

    DB.state.recommendations = DB.state.recommendations.filter(r => r.userId !== id);
    DB.state.cultivations = DB.state.cultivations.filter(c => c.userId !== id);
    DB.state.notifications = DB.state.notifications.filter(n => n.userId !== id);

    DB.save();
    return DB.state.users.length !== initialLen;
  }

  // Microgreens
  static getMicrogreens(): Microgreen[] {
    return DB.state.microgreens;
  }

  static getMicrogreenById(id: string): Microgreen | undefined {
    return DB.state.microgreens.find(m => m.id === id);
  }

  static createMicrogreen(mg: Microgreen) {
    DB.state.microgreens.push(mg);
    DB.save();
    return mg;
  }

  static updateMicrogreen(id: string, updates: Partial<Microgreen>) {
    const idx = DB.state.microgreens.findIndex(m => m.id === id);
    if (idx !== -1) {
      DB.state.microgreens[idx] = { ...DB.state.microgreens[idx], ...updates };
      DB.save();
      return DB.state.microgreens[idx];
    }
    return null;
  }

  static deleteMicrogreen(id: string) {
    const initialLen = DB.state.microgreens.length;
    DB.state.microgreens = DB.state.microgreens.filter(m => m.id !== id);
    DB.save();
    return DB.state.microgreens.length !== initialLen;
  }

  // Recommendations
  static getRecommendations(): Recommendation[] {
    return DB.state.recommendations;
  }

  static getRecommendationsByUserId(userId: string): Recommendation[] {
    return DB.state.recommendations.filter(r => r.userId === userId);
  }

  static createRecommendation(rec: Recommendation) {
    DB.state.recommendations.push(rec);
    DB.save();
    return rec;
  }

  // Cultivations
  static getCultivations(): Cultivation[] {
    return DB.state.cultivations;
  }

  static getCultivationById(id: string): Cultivation | undefined {
    return DB.state.cultivations.find(c => c.id === id);
  }

  static getCultivationByUserId(userId: string): Cultivation | undefined {
    return DB.state.cultivations.find(c => c.userId === userId && c.status !== 'Completed' && c.status !== 'Harvested');
  }

  static getAllCultivationsByUserId(userId: string): Cultivation[] {
    return DB.state.cultivations.filter(c => c.userId === userId);
  }

  static createCultivation(cul: Cultivation) {
    DB.state.cultivations.push(cul);
    DB.save();
    return cul;
  }

  static updateCultivation(id: string, updates: Partial<Cultivation>) {
    const idx = DB.state.cultivations.findIndex(c => c.id === id);
    if (idx !== -1) {
      DB.state.cultivations[idx] = { ...DB.state.cultivations[idx], ...updates, updatedAt: new Date().toISOString() };
      DB.save();
      return DB.state.cultivations[idx];
    }
    return null;
  }

  // Devices
  static getDevices(): Device[] {
    return DB.state.devices;
  }

  static getDeviceById(id: string): Device | undefined {
    return DB.state.devices.find(d => d.deviceId === id);
  }

  static getDeviceByToken(token: string): Device | undefined {
    return DB.state.devices.find(d => d.authToken === token);
  }

  static createDevice(device: Device) {
    DB.state.devices.push(device);
    DB.save();
    return device;
  }

  static updateDevice(id: string, updates: Partial<Device>) {
    const idx = DB.state.devices.findIndex(d => d.deviceId === id);
    if (idx !== -1) {
      DB.state.devices[idx] = { ...DB.state.devices[idx], ...updates, updatedAt: new Date().toISOString() };
      DB.save();
      return DB.state.devices[idx];
    }
    return null;
  }

  // Sensor Readings
  static getSensorReadings(): SensorReading[] {
    return DB.state.sensorReadings;
  }

  static getSensorReadingsByCultivationId(culId: string): SensorReading[] {
    return DB.state.sensorReadings
      .filter(r => r.cultivationId === culId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }

  static createSensorReading(reading: SensorReading) {
    DB.state.sensorReadings.push(reading);
    
    // Auto trim logs to keep JSON performant, e.g. limit to last 200 per cultivation
    const readingsForCul = DB.state.sensorReadings.filter(r => r.cultivationId === reading.cultivationId);
    if (readingsForCul.length > 200) {
      const excessCount = readingsForCul.length - 200;
      // Find oldest records for this cultivation and remove them
      const sorted = [...readingsForCul].sort((a,b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      const toRemoveIds = sorted.slice(0, excessCount).map(r => r.id);
      DB.state.sensorReadings = DB.state.sensorReadings.filter(r => !toRemoveIds.includes(r.id));
    }

    DB.save();
    return reading;
  }

  // Watering Logs
  static getWateringLogs(): WateringLog[] {
    return DB.state.wateringLogs;
  }

  static getWateringLogsByCultivationId(culId: string): WateringLog[] {
    return DB.state.wateringLogs
      .filter(l => l.cultivationId === culId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
  }

  static createWateringLog(log: WateringLog) {
    DB.state.wateringLogs.push(log);
    DB.save();
    return log;
  }

  // Notifications
  static getNotifications(): Notification[] {
    return DB.state.notifications;
  }

  static getNotificationsByUserId(userId: string, role: string): Notification[] {
    if (role === 'superadmin') {
      return DB.state.notifications;
    }
    if (role === 'admin') {
      // Admins get their admin-specific alerts and global ones
      return DB.state.notifications.filter(n => n.userId === userId || n.role === 'admin');
    }
    return DB.state.notifications.filter(n => n.userId === userId);
  }

  static createNotification(notif: Notification) {
    DB.state.notifications.unshift(notif); // Add to top
    if (DB.state.notifications.length > 100) {
      DB.state.notifications = DB.state.notifications.slice(0, 100);
    }
    DB.save();
    return notif;
  }

  static markNotificationRead(id: string) {
    const idx = DB.state.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      DB.state.notifications[idx].read = true;
      DB.save();
    }
  }

  // Settings
  static getSystemSettings(): SystemSettings {
    return DB.state.systemSettings;
  }

  static updateSystemSettings(updates: Partial<SystemSettings>) {
    DB.state.systemSettings = { ...DB.state.systemSettings, ...updates };
    DB.save();
    return DB.state.systemSettings;
  }

  // Snapshots
  static getSnapshots(): CultivationSnapshot[] {
    return DB.state.snapshots || [];
  }

  static getSnapshotsByCultivationId(culId: string): CultivationSnapshot[] {
    return (DB.state.snapshots || []).filter(s => s.cultivationId === culId);
  }

  static createSnapshot(snapshot: CultivationSnapshot) {
    if (!DB.state.snapshots) DB.state.snapshots = [];
    DB.state.snapshots.push(snapshot);
    DB.save();
    return snapshot;
  }

  // Reset entire Database to initial state (for demo refreshing)
  static resetDb() {
    DB.state = {
      admins: [],
      users: [],
      microgreens: INITIAL_MICROGREENS,
      recommendations: [],
      cultivations: [],
      devices: [],
      sensorReadings: [],
      wateringLogs: [],
      notifications: [],
      systemSettings: {
        id: 'settings-global',
        recheckDelayMinutes: 5,
        maxContinuousPumpSeconds: 30,
        safetyCooldownMinutes: 15,
        isDemoMode: true
      },
      snapshots: []
    };
    DB.generateSeedData();
    DB.save();
  }
}
