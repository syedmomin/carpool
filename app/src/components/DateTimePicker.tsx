import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet,
  Platform, ScrollView,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from './theme';
import { formatLocalDate } from '../utils/date';

// ─── Shared Modal Wrapper (iOS) ───────────────────────────────────────────────
interface PickerModalProps {
  visible: boolean;
  title?: string;
  onDone: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}
function PickerModal({ visible, title, onDone, onCancel, children }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <View style={ms.header}>
            <Pressable onPress={onCancel}>
              <Text style={ms.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={ms.title}>{title}</Text>
            <Pressable onPress={onDone}>
              <LinearGradient colors={GRADIENTS.primary as any} style={ms.doneBtn}>
                <Text style={ms.doneText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ─── DatePickerInput ──────────────────────────────────────────────────────────
interface DatePickerInputProps {
  label?: string;
  value?: string | Date | null;
  onChange: (d: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}
export function DatePickerInput({ label, value, onChange, minDate, maxDate, placeholder = 'Select date' }: DatePickerInputProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const formatDisplay = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return d.toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleChange = (_e, selected) => {
    if (!selected) return;
    if (Platform.OS === 'android') {
      setShow(false);
      onChange(formatLocalDate(selected));
    } else {
      setTempDate(selected);
    }
  };

  const handleDone = () => {
    setShow(false);
    onChange(formatLocalDate(tempDate));
  };

  return (
    <View style={ps.wrap}>
      <Pressable style={ps.input} onPress={() => setShow(true)}>
        <View style={{ flex: 1 }}>
          {!!label && <Text style={ps.label}>{label}</Text>}
          <Text style={[ps.inputText, !value && ps.placeholder]}>
            {value ? formatDisplay(value) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </Pressable>

      {/* Android: inline */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onValueChange={handleChange}
        />
      )}

      {/* Web: RNDateTimePicker has no web implementation — fall back to a
          native <input type="date"> transparently overlaid on the Pressable,
          so the same tap area opens the browser's own date picker (a click
          must land on the real input for that popup to open). */}
      {Platform.OS === 'web' && (
        // @ts-ignore - host element, valid under react-native-web
        <input
          type="date"
          value={value ? formatLocalDate(new Date(value)) : ''}
          min={minDate ? formatLocalDate(minDate) : undefined}
          max={maxDate ? formatLocalDate(maxDate) : undefined}
          onChange={(e: any) => { if (e.target.value) onChange(e.target.value); }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        />
      )}

      {/* iOS: modal */}
      {Platform.OS === 'ios' && (
        <PickerModal visible={show} title={label || 'Select Date'} onDone={handleDone} onCancel={() => setShow(false)}>
          <RNDateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minDate}
            maximumDate={maxDate}
            onValueChange={handleChange}
            style={{ height: 200 }}
          />
        </PickerModal>
      )}
    </View>
  );
}

// ─── TimePickerInput ──────────────────────────────────────────────────────────
interface TimePickerInputProps {
  label?: string;
  value?: string | null;
  onChange: (t: string) => void;
  placeholder?: string;
}
export function TimePickerInput({ label, value, onChange, placeholder = 'Select time' }: TimePickerInputProps) {
  const [show, setShow] = useState(false);
  const [tempTime, setTempTime] = useState(() => {
    if (value) {
      const [h, m] = value.replace(/\s?(AM|PM)/i, '').split(':').map(Number);
      const d = new Date();
      d.setHours(value.toLowerCase().includes('pm') && h !== 12 ? h + 12 : h, m, 0);
      return d;
    }
    return new Date();
  });

  const formatTime = (date) =>
    date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleChange = (_e, selected) => {
    if (!selected) return;
    if (Platform.OS === 'android') {
      setShow(false);
      onChange(formatTime(selected));
    } else {
      setTempTime(selected);
    }
  };

  const handleDone = () => {
    setShow(false);
    onChange(formatTime(tempTime));
  };

  return (
    <View style={ps.wrap}>
      <Pressable style={ps.input} onPress={() => setShow(true)}>
        <View style={{ flex: 1 }}>
          {!!label && <Text style={ps.label}>{label}</Text>}
          <Text style={[ps.inputText, !value && ps.placeholder]}>
            {value || placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </Pressable>

      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          is24Hour={false}
          onValueChange={handleChange}
        />
      )}

      {/* Web: same transparent-overlay approach as DatePickerInput. Native
          <input type="time"> gives 24h "HH:MM"; convert to this app's
          "h:mm AM/PM" string so form.departureTime etc. stay consistent. */}
      {Platform.OS === 'web' && (
        // @ts-ignore - host element, valid under react-native-web
        <input
          type="time"
          onChange={(e: any) => {
            if (!e.target.value) return;
            const [h, m] = e.target.value.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0);
            onChange(formatTime(d));
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        />
      )}

      {Platform.OS === 'ios' && (
        <PickerModal visible={show} title={label || 'Select Time'} onDone={handleDone} onCancel={() => setShow(false)}>
          <RNDateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            is24Hour={false}
            onValueChange={handleChange}
            style={{ height: 200 }}
          />
        </PickerModal>
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  wrap:        { marginBottom: 12 },
  label:       { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  input:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, position: 'relative' },
  inputText:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
});

const ms = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cancelText: { fontSize: 15, color: COLORS.gray },
  doneBtn:    { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  doneText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
});
