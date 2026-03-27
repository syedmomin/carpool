import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';

const TYPE_CONFIG = {
  booking:  { icon: 'checkmark-circle', color: COLORS.secondary, bg: '#e8f5e9' },
  request:  { icon: 'person-add',       color: COLORS.primary,   bg: '#eff6ff' },
  reminder: { icon: 'alarm',            color: COLORS.accent,    bg: '#fff8e1' },
  default:  { icon: 'notifications',    color: COLORS.gray,      bg: COLORS.lightGray },
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, markNotificationRead, unreadCount } = useApp();

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} naye notifications` : undefined}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => markNotificationRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !item.read && { fontWeight: '800' }]}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="Koi Notification Nahi" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  message: { fontSize: 13, color: COLORS.gray, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: COLORS.gray },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4, flexShrink: 0 },
});
