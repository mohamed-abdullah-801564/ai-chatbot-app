export { };

declare global {
    interface SpeechRecognitionResult {
        isFinal: boolean;
        [key: number]: {
            transcript: string;
        };
    }

    interface SpeechRecognitionResultList {
        [key: number]: SpeechRecognitionResult;
        length: number;
    }

    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
        resultIndex: number;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
    }

    interface CustomSpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start(): void;
        stop(): void;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: (event: SpeechRecognitionErrorEvent) => void;
        onend: () => void;
    }

    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
