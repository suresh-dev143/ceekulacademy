export const environment = {
    production: false,
    // apiUrl: 'https://ceekulmissionapi.onrender.com',
    apiUrl: 'http://localhost:1003',
    wsUrl:  'ws://localhost:1003',       // WebSocket base — replace with wss:// in production
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    crasmibUrl: 'http://192.168.29.15:3000',
    appUrl: 'http://localhost:4200',
    // ⚗️ Phase 1 — Experimental Simulation Mode
    // No real payment gateway active. All neuron flows are internal utility simulations.
    // Set to false ONLY after regulatory approval + escrow integration are complete.
    simulationMode: true,
};
