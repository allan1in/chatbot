/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */

// This is the Web Worker that will handle the heavy Prism tokenization
// to keep the main thread free for smooth scrolling and interactions.

import Prism from 'prismjs';

// Pre-load some common languages to speed up the first tokenization
// In a production app, you might want to load these dynamically.
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-markdown';

// Listen for messages from the main thread
self.onmessage = (e: MessageEvent) => {
  const { code, language, id } = e.data;

  try {
    // Perform the heavy lifting: Tokenization
    // This is the part that usually blocks the main thread.
    const tokens = Prism.tokenize(code, Prism.languages[language] || Prism.languages.markup);

    // Send the result back to the main thread
    self.postMessage({
      id,
      tokens,
      success: true,
    });
  } catch (error: any) {
    self.postMessage({
      id,
      error: error.message,
      success: false,
    });
  }
};
