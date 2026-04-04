import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Platform, ScrollView,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from './theme';

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
            <TouchableOpacity onPress={onCancel}>
              <Text style={ms.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={ms.title}>{title}</Text>
            <TouchableOpacity onPress={onDone}>
              <LinearGradient colors={GRADIENTS.primary as any} style={ms.doneBtn}>
                <Text style={ms.doneText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  placeholder?: string;
}
export function DatePickerInput({ label, value, onChange, minDate, placeholder = 'Select date' }: DatePickerInputProps) {
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
      const iso = selected.toISOString().split('T')[0];
      onChange(iso);
    } else {
      setTempDate(selected);
    }
  };

  const handleDone = () => {
    setShow(false);
    onChange(tempDate.toISOString().split('T')[0]);
  };

  return (
    <View style={ps.wrap}>
      {!!label && <Text style={ps.label}>{label}</Text>}
      <TouchableOpacity style={ps.input} onPress={() => setShow(true)} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.gray} style={ps.icon} />
        <Text style={[ps.inputText, !value && ps.placeholder]}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </TouchableOpacity>

      {/* Android: inline */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          minimumDate={minDate}
          onChange={handleChange}
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
            onChange={handleChange}
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
      {!!label && <Text style={ps.label}>{label}</Text>}
      <TouchableOpacity style={ps.input} onPress={() => setShow(true)} activeOpacity={0.8}>
        <Ionicons name="time-outline" size={18} color={COLORS.gray} style={ps.icon} />
        <Text style={[ps.inputText, !value && ps.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </TouchableOpacity>

      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <PickerModal visible={show} title={label || 'Select Time'} onDone={handleDone} onCancel={() => setShow(false)}>
          <RNDateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            is24Hour={false}
            onChange={handleChange}
            style={{ height: 200 }}
          />
        </PickerModal>
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  wrap:        { marginBottom: 14 },
  label:       { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13 },
  icon:        { marginRight: 10 },
  inputText:   { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
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
