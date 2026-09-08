/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DB } from './src/db/db';
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
  CultivationSnapshot
} from './src/types';

// Initialize the Database
DB.init();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Simple Auth Middleware
interface AuthRequest extends Request {
  user?: User;
  admin?: any; // Admin or SuperAdmin
  role?: 'user' | 'admin' | 'superadmin';
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  // In our simplified bearer token system:
  // - If it starts with 'adm-super', it is the Super Admin
  // - If it starts with 'adm-', it is an Admin
  // - If it starts with 'usr-', it is a User
  if (token === 'adm-super') {
    req.admin = DB.getAdmins().find(a => a.id === 'adm-super');
    req.role = 'superadmin';
    return next();
  } else if (token.startsWith('adm-')) {
    const admin = DB.getAdmins().find(a => a.id === token);
    if (!admin) return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
    req.admin = admin;
    req.role = 'admin';
    return next();
  } else if (token.startsWith('usr-')) {
    const user = DB.getUserById(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized: Invalid user token' });
    req.user = user;
    req.role = 'user';
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
}

// -------------------------------------------------------------
// AUTHENTICATION APIS
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, age, gender, phone, bodyWeight, healthInfo, dietaryPreference } = req.body;

  if (!name || !email || !password || !age || !gender) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const existingUser = DB.getUserByEmail(email);
  const existingAdmin = DB.getAdminByEmail(email);
  if (existingUser || existingAdmin) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Balanced admin assignment: find the admin with the fewest users
  const admins = DB.getAdmins().filter(a => a.role === 'admin');
  let assignedAdminId = 'adm-1'; // Default backup
  if (admins.length > 0) {
    const adminUserCounts = admins.map(adm => {
      const count = DB.getUsers().filter(u => u.adminId === adm.id).length;
      return { id: adm.id, count };
    });
    adminUserCounts.sort((a, b) => a.count - b.count);
    assignedAdminId = adminUserCounts[0].id;
  }

  const userId = `usr-${Date.now()}`;
  const newUser: any = {
    id: userId,
    name,
    email,
    password, // Plain text for local demo development
    phone: phone || '',
    age: Number(age),
    gender,
    bodyWeight: bodyWeight ? Number(bodyWeight) : undefined,
    healthInfo: healthInfo || '',
    dietaryPreference: dietaryPreference || 'None',
    adminId: assignedAdminId,
    createdAt: new Date().toISOString()
  };

  DB.createUser(newUser);

