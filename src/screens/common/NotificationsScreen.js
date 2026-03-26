import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../components';
import { useApp } from '../../context/AppContext';

const TYPE_CONFIG = {
  booking: { icon: 'checkmark-circle', color: COLORS.secondary, bg: '#e8f5e9' },
  request: { icon: 'person-add', color: COLORS.primary, bg: '#eff6ff' },
  reminder: { icon: 'alarm', color: COLORS.accent, bg: '#fff8e1' },
  default: { icon: 'notifications', color: COLORS.gray, bg: COLORS.lightGray },
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, markNotificationRead, unreadCount } = useApp();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Text style={styles.headerSub}>{unreadCount} naye notifications</Text>
        )}
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => markNotificationRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.read && { fontWeight: '800' }]}>{item.title}</Text>
                <Text style={styles.notifMessage}>{item.message}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Koi Notification Nahi</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  listContent: { padding: 16 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  notifMessage: { fontSize: 13, color: COLORS.gray, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11, color: COLORS.gray },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
});
