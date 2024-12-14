'use client';

import { useState, useEffect ,useRef } from 'react';

export default function SpeechRecognitionComponent() {

  interface Result {
    response1?: string;
    response2?: string;
  }
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const count = useRef(1) ; 
  const [result, setResult] = useState<Result | null>(null);

 

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));
    console.log(new URL('./worker.ts', import.meta.url));

    if (
      !(
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window
      )
    ) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      setTranscript(transcript);

      // Send the transcript to the worker
      worker.postMessage({ submittedValue: transcript, count: count.current });
    };

    worker.onmessage = (event) => {
      const { result: workerResult, incrementCount } = event.data;
      console.log("on message",workerResult)
      if (incrementCount) {
        count.current=count.current+1
      }

      if (workerResult) {
        setResult(workerResult);

        // Convert the result text to speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(workerResult);

          // Optional: Set properties like language, pitch, and rate
          utterance.lang = 'en-US';
          utterance.pitch = 1;
          utterance.rate = 1;

          recognition.stop()
          // When speech starts
          utterance.onstart = () => {
            console.log('Speech synthesis started');
          };

          // When speech ends
          utterance.onend = () => {
            console.log('Speech synthesis ended');
            if (isListening) {
              recognition.start();
            }
          };
          // Cancel any ongoing speech and speak the new result
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
        } else {
          console.error('Text-to-speech is not supported in this browser.');
        }
      }



      // Clear the transcript after processing
      setTranscript('');
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setTranscript(''); // Clear transcript on end
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
      worker.terminate(); // Terminate the worker when component unmounts
    };
  }, [isListening]);

  const handleToggleListening = () => {
    setIsListening((prev) => !prev);
    setTranscript(''); // Clear transcript on toggle
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Speech Recognition Demo</h1>
      <button onClick={handleToggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <p>
        <strong>Transcript:</strong> {transcript || 'Say something...'}
      </p>
      <p>
        <strong>Result:</strong> {result?.response1 ? JSON.stringify(result.response1, null, "AI Response") : 'No response yet.'}
      </p>
      <p>
        <strong>summary</strong> {result?.response2 ? JSON.stringify(result.response2, null, "Summary") : 'No response yet.'}
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}