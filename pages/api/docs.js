/**
 * OpenAPI Documentation UI
 */

import { openAPISpec } from '../../../lib/openapi';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { format } = req.query;
    
    if (format === 'json') {
      return res.status(200).json(openAPISpec);
    }
    
    // Return Swagger UI HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kulture API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openAPISpec)},
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
      });
    };
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
