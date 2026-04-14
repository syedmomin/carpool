import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, PrimaryButton, SearchInput, TabPills, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { searchPakistanLocations } from '../../utils/locationSearch';
import { scheduleRequestsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

// ─── City Search Modal ─────────────────────────────────────────────────────────
function CitySearchModal({ visible, title, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { if (!visible) { setQuery(''); setResults([]); } }, [visible]);

  const handleSearch = (text) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchPakistanLocations(text);
      setResults(res);
      setSearching(false);
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        </View>
        <View style={ms.searchWrap}>
          <SearchInput placeholder="Search city..." value={query} onChangeText={handleSearch} onClear={() => { setQuery(''); setResults([]); }} />
          {searching && <ActivityIndicator style={{ marginTop: 8 }} color={COLORS.primary} />}
        </View>
        {results.length > 0 ? (
          <FlatList data={results} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => (
            <TouchableOpacity style={ms.item} onPress={() => onSelect(item.name)}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={ms.itemName}>{item.name}</Text>
                <Text style={ms.itemSub} numberOfLines={1}>{item.displayName}</Text>
              </View>
            </TouchableOpacity>
          )} />
        ) : query.length >= 2 && !searching ? (
          <View style={ms.empty}><Ionicons name="search-outline" size={40} color={COLORS.border} /><Text style={ms.emptyText}>No results found.</Text></View>
        ) : (
          <View style={ms.hint}><Ionicons name="information-circle-outline" size={18} color={COLORS.gray} /><Text style={ms.hintText}>Type at least 2 characters</Text></View>
        )}
      </View>
    </Modal>
  );
}

