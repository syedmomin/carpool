import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, Avatar, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { socketService } from '../../services/socket.service';
import { chatApi } from '../../services/api';

export default function ChatScreen({ route, navigation }) {
  const { bookingId, otherUser, rideInfo } = route.params || {};
  const { currentUser } = useApp();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
    socketService.connect();
    socketService.socket?.emit('join-chat', { bookingId });

    const handleNewMessage = (msg: any) => {
      setMessages(prev => [...prev, msg]);
      // Small delay to ensure list has rendered the new item
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    socketService.on('new-message', handleNewMessage);

    return () => {
      socketService.off('new-message');
    };
  }, [bookingId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await chatApi.getHistory(bookingId);
      if (data) {
        setMessages(data.data || []);
      } else {
        showToast(error || 'Failed to load chat history', 'error');
      }
    } catch (err) {
      showToast('Error loading chat', 'error');
    } finally {
      setLoading(false);
      // Scroll to bottom after load
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || sending) return;

    const payload = {
      bookingId,
      senderId: currentUser?.id,
      content: inputText.trim(),
    };

    socketService.socket?.emit('send-message', payload);
    setInputText('');
    Keyboard.dismiss();
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser?.id;
    const time = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        {!isMe && (
          <Avatar name={item.sender?.name} size={30} style={styles.avatar} />
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.myTime : styles.otherTime]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Avatar name={otherUser?.name} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          <Text style={styles.headerRide} numberOfLines={1}>{rideInfo?.label || 'Trip Details'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={[styles.listContent, messages.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No Messages Yet"
              subtitle={`Send a reach out to ${otherUser?.name || 'them'} to start the conversation.`}
              style={{ flex: 1, justifyContent: 'center' }}
            />
          }
          onContentSizeChange={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { paddingRight: 12 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerRide: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  
  listContent: { padding: 16, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  myRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  otherRow: { alignSelf: 'flex-start' },
  avatar: { marginRight: 8 },
  bubble: {
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#fff' },
  otherText: { color: COLORS.textPrimary },
  timeText: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  otherTime: { color: COLORS.gray },

  inputArea: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
