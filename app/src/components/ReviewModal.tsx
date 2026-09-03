import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable,
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
      showToast('Thanks for your feedback.', 'success');
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
              <Ionicons name="star" size={24} color="#f59e0b" />
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
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <Ionicons
                    name={(n <= rating ? 'star' : 'star-outline') as any}
                    size={30}
                    color={n <= rating ? '#f59e0b' : COLORS.border}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.ratingLabel}>
              <Text style={styles.ratingLabelText}>
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below average' : 'Poor'}
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
              <Pressable style={styles.skipBtn} onPress={onClose} disabled={submitting}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </Pressable>
              <Pressable
                style={styles.submitBtn}
                onPress={handleRatingSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={(targetRole === 'DRIVER' ? GRADIENTS.primary : GRADIENTS.teal) as any}
                  style={styles.submitInner}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.submitBtnText}>Submit Review</Text>
                  }
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheetHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, paddingHorizontal: 20 },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3 },
  sheetSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  sheetBody: { padding: 22 },
  routeRecap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 18 },
  routeText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  routeDate: { fontSize: 11, color: COLORS.gray, marginLeft: 10 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  ratingLabel: { alignItems: 'center', marginBottom: 18 },
  ratingLabelText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
  commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 13, fontSize: 13.5, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 18 },
  btnRow: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray },
  submitBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  submitInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
