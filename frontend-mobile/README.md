# TrackMate Mobile App

## Overview
TrackMate Mobile is a React Native application built with Expo that provides mobile access to the TrackMate platform. This app allows users to manage companies, users, and track activities on the go.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

### Installation

1. Clone the repository (if you haven't already)
2. Navigate to the frontend-mobile directory:
   ```
   cd TrackMate/frontend-mobile
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Running the Proxy Server

The mobile app communicates with the backend through a proxy server to avoid CORS issues and handle network connectivity between your device and the backend API.

1. Start the proxy server:
   ```
   node proxy-server.js
   ```
   This will start a server on port 8081 that forwards API requests to your backend.

2. Note the IP address displayed in the console. You'll need this when connecting from your mobile device.

### Running the App

1. In a new terminal window, start the Expo development server:
   ```
   npx expo start
   ```

2. Scan the QR code with your mobile device using the Expo Go app.

### Connecting to the Backend

The app is configured to automatically detect the correct IP address to use based on your environment:

- When running in an emulator, it uses the appropriate localhost address
- When running in Expo Go on a physical device, it attempts to use the Expo host IP address

If you encounter connection issues, you may need to manually update the IP address in `src/config/api.ts`. Look for the `getLocalIpAddress` function and update the fallback IP address to match your computer's IP address on your local network.

## Troubleshooting API Connection Issues

If you're experiencing issues connecting to the API when testing with Expo Go:

1. **Check network connectivity**: Make sure your mobile device and computer are on the same network.

2. **Verify the proxy server is running**: Ensure the proxy server is running and accessible from your device.

3. **Test the proxy server**: Open `http://<your-computer-ip>:8081/health` in a browser on your mobile device to verify the proxy server is accessible.

4. **Check backend API**: Make sure your backend API is running on port 5105 (or update the proxy-server.js file if using a different port).

5. **Check logs**: Look at the console logs in the Expo app and the proxy server terminal for error messages.

6. **Firewall settings**: Ensure your firewall allows connections on port 8081.

## App Structure

- `src/config/` - Configuration files including API endpoints
- `src/services/` - Service classes for API communication
- `src/screens/` - Screen components
- `src/components/` - Reusable UI components
- `src/navigation/` - Navigation configuration
- `src/types/` - TypeScript type definitions

## Development Notes

- The app uses React Native Paper for UI components
- Authentication is handled using JWT tokens stored in SecureStore
- API requests are made using Axios with interceptors for authentication and error handling