  // Auto create a default device for this user
  const deviceId = `dev-bucket-${userId}`;
  const newDevice: Device = {
    deviceId,
    deviceName: `Smart Bucket (${name})`,
    deviceType: 'ESP32-CAM Bucket',
    esp32Identifier: `ESP32-${Math.random().toString(16).substr(2, 6).toUpperCase()}`,
    assignedUserId: userId,
    status: 'Online',
    lastSeen: new Date().toISOString(),
    firmwareVersion: 'v1.4.2-stable',
    authToken: `token_${userId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  DB.createDevice(newDevice);

  // Welcome notification
  DB.createNotification({
    id: `notif-${Date.now()}`,
    userId,
    role: 'user',
    title: 'Welcome to SmartMedGrow! 🌿',
    message: `Hi ${name}, you have been assigned to healthcare manager ${
      DB.getAdmins().find(a => a.id === assignedAdminId)?.name || 'Dr. Sarah'
    }. Next, complete your Microgreen Recommendation Profile!`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    message: 'User registered successfully',
    token: userId,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'user'
    }
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check admins first
  const admin = DB.getAdminByEmail(email);
  if (admin && admin.password === password) {
    return res.json({
      token: admin.id,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  }

  // Check users
  const user = DB.getUserByEmail(email);
  if (user && user.password === password) {
    return res.json({
      token: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  if (req.role === 'superadmin' || req.role === 'admin') {
    return res.json({
      user: {
        id: req.admin.id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.role
      }
    });
  } else if (req.role === 'user') {
    return res.json({
      user: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        role: 'user',
        adminId: req.user!.adminId
      }
    });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// USER PROFILE APIS
// -------------------------------------------------------------

// GET /api/users/me
app.get('/api/users/me', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Forbidden: Only users can access this endpoint' });
  }
  res.json(req.user);
});

// PUT /api/users/me
app.put('/api/users/me', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Forbidden: Only users can update their profile' });
  }
  const updated = DB.updateUser(req.user!.id, req.body);
  res.json(updated);
});

// PUT /api/devices/my-device
app.put('/api/devices/my-device', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Forbidden: Only users can update device settings' });
  }

  const devices = DB.getDevices().filter(d => d.assignedUserId === req.user!.id);
  if (devices.length === 0) {
    return res.status(404).json({ error: 'No device associated with this user.' });
  }
  const device = devices[0];

  const updated = DB.updateDevice(device.deviceId, req.body);
  res.json(updated);
});

// GET /api/users/:id
app.get('/api/users/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  // Rule verification:
  // - A user can access their own profile
  // - Super Admin can access any profile
  // - Admin can access ONLY users assigned to them!
  if (req.role === 'user' && req.user!.id !== id) {
    return res.status(403).json({ error: 'Forbidden: You can only access your own profile' });
  }

  const targetUser = DB.getUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.role === 'admin' && targetUser.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  res.json(targetUser);
});

// -------------------------------------------------------------
// RECOMMENDATION APIS (Rule-Based Engine)
// -------------------------------------------------------------

// POST /api/recommendations/generate
app.post('/api/recommendations/generate', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Only users can generate recommendations' });
  }

  const user = req.user!;
  const { age, gender, healthInfo, dietaryPreference } = user;

  // Let's implement our custom rule-based engine using the dataset
  const microgreens = DB.getMicrogreens();
  let recommendedId = 'mg-broccoli'; // Default starting crop
  let reason = '';
  let alternatives: string[] = [];

  const healthText = (healthInfo || '').toLowerCase() + ' ' + (dietaryPreference || '').toLowerCase();

  if (healthText.includes('anemia') || healthText.includes('iron') || healthText.includes('fatigue') || healthText.includes('blood') || healthText.includes('energy')) {
    recommendedId = 'mg-sunflower'; // Highest Iron: 1.8mg
    reason = 'Based on your health profile indicating iron-boosting needs or fatigue, Sunflower Microgreens are highly recommended. They contain the highest organic iron concentration (1.8mg/100g) in our dataset to help support red blood cell and energy pathways.';
    alternatives = ['mg-pea-shoots', 'mg-mung-bean'];
  } else if (healthText.includes('pregnant') || healthText.includes('pregnancy') || healthText.includes('prenatal') || healthText.includes('baby') || healthText.includes('folate')) {
    recommendedId = 'mg-broccoli'; // High organic folate & antioxidants
    reason = 'Based on pregnancy planning or prenatal care, Broccoli Microgreens are recommended. They are exceptionally dense in folate precursors, Vitamin C, and cell-protecting sulforaphane compound groups.';
    alternatives = ['mg-kale', 'mg-red-cabbage'];
  } else if (healthText.includes('pressure') || healthText.includes('hypertension') || healthText.includes('heart') || healthText.includes('cardio') || healthText.includes('nitrate')) {
    recommendedId = 'mg-mustard'; // High Nitrates
    reason = 'Based on your cardiovascular health goals, Mustard Microgreens are selected due to their High Organic Nitrate values. Nitrates serve as key precursors to nitric oxide, promoting healthy endothelial function and vascular relaxation.';
    alternatives = ['mg-red-cabbage', 'mg-radish'];
  } else if (healthText.includes('sugar') || healthText.includes('diabetes') || healthText.includes('diabetic') || healthText.includes('glucose') || healthText.includes('glycemic')) {
    recommendedId = 'mg-fenugreek'; // Bitter melon/maple maple-like traditional aid
    reason = 'Based on blood sugar tracking, Fenugreek Microgreens are recommended. Fenugreek has been traditionally studied and suggested as a beneficial dietary Planning aid to promote glycemic regulation and glucose tolerance.';
    alternatives = ['mg-mung-bean', 'mg-kale'];
  } else if (healthText.includes('active') || healthText.includes('athlete') || healthText.includes('protein') || healthText.includes('workout') || healthText.includes('recovery')) {
    recommendedId = 'mg-radish'; // Spicy, fast growing, great vitamin C
    reason = 'To support active athletic recovery, Radish Microgreens are selected. They offer high Vitamin C concentrations and quick enzyme activation to help combat physical oxidative stress and support tissue repair.';
    alternatives = ['mg-mung-bean', 'mg-pea-shoots'];
  } else {
    // General Starting Crops based on Age/Difficulty
    if (age <= 12) {
      recommendedId = 'mg-pea-shoots'; // Sweet, nutritious, crunchy
      reason = 'As a young grower, sweet and crunchy Pea Shoots are selected. They are highly palatable, packed with vitamins, and have a unique quirk that makes growing a fun, tactile, and highly rewarding educational experience.';
      alternatives = ['mg-mung-bean', 'mg-broccoli'];
    } else {
      recommendedId = 'mg-broccoli'; // Default optimal health profile starting point
      reason = 'Broccoli Microgreens are selected as your optimal starting point. They are highly resilient, Easy to grow (11 days), and offer exceptionally balanced micronutrients to supplement a healthy baseline diet.';
      alternatives = ['mg-kale', 'mg-radish'];
    }
  }

  // Ensure alternative IDs exist and are filtered properly
  alternatives = alternatives.filter(id => id !== recommendedId);

  // Generate serving size advice by group exactly as provided in page 8
  let servingSuggestions = '';
  if (age < 1) {
    servingSuggestions = '5 g maximum daily serving for 6–12 months age group.';
  } else if (age <= 3) {
    servingSuggestions = '8 g maximum daily serving for 1–3 years age group.';
  } else if (age <= 6) {
    servingSuggestions = '12 g maximum daily serving for 4–6 years age group.';
  } else if (age <= 12) {
    servingSuggestions = '20 g maximum daily serving for 7–12 years age group.';
  } else if (age <= 17) {
    servingSuggestions = '30 g maximum daily serving for 13–17 years age group.';
  } else {
    if (gender.toLowerCase() === 'female') {
      if (healthInfo && healthInfo.toLowerCase().includes('pregnant')) {
        servingSuggestions = '30 g maximum daily serving for Pregnant adults as a planning aid maximum.';
      } else {
        servingSuggestions = '50 g maximum daily serving for Adult Females.';
      }
    } else {
      servingSuggestions = '50 g maximum daily serving for Adult Males.';
    }
    if (age >= 65) {
      servingSuggestions = '50 g maximum daily serving for 65+ age group.';
    }
  }

  // Create Recommendation
  const recommendation: Recommendation = {
    id: `rec-${Date.now()}`,
    userId: user.id,
    recommendedMicrogreenId: recommendedId,
    reason,
    alternatives,
    servingSuggestions,
    createdAt: new Date().toISOString()
  };

  DB.createRecommendation(recommendation);

  // Notify user
  DB.createNotification({
    id: `notif-${Date.now()}`,
    userId: user.id,
    role: 'user',
    title: 'New Recommendation Generated! 🎯',
    message: `Based on your profile, we recommend cultivation of ${DB.getMicrogreenById(recommendedId)?.name || 'Broccoli'}. View details on your dashboard!`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(recommendation);
});

// GET /api/recommendations/:userId
app.get('/api/recommendations/:userId', authMiddleware, (req: AuthRequest, res) => {
  const { userId } = req.params;

  if (req.role === 'user' && req.user!.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own recommendations' });
  }

  const targetUser = DB.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.role === 'admin' && targetUser.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  const recs = DB.getRecommendationsByUserId(userId);
  if (recs.length === 0) {
    return res.json([]);
  }

  // Return the latest recommendation
  res.json(recs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// -------------------------------------------------------------
// MICROGREEN RECORDS APIS
// -------------------------------------------------------------

// GET /api/microgreens
app.get('/api/microgreens', (req, res) => {
  res.json(DB.getMicrogreens());
});

// GET /api/microgreens/:id
app.get('/api/microgreens/:id', (req, res) => {
  const mg = DB.getMicrogreenById(req.params.id);
  if (!mg) return res.status(404).json({ error: 'Microgreen not found' });
  res.json(mg);
});

// POST /api/microgreens (Super Admin only)
app.post('/api/microgreens', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Only Super Admin can manage microgreen records' });
  }
  const newMg = req.body;
  if (!newMg.id || !newMg.name) {
    return res.status(400).json({ error: 'ID and Name are required for microgreen records' });
  }
  const created = DB.createMicrogreen(newMg);
  res.status(201).json(created);
});

// PUT /api/microgreens/:id (Super Admin only)
app.put('/api/microgreens/:id', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Only Super Admin can manage microgreen records' });
  }
  const updated = DB.updateMicrogreen(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Microgreen not found' });
  res.json(updated);
});

// DELETE /api/microgreens/:id (Super Admin only)
app.delete('/api/microgreens/:id', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Only Super Admin can manage microgreen records' });
  }
  const deleted = DB.deleteMicrogreen(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Microgreen not found' });
  res.json({ success: true, message: 'Microgreen deleted successfully' });
});

// -------------------------------------------------------------
// CULTIVATION APIS
// -------------------------------------------------------------

// POST /api/cultivations
app.post('/api/cultivations', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Only users can start a cultivation' });
  }

  const { microgreenId } = req.body;
  if (!microgreenId) return res.status(400).json({ error: 'Microgreen ID is required' });

  const mg = DB.getMicrogreenById(microgreenId);
  if (!mg) return res.status(404).json({ error: 'Microgreen not found' });

  // Get user's device
  const devices = DB.getDevices().filter(d => d.assignedUserId === req.user!.id);
  if (devices.length === 0) {
    return res.status(400).json({ error: 'No smart bucket device configured for this user. Please contact administrator.' });
  }
  const device = devices[0];

  // Check if user already has an active cultivation
  const activeCul = DB.getCultivationByUserId(req.user!.id);
  if (activeCul) {
    return res.status(400).json({ error: 'You already have an active cultivation in progress. Complete or harvest it first.' });
  }

  const culId = `cul-${Date.now()}`;
  const startDate = new Date().toISOString();
  const days = mg.daysToHarvest;
  const expectedHarvestDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const cultivation: Cultivation = {
    id: culId,
    userId: req.user!.id,
    microgreenId,
    deviceId: device.deviceId,
    startDate,
    expectedHarvestDate,
    currentDay: 1,
    status: 'Growing',
    currentMoisture: 55, // initial moisture
    pumpStatus: 'OFF',
    createdAt: startDate,
    updatedAt: startDate
  };

  DB.createCultivation(cultivation);
  
  // Link device to cultivation
  DB.updateDevice(device.deviceId, { cultivationId: culId, status: 'Online', lastSeen: new Date().toISOString() });

  // Notify user
  DB.createNotification({
    id: `notif-${Date.now()}`,
    userId: req.user!.id,
    role: 'user',
    title: 'Cultivation Initialized! 🌱',
    message: `Your ${mg.name} microgreens have started growing in ${device.deviceName}. Expect harvest in ${days} days on ${new Date(expectedHarvestDate).toLocaleDateString()}!`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  // Notify assigned Admin
  DB.createNotification({
    id: `notif-admin-${Date.now()}`,
    userId: req.user!.adminId,
    role: 'admin',
    title: `Cultivation Started: ${req.user!.name}`,
    message: `${req.user!.name} started a new ${mg.name} cultivation cycle in device ${device.deviceName}.`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(cultivation);
});

// GET /api/cultivations/:id
app.get('/api/cultivations/:id', authMiddleware, (req: AuthRequest, res) => {
  const cultivation = DB.getCultivationById(req.params.id);
  if (!cultivation) return res.status(404).json({ error: 'Cultivation not found' });

  // Verification checks
  if (req.role === 'user' && cultivation.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied to cultivation records' });
  }

  const user = DB.getUserById(cultivation.userId);
  if (req.role === 'admin' && user && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - Cultivation belongs to user of another administrator' });
  }

  res.json(cultivation);
});

// PUT /api/cultivations/:id (Updates status like Completed or triggers watering simulation)
app.put('/api/cultivations/:id', authMiddleware, (req: AuthRequest, res) => {
  const cultivation = DB.getCultivationById(req.params.id);
  if (!cultivation) return res.status(404).json({ error: 'Cultivation not found' });

  // Verification checks
  if (req.role === 'user' && cultivation.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied to edit cultivation' });
  }

  const user = DB.getUserById(cultivation.userId);
  if (req.role === 'admin' && user && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  const updated = DB.updateCultivation(req.params.id, req.body);
  
  // If completed, decouple device
  if (req.body.status === 'Completed' || req.body.status === 'Harvested') {
    DB.updateDevice(cultivation.deviceId, { cultivationId: undefined });
    
    // Create completed notifications
    DB.createNotification({
      id: `notif-${Date.now()}`,
      userId: cultivation.userId,
      role: 'user',
      title: 'Cultivation Finished! 🎉',
      message: `Congratulations! Your microgreen cultivation cycle has been completed. Clean the Smart Bucket and start another cycle whenever you are ready.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json(updated);
});

