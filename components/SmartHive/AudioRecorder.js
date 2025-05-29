import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Custom hook for audio recording logic
export const useSmartAudioRecorder = () => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [uri, setUri] = useState(null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      setUri(audioRecorder.uri);
      return audioRecorder.uri;
    } catch (err) {
      console.error("Failed to stop recording", err);
      return null;
    }
  };

  // Simulate speech-to-text processing
  const processRecording = async (uri) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Can you help me understand the concept of photosynthesis?");
      }, 1500);
    });
  };

  return {
    isRecording,
    uri,
    startRecording,
    stopRecording,
    processRecording,
  };
};