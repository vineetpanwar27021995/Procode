import { baseURL } from "../utils/getBaseURL";

// export async function getPersonaResponse(messages, problemMetadata) {
//     console.log("getPersonaResponse messages:", messages);
  
//     const chatCompletionMessages = messages.filter((message) => message.role === 'user').map(message => message.content).join(' ');

//     console.log("getPersonaResponse chatCompletionMessages:", chatCompletionMessages);


//     try {
//       const res = await fetch(`${baseURL}/api/analyze`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           question: problemMetadata, 
//           response: chatCompletionMessages,
//         }),
//       });
  
//       if (!res.ok) {
//         console.error('Error sending to /api/analyzeIntuition:', await res.text());
//       } else {
//         const result = await res.json();
//         console.log("getPersonaResponse result:", result);
        
//         return result.feedback;
//       }
//     } catch (err) {
//       console.error('❌ Failed to call analyzeIntuition:', err);
//       return null;
//     }
  
//   }

export async function getPersonaResponse(messages, problemMetadata, signal) {
  const chatCompletionMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ');

  try {
    const res = await fetch(`${baseURL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: problemMetadata,
        response: chatCompletionMessages,
      }),
      signal, // 🚨 attach abort signal here
    });

    if (!res.ok) {
      console.error('Error in /api/analyzeIntuition:', await res.text());
      return null;
    }

    const result = await res.json();
    return result.feedback;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('Request aborted');
    } else {
      console.error('❌ Failed to call analyzeIntuition:', err);
    }
    return null;
  }
}