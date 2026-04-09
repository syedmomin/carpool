import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from './theme';
import { useToast } from '../context/ToastContext';
import { reviewsApi } from '../services/api';
import { parseApiError } from '../utils/errorMessages';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (reviewId: string) => void;
  rideId?: string;
  revieweeId: string;
  revieweeName: string;
  targetRole: 'DRIVER' | 'PASSENGER';
  routeLabel?: string;
  routeDate?: string;
}

export default function ReviewModal({
  visible, onClose, onSubmit,
  rideId, revieweeId, revieweeName,
  targetRole, routeLabel, routeDate
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleRatingSubmit = async () => {
    if (!rating) {
      showToast('Please select a star rating', 'error');
      return;
    }
    setSubmitting(true);
    const { data, error } = await reviewsApi.submit({
      rideId,
      revieweeId,
      targetRole,
      rating,
      comment
    });
    setSubmitting(false);

    if (error) {
      showToast(parseApiError(error), 'error');
    } else {
      showToast('Thank you for your feedback! ⭐', 'success');
      if (onSubmit) onSubmit(data?.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient 
            colors={targetRole === 'DRIVER' ? GRADIENTS.primary as any : GRADIENTS.teal as any} 
            style={styles.sheetHeader}
          >
            <View style={styles.iconBox}>
              <Ionicons name="star" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.sheetTitle}>
              {targetRole === 'DRIVER' ? 'Rate Your Driver' : 'Rate Your Passenger'}
            </Text>
            <Text style={styles.sheetSub}>How was your trip with {revieweeName}?</Text>
          </LinearGradient>

          <View style={styles.sheetBody}>
            {routeLabel && (
              <View style={styles.routeRecap}>
                <Text style={styles.routeText}>{routeLabel}</Text>
                {routeDate && <Text style={styles.routeDate}>{routeDate}</Text>}
              </View>
            )}

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons 
                    name={(n <= rating ? 'star' : 'star-outline') as any}
                    size={40}
                    color={n <= rating ? '#f59e0b' : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ratingLabel}>
              <Text style={styles.ratingLabelText}>
                {rating === 5 ? '⭐ Excellent!' : rating === 4 ? '😊 Good' : rating === 3 ? '😐 Average' : rating === 2 ? '😕 Below Average' : '😞 Poor'}
              </Text>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment (optional)..."
              placeholderTextColor={COLORS.gray}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={onClose} disabled={submitting}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: targetRole === 'DRIVER' ? COLORS.primary : COLORS.teal }]} 
                onPress={handleRatingSubmit} 
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitBtnText}>Submit Review</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  sheetHeader: { alignItems: 'center', paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20 },
  iconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  sheetBody: { padding: 24 },
  routeRecap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 20 },
  routeText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  routeDate: { fontSize: 11, color: COLORS.gray, marginLeft: 10 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
  ratingLabel: { alignItems: 'center', marginBottom: 20 },
  ratingLabelText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.textPrimary, minHeight: 90, textAlignVertical: 'top', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
  skipBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
  submitBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
