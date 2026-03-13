import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
app.get('/api/v1/workshops/:id/eligibility', (req, res) => {
  res.json({ eligible: true });
});

app.post('/api/v1/workshops/:id/vimeo-token', (req, res) => {
  res.json({ 
    token: 'vimeo_mock_token_' + Math.random().toString(36).substr(2, 9),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    streamUrl: 'https://vimeo.com/event/mock'
  });
});

app.post('/api/v1/payments/create-order', (req, res) => {
  res.json({
    id: 'order_' + Math.random().toString(36).substr(2, 9),
    amount: req.body.amount,
    currency: 'INR'
  });
});

app.post('/api/v1/payments/verify', (req, res) => {
  // Mock fee distribution logic
  const { amount, mobilizerId, mode } = req.body;
  console.log(`Processing payment for ${mode} mode with amount ${amount}`);
  
  if (mode === 'online') {
    if (mobilizerId) {
      console.log('Split: 66% Creator, 33% Mobilizer, 1% Ceekul');
    } else {
      console.log('Split: 99% Creator, 1% Ceekul');
    }
  } else if (mode === 'hybrid') {
    if (mobilizerId) {
      console.log('Split: 50% Creator, 40% Infrastructure, 10% Mobilizer');
    } else {
      console.log('Split: 50% Creator, 50% Infrastructure');
    }
  }

  res.json({ status: 'success', transactionId: 'pay_' + Math.random().toString(36).substr(2, 9) });
});

app.post('/api/v1/workshops/:id/refund', (req, res) => {
  res.json({ status: 'refunded', amount: req.body.amount });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
