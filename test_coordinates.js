import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const extractCoordinatesFromUrl = async (url) => {
  if (!url || typeof url !== "string") return null;

  let targetUrl = url;

  if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        headers: { 'User-Agent': 'RescueBite/1.0' }
      });
      const redirectUrl = response.headers.get("location");
      if (redirectUrl) {
        targetUrl = redirectUrl;
      }
    } catch (err) {
      console.error("Failed to resolve short map link:", url, err);
    }
  }

  let match = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = targetUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = targetUrl.match(/\/place\/(-?\d+\.\d+)(?:,|\+)(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = targetUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = targetUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
};

const getCoordinates = async (address, locationName = "", mapLink = "") => {
  if (mapLink) {
    const extractedCoords = await extractCoordinatesFromUrl(mapLink);
    if (extractedCoords) {
      return extractedCoords;
    }
  }

  const query = `${address} ${locationName}`.trim();
  if (!query) return { latitude: 19.1197, longitude: 72.8468 }; // Default Mumbai

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'User-Agent': 'RescueBite/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error("Geocoding failed for:", query);
  }

  // Fallback
  const hash = query
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pertLat = (hash % 100) / 1000 - 0.05;
  const pertLon = ((hash * 17) % 100) / 1000 - 0.05;
  return {
    latitude: 19.1197 + pertLat,
    longitude: 72.8468 + pertLon,
  };
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    const users = await User.find({});
    for (const u of users) {
      if (u.role === 'admin') continue;
      const coords = await getCoordinates(u.address, u.location, u.mapLink);
      console.log(`User: ${u.name} (${u.role})`);
      console.log(` - Address: ${u.address}, Location: ${u.location}`);
      console.log(` - MapLink: ${u.mapLink}`);
      console.log(` - Coords:`, coords);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

test();
