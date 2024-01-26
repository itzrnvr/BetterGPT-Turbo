import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const model = config.model === 'gpt-3.5-turbo' ? 'gpt-35-turbo' : config.model === 'gpt-3.5-turbo-16k' ? 'gpt-35-turbo-16k' : config.model;

    const apiVersion = '2023-03-15-preview';

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...config,
      max_tokens: undefined,
    }),
  });
  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data;
};

export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const model = config.model === 'gpt-3.5-turbo' ? 'gpt-35-turbo' : config.model === 'gpt-3.5-turbo-16k' ? 'gpt-35-turbo-16k' : config.model;

    const apiVersion = '2023-03-15-preview';

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...config,
      max_tokens: undefined,
      stream: true,
    }),
  });
  if (response.status === 404 || response.status === 405) {
    const text = await response.text();
    if (text.includes('model_not_found')) {
      throw new Error(
        text +
          '\nMessage from Better ChatGPT:\nPlease ensure that you have access to the GPT-4 API!'
      );
    } else {
      throw new Error(
        'Message from Better ChatGPT:\nInvalid API endpoint! We recommend you to check your free API endpoint.'
      );
    }
  }

  if (response.status === 429 || !response.ok) {
    const text = await response.text();
    let error = text;
    if (text.includes('insufficient_quota')) {
      error +=
        '\nMessage from Better ChatGPT:\nWe recommend changing your API endpoint or API key';
    } else if (response.status === 429) {
      error += '\nRate limited!';
    }
    throw new Error(error);
  }

  const stream = response.body;
  return stream;
};

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};



export const getTextToSpeech = async (
  text: string,
  apiKey: string,
  signal: AbortSignal
) => {
  const endpoint = 'https://api.openai.com/v1/audio/speech';
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice: "alloy",
      response_format: 'mp3',
      stream: true,
    }),
    signal,
  };
  
  const response = await fetch(endpoint, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}, ${await response.text()}`);
  }
  
  return response
};


// export const getTextToSpeech = async (
//   text: string,
//   apiKey: string,
//   signal: AbortSignal
// ): Promise<Blob> => {
//   const endpoint = 'https://api.openai.com/v1/audio/speech';

//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${apiKey}`
//   };

//   const fetchOptions: RequestInit = {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       model: 'tts-1-hd',
//       input: text,
//       voice: "alloy",
//       stream: true
//     }),
//     signal
//   };

//   // Call the Fetch API with the provided options
//   const response = await fetch(endpoint, fetchOptions);

//   // Throw an error if the response is not ok
//   if (!response.ok) {
//     throw new Error(`Error: ${response.status}, ${await response.text()}`);
//   }

//   // Handle the Response as a readable stream
//   const reader = response.body?.getReader();
//   if (!reader) {
//     throw new Error('Streamed response is not available.');
//   }

//   // Building the chunks into an audio blob as before
//   const chunks: Uint8Array[] = [];
//   let totalLength = 0;
//   while (true) {
//     const { value, done } = await reader.read();
//     if (done) break;
//     chunks.push(value);
//     totalLength += value.length;
//     console.log(value)
//   }

//   // Combine the chunks into a single Uint8Array
//   const allChunks = new Uint8Array(totalLength);
//   let position = 0;
//   for (const chunk of chunks) {
//     allChunks.set(chunk, position);
//     position += chunk.length;
//   }

//   // Create a Blob from the combined Uint8Array and return
//   const audioBlob = new Blob([allChunks.buffer], { type: 'audio/mpeg' });
//   return audioBlob;
// };

