import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native';

const QUICK_EMOJIS = ['😊','😂','❤️','👍','🙏','😮','😢','🔥','👏','😎','✅','🎉'];
const REACTION_EMOJIS = ['👍','❤️','😂','😮','😢','🙏'];
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, Avatar, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { socketService } from '../../services/socket.service';
import { chatApi } from '../../services/api';

export default function ChatScreen({ route, navigation }) {
  const { bookingId, otherUser: initialOtherUser, rideInfo: initialRideInfo } = route.params || {};
  const { currentUser } = useApp();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingInfo, setFetchingInfo] = useState(!initialOtherUser);
  const [otherUser, setOtherUser] = useState(initialOtherUser);
  const [rideInfo, setRideInfo] = useState(initialRideInfo);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!initialOtherUser) {
      fetchBookingInfo();
    }
  }, [bookingId]);

  const fetchBookingInfo = async () => {
    try {
      const { bookingsApi } = require('../../services/api');
      const { data, error } = await bookingsApi.getById(bookingId);
      if (data?.data) {
        const b = data.data;
        const isDriver = b.ride.driverId === currentUser.id;
        setOtherUser(isDriver ? b.passenger : b.ride.driver);
        setRideInfo({ label: `${b.ride.fromCity} → ${b.ride.toCity}` });
      }
    } catch (err) {
      console.error('[ChatScreen] Failed to fetch booking info:', err);
    } finally {
      setFetchingInfo(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    socketService.connect();
    socketService.socket?.emit('join-chat', { bookingId });

    // Mark as read on entry
    socketService.socket?.emit('read-messages', { bookingId });

    const handleNewMessage = (msg: any) => {
      setMessages(prev => [...prev, msg]);
      // Mark as read when new message arrives while active
      socketService.socket?.emit('read-messages', { bookingId });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleTypingStart = ({ userId }: any) => {
      if (userId !== currentUser.id) setIsOtherTyping(true);
    };

    const handleTypingStop = ({ userId }: any) => {
      if (userId !== currentUser.id) setIsOtherTyping(false);
    };

    const handleMessagesRead = ({ userId }: any) => {
      if (userId !== currentUser.id) {
        setMessages(prev => prev.map(m => m.senderId === currentUser.id ? { ...m, readAt: new Date() } : m));
      }
    };

    socketService.on('new-message', handleNewMessage);
    socketService.on('typing-start', handleTypingStart);
    socketService.on('typing-stop', handleTypingStop);
    socketService.on('messages-read', handleMessagesRead);

    return () => {
      socketService.off('new-message');
      socketService.off('typing-start');
      socketService.off('typing-stop');
      socketService.off('messages-read');
    };
  }, [bookingId]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Typing start
    if (text.length > 0 && !inputText) {
      socketService.socket?.emit('typing-start', { bookingId });
    }

    // Debounce typing stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.socket?.emit('typing-stop', { bookingId });
    }, 2000);

    // Typing stop on clear
    if (text.length === 0) {
      socketService.socket?.emit('typing-stop', { bookingId });
    }
  };

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

    socketService.emitWithQueue('send-message', payload);
    socketService.socket?.emit('typing-stop', { bookingId });
    setInputText('');
    Keyboard.dismiss();
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser?.id;
    const time = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const isRead = !!item.readAt;
    const msgReaction = reactions[item.id];
    const isReacting = reactingTo === item.id;

    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        {!isMe && (
          <Avatar name={item.sender?.name} uri={item.sender?.avatar} size={30} style={styles.avatar} />
        )}
        <View>
          <Pressable
            onLongPress={() => setReactingTo(isReacting ? null : item.id)}
            delayLongPress={350}
          >
            <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
              <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={[styles.timeText, isMe ? styles.myTime : styles.otherTime]}>{time}</Text>
                {isMe && (
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color={isRead ? '#4ade80' : 'rgba(255,255,255,0.5)'}
                    style={styles.readIcon}
                  />
                )}
              </View>
            </View>
          </Pressable>

          {/* Reaction picker bar */}
          {isReacting && (
            <View style={[styles.reactionBar, isMe ? styles.reactionBarRight : styles.reactionBarLeft]}>
              {REACTION_EMOJIS.map(e => (
                <Pressable
                  key={e}
                  onPress={() => {
                    setReactions(r => ({ ...r, [item.id]: r[item.id] === e ? '' : e }));
                    setReactingTo(null);
                  }}
                  style={styles.reactionOption}
                >
                  <Text style={styles.reactionOptionText}>{e}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setReactingTo(null)} style={styles.reactionClose}>
                <Ionicons name="close" size={14} color={COLORS.gray} />
              </Pressable>
            </View>
          )}

          {/* Attached reaction badge */}
          {!!msgReaction && (
            <Pressable
              onPress={() => setReactions(r => ({ ...r, [item.id]: '' }))}
              style={[styles.reactionBadge, isMe ? styles.reactionBadgeRight : styles.reactionBadgeLeft]}
            >
              <Text style={styles.reactionBadgeText}>{msgReaction}</Text>
            </Pressable>
          )}
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
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Avatar name={otherUser?.name} uri={otherUser?.avatar} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          <Text style={styles.headerRide} numberOfLines={1}>
            {isOtherTyping ? 'typing...' : (rideInfo?.label || 'Trip Details')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Pressable onPress={() => { setReactingTo(null); setEmojiOpen(false); }} style={{ flex: 1 }}>
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
              subtitle={`Say hi to ${otherUser?.name || 'them'} to start the conversation.`}
              style={{ flex: 1, justifyContent: 'center' }}
            />
          }
          onContentSizeChange={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
        />
        </Pressable>

        {/* Emoji picker grid */}
        {emojiOpen && (
          <View style={styles.emojiGrid}>
            {QUICK_EMOJIS.map(e => (
              <Pressable
                key={e}
                onPress={() => setInputText(t => t + e)}
                style={styles.emojiItem}
              >
                <Text style={styles.emojiChar}>{e}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.inputArea}>
          <Pressable
            style={styles.emojiBtn}
            onPress={() => { setEmojiOpen(v => !v); Keyboard.dismiss(); }}
          >
            <Text style={styles.emojiBtnIcon}>{emojiOpen ? '⌨️' : '😊'}</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={handleInputChange}
            onFocus={() => setEmojiOpen(false)}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
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
  messageFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: 4 },
  timeText: { fontSize: 9 },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  otherTime: { color: COLORS.gray },
  readIcon: { marginLeft: 2 },

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
    marginLeft: 8,
  },

  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  emojiBtnIcon: { fontSize: 22 },

  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  emojiItem: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emojiChar: { fontSize: 24 },

  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  reactionBarRight: { alignSelf: 'flex-end' },
  reactionBarLeft: { alignSelf: 'flex-start' },
  reactionOption: { paddingHorizontal: 4, paddingVertical: 2 },
  reactionOptionText: { fontSize: 22 },
  reactionClose: { paddingHorizontal: 4, paddingVertical: 2 },

  reactionBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reactionBadgeRight: { alignSelf: 'flex-end' },
  reactionBadgeLeft: { alignSelf: 'flex-start' },
  reactionBadgeText: { fontSize: 16 },
});