// -------------------------------------------------------------
// SNAPSHOT / GALLERY APIS
// -------------------------------------------------------------

// GET /api/snapshots/cultivation/:cultivationId
app.get('/api/snapshots/cultivation/:cultivationId', authMiddleware, (req: AuthRequest, res) => {
  const { cultivationId } = req.params;
  const cultivation = DB.getCultivationById(cultivationId);
  if (!cultivation) return res.status(404).json({ error: 'Cultivation cycle not found' });

  // Verification checks
  if (req.role === 'user' && cultivation.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied to snapshot records' });
  }

  const user = DB.getUserById(cultivation.userId);
  if (req.role === 'admin' && user && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer' });
  }

  const snaps = DB.getSnapshotsByCultivationId(cultivationId);
  res.json(snaps);
});

// POST /api/snapshots
app.post('/api/snapshots', authMiddleware, (req: AuthRequest, res) => {
  const { cultivationId, imageUrl, notes, soilMoistureAtCapture, dayNumber } = req.body;
  if (!cultivationId || !imageUrl) {
    return res.status(400).json({ error: 'Cultivation ID and Image URL are required' });
  }

  const cultivation = DB.getCultivationById(cultivationId);
  if (!cultivation) return res.status(404).json({ error: 'Cultivation not found' });

  if (req.role === 'user' && cultivation.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied to post snapshot' });
  }

  const snap: CultivationSnapshot = {
    id: `snap-${Date.now()}`,
    cultivationId,
    imageUrl,
    timestamp: new Date().toISOString(),
    dayNumber: dayNumber || cultivation.currentDay || 1,
    notes: notes || '',
    soilMoistureAtCapture: soilMoistureAtCapture !== undefined ? soilMoistureAtCapture : cultivation.currentMoisture
  };

  const created = DB.createSnapshot(snap);
  res.status(201).json(created);
});

