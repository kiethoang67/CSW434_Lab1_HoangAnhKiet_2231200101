import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addMessageListener,
  connectWebSocket,
  disconnectWebSocket,
  sendChatMessage,
  type ChatEvent,
} from '../services/websocket';

export default function ChatScreen() {
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatEvent[]>([]);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem('chat_username').then((savedName) => {
      if (mounted && savedName) {
        setUsername(savedName);
      }
    });

    const unsubscribe = addMessageListener((event) => {
      if (!mounted) {
        return;
      }

      setMessages((previous) => [...previous, event]);

      if (event.type === 'connection_closed') {
        setConnected(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      disconnectWebSocket();
    };
  }, []);

  async function startChat() {
    const name = username.trim();

    if (!name) {
      setError('Please enter your name.');
      return;
    }

    setError('');
    setConnecting(true);

    try {
      await AsyncStorage.setItem('chat_username', name);
      await connectWebSocket(name);

      setCurrentUser(name);
      setConnected(true);
    } catch {
      setError(
        'Cannot connect to the server. Check the server and WebSocket URL.',
      );
    } finally {
      setConnecting(false);
    }
  }

  function sendMessage() {
    const text = message.trim();

    if (!text) {
      return;
    }

    const sent = sendChatMessage(text);

    if (sent) {
      setMessage('');
      setError('');
    } else {
      setConnected(false);
      setError('Connection lost. Please restart the app and reconnect.');
    }
  }

  function renderMessage({ item }: { item: ChatEvent }) {
    if (item.type === 'chat_message') {
      const isMine = item.username === currentUser;

      return (
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={styles.messageAuthor}>
            {isMine ? 'You' : item.username || 'Guest'}
          </Text>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString()
              : ''}
          </Text>
        </View>
      );
    }

    return (
      <Text style={styles.systemMessage}>
        {item.message || item.type}
      </Text>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.joinCard}>
          <Text style={styles.title}>Group Chat</Text>
          <Text style={styles.subtitle}>
            Enter your name to start a new chat
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={username}
            onChangeText={setUsername}
            maxLength={40}
            editable={!connecting}
            onSubmitEditing={startChat}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.button,
              connecting && styles.disabledButton,
            ]}
            onPress={startChat}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Start Chat</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Group Chat</Text>
          <Text style={styles.subtitle}>Logged in as {currentUser}</Text>
        </View>

        <Text
          style={[
            styles.status,
            connected ? styles.online : styles.offline,
          ]}
        >
          {connected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      <FlatList
        style={styles.messageList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.messageContent}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            editable={connected}
            multiline
          />

          <Pressable
            style={[
              styles.sendButton,
              !connected && styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={!connected}
          >
            <Text style={styles.buttonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  joinCard: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#172554',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  online: {
    color: '#15803D',
  },
  offline: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    marginTop: 12,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DBEAFE',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'right',
  },
  systemMessage: {
    alignSelf: 'center',
    color: '#64748B',
    fontSize: 12,
    marginVertical: 8,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
});
