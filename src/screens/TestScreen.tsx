import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { AIService } from '../services/ai/AIService';

export default function TestScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    testAIService();
  }, []);

  const testAIService = async () => {
    try {
      addLog('Initializing AI Service...');
      const aiService = AIService.getInstance();
      await aiService.initialize();

      addLog(`Service initialized: ${aiService.isInitialized()}`);
      addLog(`Model type: ${aiService.getModelType()}`);

      const info = aiService.getModelInfo();
      setModelInfo(info);
      addLog(`Model info: ${JSON.stringify(info)}`);

      setIsReady(true);
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  const testTextEncoding = async () => {
    try {
      addLog('Testing text encoding...');
      const aiService = AIService.getInstance();
      const embedding = await aiService.encodeText('海边日落');
      addLog(`Text embedding: ${embedding.length} dimensions`);
      addLog(`First 5 values: ${embedding.slice(0, 5).map(v => v.toFixed(4))}`);
    } catch (error) {
      addLog(`Text encoding error: ${error}`);
    }
  };

  const testSimilarity = () => {
    try {
      const aiService = AIService.getInstance();
      const vec1 = [1, 0, 0, 0];
      const vec2 = [0.9, 0.1, 0, 0];
      const similarity = aiService.cosineSimilarity(vec1, vec2);
      addLog(`Similarity test: ${similarity.toFixed(4)}`);
    } catch (error) {
      addLog(`Similarity error: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Service Test</Text>

      <View style={styles.status}>
        <Text>Model Type: {modelInfo?.type || 'N/A'}</Text>
        <Text>Initialized: {isReady ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Reinitialize" onPress={testAIService} />
        <Button title="Test Text Encoding" onPress={testTextEncoding} />
        <Button title="Test Similarity" onPress={testSimilarity} />
      </View>

      <View style={styles.logs}>
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, i) => (
          <Text key={i} style={styles.log}>
            {log}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  status: { marginBottom: 20, backgroundColor: '#f0f0f0', padding: 10 },
  buttons: { gap: 10, marginBottom: 20 },
  logs: { backgroundColor: '#000', padding: 10 },
  logTitle: { color: '#fff', fontWeight: 'bold' },
  log: { color: '#0f0', fontSize: 12, marginTop: 2 },
});