// -------------------------------------------------------------
// IoT APIS (ESP32-CAM and Simulator Communication)
// -------------------------------------------------------------

// Lightweight heartbeat for the digital (DRY/WET) sensor firmware. This does
// not manufacture a moisture percentage, because GPIO 13 is a binary sensor.
app.post('/api/iot/device-status', (req, res) => {
  const { deviceId, token, soilStatus, pumpStatus, ipAddress } = req.body;
  if (!deviceId || !token || !['DRY', 'WET'].includes(soilStatus) || !['ON', 'OFF'].includes(pumpStatus)) {
    return res.status(400).json({ error: 'Device ID, token, soil status, and pump status are required' });
  }
  const device = DB.getDeviceById(deviceId);
  if (!device || token !== device.authToken) return res.status(401).json({ error: 'Unauthorized device' });

  const updates: Partial<Device> = { lastSeen: new Date().toISOString(), status: 'Online', usePhysicalCam: true };
  if (ipAddress) {
    updates.esp32CamIpAddress = ipAddress;
    updates.esp32CamStreamUrl = `http://${ipAddress}/stream`;
  }
  DB.updateDevice(deviceId, updates);
  res.json({ success: true, receivedAt: updates.lastSeen, soilStatus, pumpStatus });
});

// POST /api/iot/sensor-reading
app.post('/api/iot/sensor-reading', (req, res) => {
  const { deviceId, moistureValue, token } = req.body;

  if (!deviceId || moistureValue === undefined) {
    return res.status(400).json({ error: 'Device ID and Moisture Value are required' });
  }

  const device = DB.getDeviceById(deviceId);
  if (!device) return res.status(404).json({ error: 'Device unauthorized or unregistered' });
  if (!token || token !== device.authToken) return res.status(401).json({ error: 'Unauthorized device' });
  
  // Update device heartbeat
  DB.updateDevice(deviceId, { 
    lastSeen: new Date().toISOString(),
    status: moistureValue === 0 ? 'Warning' : 'Online' // 0 might represent a sensor error
  });

  const culId = device.cultivationId;
  if (!culId) {
    return res.json({ message: 'Device is online, but no active cultivation assigned.', pumpStatus: 'OFF' });
  }

  const cultivation = DB.getCultivationById(culId);
  if (!cultivation) return res.json({ message: 'No active cultivation record found.', pumpStatus: 'OFF' });

  const mg = DB.getMicrogreenById(cultivation.microgreenId);
  if (!mg) return res.json({ error: 'Assigned microgreen details not found' });

  // Create sensor reading record
  let status: 'Low' | 'Optimal' | 'High' | 'Sensor Error' = 'Optimal';
  if (moistureValue <= 0) {
    status = 'Sensor Error';
  } else if (moistureValue < mg.minimumMoistureThreshold) {
    status = 'Low';
  } else if (moistureValue > mg.maximumMoisture) {
    status = 'High';
  }

  DB.createSensorReading({
    id: `read-${Date.now()}-${Math.floor(Math.random()*100)}`,
    deviceId,
    cultivationId: culId,
    moistureValue,
    moistureStatus: status,
    recordedAt: new Date().toISOString()
  });

  // Update current moisture in active cultivation record
  DB.updateCultivation(culId, { currentMoisture: moistureValue });

  let pumpDecision: 'ON' | 'OFF' = cultivation.pumpStatus;

  // Closed loop control logic
  if (status === 'Sensor Error') {
    // Safety protection: if sensor is broken, turn pump OFF immediately to avoid flooding!
    if (cultivation.pumpStatus === 'ON') {
      pumpDecision = 'OFF';
      
      // Stop watering log
      const openLogs = DB.getWateringLogs().filter(l => l.cultivationId === culId && l.status === 'Completed' && !l.pumpStoppedAt);
      const now = new Date().toISOString();
      if (openLogs.length > 0) {
        DB.createWateringLog({
          ...openLogs[0],
          moistureAfter: moistureValue,
          pumpStoppedAt: now,
          status: 'Failed'
        });
      }

      DB.updateCultivation(culId, { pumpStatus: 'OFF' });
    }

    // Trigger Admin notification
    DB.createNotification({
      id: `notif-err-${Date.now()}`,
      userId: DB.getUserById(cultivation.userId)!.adminId,
      role: 'admin',
      title: 'SENSOR FAILURE ALERT 🚨',
      message: `Device ${device.deviceName} belonging to ${DB.getUserById(cultivation.userId)!.name} reported 0% moisture. Water pump emergency stopped.`,
      type: 'error',
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (moistureValue < mg.minimumMoistureThreshold && cultivation.pumpStatus === 'OFF') {
    // Moisture fell below minimum, turn pump ON!
    pumpDecision = 'ON';
    DB.updateCultivation(culId, { pumpStatus: 'ON' });

    // Log the watering event
    DB.createWateringLog({
      id: `wl-${Date.now()}`,
      deviceId,
      cultivationId: culId,
      moistureBefore: moistureValue,
      moistureAfter: moistureValue + 15, // estimated after
      pumpStartedAt: new Date().toISOString(),
      pumpStoppedAt: new Date(Date.now() + mg.pumpDuration * 1000).toISOString(),
      durationSeconds: mg.pumpDuration,
      triggerReason: 'Automatic Moisture Threshold',
      status: 'Completed',
      createdAt: new Date().toISOString()
    });

    // Notify user
    DB.createNotification({
      id: `notif-watering-${Date.now()}`,
      userId: cultivation.userId,
      role: 'user',
      title: 'Watering Triggered 💧',
      message: `Your soil moisture fell to ${moistureValue}%. Auto-pump activated for ${mg.pumpDuration}s to restore moisture levels.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    // Simulated background timer turns pump OFF after duration in DB state
    setTimeout(() => {
      const liveCul = DB.getCultivationById(culId);
      if (liveCul && liveCul.pumpStatus === 'ON') {
        DB.updateCultivation(culId, { pumpStatus: 'OFF', currentMoisture: mg.targetMoisture });
      }
    }, mg.pumpDuration * 1000);

  } else if (moistureValue >= mg.targetMoisture && cultivation.pumpStatus === 'ON') {
    // Target moisture reached, turn pump OFF!
    pumpDecision = 'OFF';
    DB.updateCultivation(culId, { pumpStatus: 'OFF' });

    // Notify user of complete cycle
    DB.createNotification({
      id: `notif-water-ok-${Date.now()}`,
      userId: cultivation.userId,
      role: 'user',
      title: 'Watering Complete ✅',
      message: `Soil moisture successfully restored to optimal levels (${moistureValue}%).`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    pumpStatus: pumpDecision,
    moistureThresholds: {
      min: mg.minimumMoistureThreshold,
      target: mg.targetMoisture,
      max: mg.maximumMoisture,
      pumpDuration: mg.pumpDuration
    }
  });
});

// GET /api/iot/device/:id/latest
app.get('/api/iot/device/:id/latest', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const device = DB.getDeviceById(id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  // Security checks: Admin A can only see their users' devices
  if (req.role === 'admin') {
    if (device.assignedUserId) {
      const u = DB.getUserById(device.assignedUserId);
      if (u && u.adminId !== req.admin.id) {
        return res.status(403).json({ error: 'Forbidden: Admin access control layer - Device belongs to user of another administrator' });
      }
    }
  }

  res.json(device);
});

// GET /api/iot/device/:id/history
app.get('/api/iot/device/:id/history', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const device = DB.getDeviceById(id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  if (req.role === 'admin' && device.assignedUserId) {
    const u = DB.getUserById(device.assignedUserId);
    if (u && u.adminId !== req.admin.id) {
      return res.status(403).json({ error: 'Forbidden: Admin access control layer - Device history belongs to user of another administrator' });
    }
  }

  if (req.role === 'user' && device.assignedUserId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied' });
  }

  if (!device.cultivationId) {
    return res.json([]);
  }

  const readings = DB.getSensorReadingsByCultivationId(device.cultivationId);
  const logs = DB.getWateringLogsByCultivationId(device.cultivationId);
  
  res.json({ readings, logs });
});

// POST /api/iot/pump/control
app.post('/api/iot/pump/control', authMiddleware, (req: AuthRequest, res) => {
  const { deviceId, action, triggerReason } = req.body;

  if (!deviceId || !action) {
    return res.status(400).json({ error: 'Device ID and Action (ON/OFF) are required' });
  }

  const device = DB.getDeviceById(deviceId);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  // Security checks
  if (req.role === 'admin' && device.assignedUserId) {
    const u = DB.getUserById(device.assignedUserId);
    if (u && u.adminId !== req.admin.id) {
      return res.status(403).json({ error: 'Forbidden: Access control violation' });
    }
  }

  if (req.role === 'user' && device.assignedUserId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: Access denied' });
  }

  const culId = device.cultivationId;
  if (!culId) return res.status(400).json({ error: 'Device has no active cultivation' });

  const cultivation = DB.getCultivationById(culId);
  if (!cultivation) return res.status(404).json({ error: 'Active cultivation record not found' });

  const mg = DB.getMicrogreenById(cultivation.microgreenId);
  if (!mg) return res.status(404).json({ error: 'Microgreen details not found' });

  const reason = triggerReason || (req.role === 'admin' ? 'Manual Admin Action' : 'Manual User Action');

  if (action === 'ON') {
    DB.updateCultivation(culId, { pumpStatus: 'ON' });
    
    // Log watering starting
    DB.createWateringLog({
      id: `wl-man-${Date.now()}`,
      deviceId,
      cultivationId: culId,
      moistureBefore: cultivation.currentMoisture,
      moistureAfter: Math.min(100, cultivation.currentMoisture + 15),
      pumpStartedAt: new Date().toISOString(),
      pumpStoppedAt: new Date(Date.now() + 5000).toISOString(), // 5s simulation
      durationSeconds: 5,
      triggerReason: reason,
      status: 'Completed',
      createdAt: new Date().toISOString()
    });

    DB.createNotification({
      id: `notif-${Date.now()}`,
      userId: cultivation.userId,
      role: 'user',
      title: 'Manual Watering Activated 💧',
      message: `${req.role === 'admin' ? 'Your administrator' : 'You'} manually triggered the water pump for 5 seconds.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    // Auto close pump after 5s
    setTimeout(() => {
      const live = DB.getCultivationById(culId);
      if (live && live.pumpStatus === 'ON') {
        DB.updateCultivation(culId, { 
          pumpStatus: 'OFF', 
          currentMoisture: Math.min(100, cultivation.currentMoisture + 15) 
        });
      }
    }, 5000);

  } else {
    DB.updateCultivation(culId, { pumpStatus: 'OFF' });

    DB.createNotification({
      id: `notif-${Date.now()}`,
      userId: cultivation.userId,
      role: 'user',
      title: 'Watering Stopped ⏹️',
      message: `The water pump has been manually switched off.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, pumpStatus: action });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT & REPORTS APIS (Role-Based Access Controls)
// -------------------------------------------------------------

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied: Requires administrator credentials' });
  }

  const isSuper = req.role === 'superadmin';
  const adminId = req.admin.id;

  // Enforce access control mapping
  const users = isSuper ? DB.getUsers() : DB.getUsers().filter(u => u.adminId === adminId);
  const userIds = users.map(u => u.id);

  const cultivations = DB.getCultivations().filter(c => userIds.includes(c.userId));
  const activeCultivations = cultivations.filter(c => c.status === 'Growing' || c.status === 'Ready to Harvest');
  const readyToHarvest = cultivations.filter(c => c.status === 'Ready to Harvest').length;
  
  const devices = DB.getDevices().filter(d => d.assignedUserId && userIds.includes(d.assignedUserId));
  const onlineDevices = devices.filter(d => d.status === 'Online').length;

  // Warnings & alerts count
  const alerts = DB.getNotifications()
    .filter(n => n.role === 'admin' && n.type === 'warning' || n.type === 'error');

  res.json({
    metrics: {
      assignedUsers: users.length,
      activeCultivations: activeCultivations.length,
      onlineDevices,
      readyToHarvest,
      activeAlerts: alerts.filter(a => !a.read).length
    },
    users: users.map(u => {
      const activeCul = activeCultivations.find(c => c.userId === u.id);
      const dev = devices.find(d => d.assignedUserId === u.id);
      return {
        id: u.id,
        name: u.name,
        age: u.age,
        microgreen: activeCul ? DB.getMicrogreenById(activeCul.microgreenId)?.name : 'None',
        cultivationStatus: activeCul ? activeCul.status : 'None',
        soilMoisture: activeCul ? activeCul.currentMoisture : 0,
        pumpStatus: activeCul ? activeCul.pumpStatus : 'OFF',
        lastUpdated: activeCul ? activeCul.updatedAt : u.createdAt
      };
    })
  });
});

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const isSuper = req.role === 'superadmin';
  const list = isSuper ? DB.getUsers() : DB.getUsers().filter(u => u.adminId === req.admin.id);
  res.json(list);
});

// GET /api/admin/users/:id
app.get('/api/admin/users/:id', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const user = DB.getUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // STRICT Admin access mapping rule
  if (req.role === 'admin' && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  const activeCultivation = DB.getCultivations().find(c => c.userId === id && c.status !== 'Completed');
  const recommendation = DB.getRecommendationsByUserId(id)[0];
  const device = DB.getDevices().find(d => d.assignedUserId === id);

  let sensorHistory = { readings: [], logs: [] };
  if (activeCultivation) {
    sensorHistory.readings = DB.getSensorReadingsByCultivationId(activeCultivation.id) as any;
    sensorHistory.logs = DB.getWateringLogsByCultivationId(activeCultivation.id) as any;
  }

  res.json({
    user,
    recommendation,
    cultivation: activeCultivation || null,
    device: device || null,
    history: sensorHistory
  });
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const user = DB.getUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.role === 'admin' && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  const updated = DB.updateUser(id, req.body);
  res.json({ success: true, user: updated });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const user = DB.getUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.role === 'admin' && user.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Forbidden: Admin access control layer - User belongs to another administrator' });
  }

  const success = DB.deleteUser(id);
  res.json({ success, message: 'User deleted successfully' });
});

// GET /api/admin/devices
app.get('/api/admin/devices', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const isSuper = req.role === 'superadmin';
  const users = isSuper ? DB.getUsers() : DB.getUsers().filter(u => u.adminId === req.admin.id);
  const userIds = users.map(u => u.id);

  const list = DB.getDevices().filter(d => d.assignedUserId && userIds.includes(d.assignedUserId));
  res.json(list);
});

// GET /api/admin/alerts
app.get('/api/admin/alerts', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const list = DB.getNotifications().filter(n => n.role === 'admin' && (n.type === 'warning' || n.type === 'error'));
  res.json(list);
});

// POST /api/admin/notifications/read
app.post('/api/admin/notifications/read', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Notification ID required' });
  DB.markNotificationRead(id);
  res.json({ success: true });
});

// GET /api/admin/reports/generate (Cultivation progress & IoT stats)
app.get('/api/admin/reports/generate', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'admin' && req.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const isSuper = req.role === 'superadmin';
  const adminId = req.admin.id;

  const users = isSuper ? DB.getUsers() : DB.getUsers().filter(u => u.adminId === adminId);
  const userIds = users.map(u => u.id);

  const cultivations = DB.getCultivations().filter(c => userIds.includes(c.userId));
  const activeCount = cultivations.filter(c => c.status === 'Growing').length;
  const completedCount = cultivations.filter(c => c.status === 'Completed' || c.status === 'Harvested').length;
  const readyCount = cultivations.filter(c => c.status === 'Ready to Harvest').length;

  const devices = DB.getDevices().filter(d => d.assignedUserId && userIds.includes(d.assignedUserId));
  const logs = DB.getWateringLogs().filter(l => cultivations.map(c => c.id).includes(l.cultivationId));

  // Compute distribution of microgreens
  const distribution: { [key: string]: number } = {};
  cultivations.forEach(c => {
    const name = DB.getMicrogreenById(c.microgreenId)?.name || 'Unknown';
    distribution[name] = (distribution[name] || 0) + 1;
  });

  res.json({
    generatedAt: new Date().toISOString(),
    manager: isSuper ? 'Super Administrator' : req.admin.name,
    cultivationStats: {
      totalAssigned: cultivations.length,
      active: activeCount,
      completed: completedCount,
      readyToHarvest: readyCount
    },
    iotStats: {
      monitoredDevices: devices.length,
      online: devices.filter(d => d.status === 'Online').length,
      offline: devices.filter(d => d.status === 'Offline').length,
      warnings: devices.filter(d => d.status === 'Warning').length,
      totalWateringEvents: logs.length,
      totalPumpDurationSeconds: logs.reduce((sum, l) => sum + l.durationSeconds, 0)
    },
    microgreenDistribution: Object.entries(distribution).map(([name, count]) => ({ name, count }))
  });
});

// GET /api/admin/notifications
app.get('/api/notifications', authMiddleware, (req: AuthRequest, res) => {
  let userId = '';
  if (req.role === 'user') {
    userId = req.user!.id;
  } else if (req.role === 'admin' || req.role === 'superadmin') {
    userId = req.admin.id;
  }
  const list = DB.getNotificationsByUserId(userId, req.role || 'user');
  res.json(list);
});

// POST /api/admin/reset (To reset database back to seed data easily)
app.post('/api/admin/reset-database', authMiddleware, (req: AuthRequest, res) => {
  if (req.role !== 'superadmin' && req.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  DB.resetDb();
  res.json({ success: true, message: 'Database reset to initial clean demo data successfully' });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMedGrow full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