// ─── Calendar helpers ──────────────────────────────────────────────────────────
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function fmt(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const TABS = [{ value: 0, label: 'Post Request' }, { value: 1, label: 'My Requests' }];
const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ScheduleScreen({ navigation }) {
  const { addScheduleAlert, removeScheduleAlert, scheduleAlerts } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const today = new Date();
  const [activeTab, setActiveTab] = useState(0);

  // ── Post Request form state ───────────────────────────────────────────────
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [seats, setSeats] = useState(1);
  const [note, setNote]   = useState('');
  const [posting, setPosting] = useState(false);
  const [cityModal, setCityModal] = useState<'from' | 'to' | null>(null);

  // ── My Requests state ────────────────────────────────────────────────────
  const [myRequests, setMyRequests]   = useState<any[]>([]);
  const [reqLoading, setReqLoading]   = useState(false);
  const [reqRefreshing, setReqRefreshing] = useState(false);

  const cells   = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

  const isDisabled = (day) => {
    if (!day) return true;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) || d > maxDate;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (new Date(ny, nm, 1) > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setViewMonth(nm); if (viewMonth === 11) setViewYear(y => y + 1);
  };

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isNextDisabled = viewYear === maxDate.getFullYear() && viewMonth === maxDate.getMonth();

  // ── Load my requests ──────────────────────────────────────────────────────
  const loadMyRequests = useCallback(async (isRefresh = false) => {
    isRefresh ? setReqRefreshing(true) : setReqLoading(true);
    const { data } = await scheduleRequestsApi.getMine();
    isRefresh ? setReqRefreshing(false) : setReqLoading(false);
    if (data?.data) setMyRequests(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    if (activeTab === 1) loadMyRequests();

    // Live socket updates for bids
    const onRideBid = (data: any) => {
      const bid = data.bid;
      if (!bid) return;
      setMyRequests(prev => prev.map(req => {
        if (req.id !== bid.scheduleRequestId) return req;
        const exists = (req.bids || []).find((b: any) => b.id === bid.id);
        if (exists) return req;
        return { ...req, bids: [...(req.bids || []), bid] };
      }));
    };

    const onBidWithdrawn = (data: any) => {
      if (!data.bidId) return;
      setMyRequests(prev => prev.map(req => ({
        ...req,
        bids: (req.bids || []).filter((b: any) => b.id !== data.bidId),
      })));
    };

    socketService.on('RIDE_BID', onRideBid);
    socketService.on('BID_WITHDRAWN', onBidWithdrawn);

    return () => {
      socketService.off('RIDE_BID', onRideBid);
      socketService.off('BID_WITHDRAWN', onBidWithdrawn);
    };
  }, [activeTab, loadMyRequests]));

  // ── Post Request ──────────────────────────────────────────────────────────
  const handlePostRequest = async () => {
    if (!selectedDate) { showToast('Please select a date', 'warning'); return; }
    if (!from)         { showToast('Please select departure city', 'warning'); return; }
    if (!to)           { showToast('Please select destination city', 'warning'); return; }
    if (from === to)   { showToast('Cities cannot be the same', 'error'); return; }

    setPosting(true);
    const { data, error } = await scheduleRequestsApi.create({ fromCity: from, toCity: to, date: selectedDate, seats, note: note.trim() || undefined });
    setPosting(false);

    if (error) { showToast(error, 'error'); return; }

    showToast('Request posted! Drivers will bid on it soon.', 'success', 4000);
    setSelectedDate(null); setFrom(''); setTo(''); setSeats(1); setNote('');
    setActiveTab(1);
    loadMyRequests();
  };

  // ── Cancel Request ────────────────────────────────────────────────────────
  const handleCancelRequest = (req: any) => {
    showModal({
      type: 'danger',
      title: 'Cancel Request?',
      message: `Cancel your ${req.fromCity} → ${req.toCity} request on ${req.date}? All pending bids will be removed.`,
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      onConfirm: async () => {
        const { error } = await scheduleRequestsApi.cancel(req.id);
        if (error) { showToast(error, 'error'); return; }
        showToast('Request cancelled', 'info');
        loadMyRequests();
      },
    });
  };

  // ── Accept Bid ────────────────────────────────────────────────────────────
  const handleAcceptBid = (req: any, bid: any) => {
    showModal({
      type: 'primary',
      title: 'Accept Bid?',
      message: `Accept ${bid.driver?.name}'s offer of Rs ${bid.pricePerSeat}/seat for ${req.fromCity} → ${req.toCity}?\n\nA ride will be auto-created and your seat will be confirmed.`,
      confirmText: 'Accept & Book',
      cancelText: 'Not Now',
      icon: 'checkmark-circle-outline',
      onConfirm: async () => {
        const { data, error } = await scheduleRequestsApi.acceptBid(req.id, bid.id);
        if (error) { showToast(error, 'error'); return; }
        showToast('Bid accepted! Your ride is confirmed. 🎉', 'success', 4000);
        loadMyRequests();
      },
    });
  };

  // ── Reject Bid ────────────────────────────────────────────────────────────
  const handleRejectBid = async (req: any, bid: any) => {
    const { error } = await scheduleRequestsApi.rejectBid(req.id, bid.id);
    if (error) { showToast(error, 'error'); return; }
    showToast('Bid rejected', 'info');
    loadMyRequests();
  };

  // ─── Status color helper ──────────────────────────────────────────────────
  const statusConfig: any = {
    OPEN:      { color: COLORS.secondary, bg: '#e8f5e9', label: 'Open' },
    ACCEPTED:  { color: '#0369a1',        bg: '#e0f2fe', label: 'Accepted' },
    CANCELLED: { color: COLORS.danger,    bg: '#fef2f2', label: 'Cancelled' },
    EXPIRED:   { color: '#9a3412',        bg: '#fef2f2', label: 'Expired' },
  };

  // ─── Render My Requests tab ───────────────────────────────────────────────
  const renderMyRequests = () => {
    if (reqLoading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    if (!myRequests.length) return (
      <EmptyState icon="calendar-outline" title="No Requests Yet" subtitle="Post a schedule request and drivers will bid with their prices." />
    );

    return (
      <FlatList
        data={myRequests}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshing={reqRefreshing}
        onRefresh={() => loadMyRequests(true)}
        renderItem={({ item: req }) => {
          const sc = statusConfig[req.status] || statusConfig.OPEN;
          const pendingBids = (req.bids || []).filter(b => b.status === 'PENDING');
          const acceptedBid = (req.bids || []).find(b => b.status === 'ACCEPTED');

          return (
            <View style={styles.reqCard}>
              {/* Header */}
              <View style={styles.reqHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqRoute}>{req.fromCity} → {req.toCity}</Text>
                  <View style={styles.reqMeta}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
                    <Text style={styles.reqMetaText}>{req.date}</Text>
                    <Ionicons name="people-outline" size={13} color={COLORS.gray} />
                    <Text style={styles.reqMetaText}>{req.seats} seat{req.seats > 1 ? 's' : ''}</Text>
                  </View>
                  {req.note ? <Text style={styles.reqNote}>"{req.note}"</Text> : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              {/* Accepted bid banner */}
              {acceptedBid && (
                <View style={styles.acceptedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                  <Text style={styles.acceptedBannerText}>
                    Accepted: {acceptedBid.driver?.name} — Rs {acceptedBid.pricePerSeat}/seat
                  </Text>
                </View>
              )}

              {/* Pending bids */}
              {pendingBids.length > 0 && req.status === 'OPEN' && (
                <View style={styles.bidsSection}>
                  <Text style={styles.bidsSectionTitle}>
                    {pendingBids.length} Bid{pendingBids.length > 1 ? 's' : ''} Received
                  </Text>
                  {pendingBids.map(bid => (
                    <View key={bid.id} style={styles.bidCard}>
                      <View style={styles.bidLeft}>
                        <View style={styles.bidAvatar}>
                          <Text style={styles.bidAvatarText}>{bid.driver?.name?.[0] || 'D'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bidDriverName}>{bid.driver?.name || 'Driver'}</Text>
                          {bid.driver?.rating > 0 && (
                            <View style={styles.bidRatingRow}>
                              <Ionicons name="star" size={11} color="#f59e0b" />
                              <Text style={styles.bidRatingText}>{bid.driver.rating}</Text>
                            </View>
                          )}
                          {bid.vehicle && (
                            <Text style={styles.bidVehicleText}>{bid.vehicle.brand} {bid.vehicle.model} · {bid.vehicle.type}</Text>
                          )}
                          {bid.departureTime ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Ionicons name="time-outline" size={11} color={COLORS.gray} />
                              <Text style={styles.bidVehicleText}>Departure: {bid.departureTime}</Text>
                            </View>
                          ) : null}
                          {bid.note ? <Text style={styles.bidNote}>"{bid.note}"</Text> : null}
                        </View>
                        <View style={styles.bidPriceBox}>
                          <Text style={styles.bidPriceLabel}>Per Seat</Text>
                          <Text style={styles.bidPrice}>Rs {bid.pricePerSeat}</Text>
                          <Text style={styles.bidPriceTotal}>Total Rs {bid.pricePerSeat * req.seats}</Text>
                        </View>
                      </View>
                      <View style={styles.bidActions}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectBid(req, bid)}>
                          <Ionicons name="close" size={14} color={COLORS.danger} />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptBid(req, bid)}>
                          <LinearGradient colors={GRADIENTS.primary as any} style={styles.acceptBtnGrad}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* No bids yet */}
              {req.status === 'OPEN' && pendingBids.length === 0 && !acceptedBid && (
                <View style={styles.noBidsRow}>
                  <Ionicons name="time-outline" size={15} color={COLORS.gray} />
                  <Text style={styles.noBidsText}>Waiting for driver bids...</Text>
                </View>
              )}

              {/* Cancel button */}
              {req.status === 'OPEN' && (
                <TouchableOpacity style={styles.cancelReqBtn} onPress={() => handleCancelRequest(req)}>
                  <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
                  <Text style={styles.cancelReqText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="Schedule a Ride"
        subtitle="Post a request — drivers will bid"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <TabPills tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} color={COLORS.primary} style={styles.tabs} />

      {activeTab === 1 ? renderMyRequests() : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Calendar */}
          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={prevMonth} disabled={isPrevDisabled} style={[styles.monthArrow, isPrevDisabled && styles.monthArrowDisabled]}>
                <Ionicons name="chevron-back" size={20} color={isPrevDisabled ? COLORS.border : COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth} disabled={isNextDisabled} style={[styles.monthArrow, isNextDisabled && styles.monthArrowDisabled]}>
                <Ionicons name="chevron-forward" size={20} color={isNextDisabled ? COLORS.border : COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.daysRow}>
              {DAYS.map(d => <Text key={d} style={[styles.dayLabel, d === 'Sun' && { color: COLORS.danger }]}>{d}</Text>)}
            </View>
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (!day) return <View key={`e${idx}`} style={styles.cell} />;
                const dateStr  = fmt(viewYear, viewMonth, day);
                const disabled = isDisabled(day);
                const isToday  = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isSel    = dateStr === selectedDate;
                return (
                  <TouchableOpacity key={dateStr} style={styles.cell} onPress={() => !disabled && setSelectedDate(dateStr)} disabled={disabled} activeOpacity={0.7}>
                    {isSel ? (
                      <LinearGradient colors={GRADIENTS.primary as any} style={styles.cellSelected}>
                        <Text style={styles.cellTextSelected}>{day}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.cellInner, isToday && styles.cellToday, disabled && styles.cellDisabled]}>
                        <Text style={[styles.cellText, isToday && styles.cellTextToday, disabled && styles.cellTextDisabled, (idx % 7 === 0) && !disabled && { color: COLORS.danger }]}>{day}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedDate && (
              <View style={styles.selectedDateBanner}>
                <Ionicons name="calendar" size={15} color={COLORS.primary} />
                <Text style={styles.selectedDateText}>Selected: {selectedDate}</Text>
                <TouchableOpacity onPress={() => setSelectedDate(null)}><Ionicons name="close-circle" size={16} color={COLORS.gray} /></TouchableOpacity>
              </View>
            )}
          </View>

          {/* Route */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            <View style={styles.routeRow}>
              <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('from')}>
                <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
                <Text style={[styles.cityBtnText, !from && styles.placeholder]}>{from || 'Departure City'}</Text>
                <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.swapBtn} onPress={() => { const t = from; setFrom(to); setTo(t); }}>
                <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('to')}>
                <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={[styles.cityBtnText, !to && styles.placeholder]}>{to || 'Destination City'}</Text>
                <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seats Needed</Text>
            <View style={styles.seatsRow}>
              {SEAT_OPTIONS.map(n => (
                <TouchableOpacity key={n} style={[styles.seatChip, seats === n && styles.seatChipActive]} onPress={() => setSeats(n)}>
                  <Text style={[styles.seatChipText, seats === n && styles.seatChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note for Driver <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.noteInput}
              placeholder="E.g. Need pickup from main bus stop, luggage to carry..."
              placeholderTextColor={COLORS.gray}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Info */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Drivers will see your request and bid with their price. You can accept the best offer — a ride will be instantly created and your seat confirmed.
            </Text>
          </View>

          {/* Submit */}
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <PrimaryButton
              title={posting ? 'Posting...' : 'Post Request'}
              icon="send-outline"
              onPress={handlePostRequest}
              colors={GRADIENTS.primary as any}
              disabled={posting}
            />
          </View>
        </ScrollView>
      )}

      <CitySearchModal visible={cityModal === 'from'} title="Departure City" onSelect={name => { setFrom(name); setCityModal(null); }} onClose={() => setCityModal(null)} />
      <CitySearchModal visible={cityModal === 'to'} title="Destination City" onSelect={name => { setTo(name); setCityModal(null); }} onClose={() => setCityModal(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  tabs:         { margin: 16 },
  loadingCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  // Calendar
  calendarCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
  monthHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  monthArrowDisabled: { backgroundColor: COLORS.lightGray },
  monthTitle:   { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  daysRow:      { flexDirection: 'row', marginBottom: 8 },
  dayLabel:     { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.gray },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  cell:         { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  cellInner:    { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  cellSelected: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cellToday:    { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: COLORS.primary },
  cellDisabled: {},
  cellText:     { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  cellTextSelected: { fontSize: 13, fontWeight: '800', color: '#fff' },
  cellTextToday:    { color: COLORS.primary, fontWeight: '800' },
  cellTextDisabled: { color: COLORS.border },
  selectedDateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 12 },
  selectedDateText:   { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Form
  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  optional:     { fontSize: 12, fontWeight: '400', color: COLORS.gray },
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8, elevation: 1 },
  cityDot:      { width: 8, height: 8, borderRadius: 4 },
  cityBtnText:  { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  placeholder:  { color: COLORS.gray, fontWeight: '400' },
  swapBtn:      { padding: 8, backgroundColor: '#eff6ff', borderRadius: 10 },
  seatsRow:     { flexDirection: 'row', gap: 10 },
  seatChip:     { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  seatChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  seatChipText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  seatChipTextActive: { color: '#fff' },
  noteInput:    { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 14, fontSize: 14, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 80 },
  infoBanner:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 14, marginHorizontal: 16, padding: 14, gap: 10, marginBottom: 20 },
  infoText:     { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20 },

  // Request cards
  reqCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  reqHeader:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  reqRoute:     { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  reqMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqMetaText:  { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  reqNote:      { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginBottom: 8 },
  acceptedBannerText: { fontSize: 13, fontWeight: '600', color: COLORS.secondary, flex: 1 },

  bidsSection:  { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 4 },
  bidsSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },

  bidCard:      { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 8 },
  bidLeft:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bidAvatar:    { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  bidAvatarText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
  bidDriverName:{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  bidRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  bidRatingText:{ fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  bidVehicleText:{ fontSize: 11, color: COLORS.gray, marginTop: 2 },
  bidNote:      { fontSize: 11, color: COLORS.gray, fontStyle: 'italic', marginTop: 3 },
  bidPriceBox:  { alignItems: 'flex-end' },
  bidPriceLabel:{ fontSize: 10, color: COLORS.gray, textTransform: 'uppercase' },
  bidPrice:     { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  bidPriceTotal:{ fontSize: 10, color: COLORS.gray },

  bidActions:   { flexDirection: 'row', gap: 8, marginTop: 10 },
  rejectBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.danger + '50', borderRadius: 10, paddingVertical: 8 },
  rejectBtnText:{ fontSize: 13, fontWeight: '600', color: COLORS.danger },
  acceptBtn:    { flex: 2, borderRadius: 10, overflow: 'hidden' },
  acceptBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9 },
  acceptBtnText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  noBidsRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  noBidsText:   { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },

  cancelReqBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelReqText:{ fontSize: 13, fontWeight: '600', color: COLORS.danger },
});

const ms = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  searchWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  item:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemName:   { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  itemSub:    { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { fontSize: 14, color: COLORS.gray },
  hint:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20 },
  hintText:   { fontSize: 13, color: COLORS.gray },
});
