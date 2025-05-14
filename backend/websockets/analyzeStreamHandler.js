const analyzeService = require('../services/analyze.service'); // Adjust path

const handleWebSocketConnection = (ws) => {
  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received WebSocket message:', parsedMessage.type);

      if (parsedMessage.type === 'ANALYZE_INTUITION_STREAM') {
        const { messageHistory, problemMetadata } = parsedMessage.payload;
        console.log('hrllo','sending')
        if (!messageHistory || !problemMetadata) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: 'Missing messageHistory or problemMetadata for analysis.' }));
          return;
        }

        await analyzeService.analyzeIntuitionStream(messageHistory, problemMetadata, ws);

      } else {
        ws.send(JSON.stringify({ type: 'ERROR', payload: 'Unknown message type.' }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'ERROR', payload: error.message || 'Failed to process your request.' }));
    }
  });
};

module.exports = { handleWebSocketConnection };