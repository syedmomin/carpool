import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import { uploadApi } from '../services/api';

// Permission denials (especially "Don't allow again") can't be re-requested in
// app — guide the user to the OS settings so they're never stuck.
function permissionAlert(message: string) {
  Alert.alert('Permission needed', message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

interface PickerOptions {
  aspect?: [number, number];
}

// type: 'profile' | 'vehicle' | 'documents'
export async function uploadToServer(uri, type = 'profile') {
  const { data, error } = await uploadApi.image(uri, type);
  if (error) return { error };
  return { url: data.data.url };
}

export async function pickImageFromLibrary(options: PickerOptions = {}, type = 'profile') {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    permissionAlert('Please allow photo library access to upload images.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return uploadToServer(result.assets[0].uri, type);
}

export async function pickImageFromCamera(options: PickerOptions = {}, type = 'profile') {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    permissionAlert('Please allow camera access to take a photo.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return uploadToServer(result.assets[0].uri, type);
}

// Pick multiple images locally (no upload) — returns local URIs
export async function pickMultipleImagesLocal() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    permissionAlert('Please allow photo library access to upload images.');
    return { uris: [], error: 'Permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 5, // matches the backend's upload.array('images', 5) cap
  });
  if (result.canceled) return { uris: [], cancelled: true };
  return { uris: result.assets.map(a => a.uri) };
}

// Pick single image from camera locally (no upload)
export async function pickImageFromCameraLocal(options: PickerOptions = {}) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    permissionAlert('Please allow camera access to take a photo.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return { uri: result.assets[0].uri };
}

// Pick a single image from the library, local only (no upload)
export async function pickImageFromLibraryLocal(options: PickerOptions = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    permissionAlert('Please allow photo library access to upload images.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return { uri: result.assets[0].uri };
}

// Same source-choice prompt as showImagePickerOptions, but purely local —
// no upload happens until the caller explicitly uploads the picked uri.
//
// react-native-web's Alert.alert doesn't support custom multi-button
// prompts — this silently renders nothing at all on web, so tapping an
// upload box there would look completely dead. The browser's own file
// picker already lets a user choose their camera as a source on mobile
// web, so skip straight to the library picker on web instead of showing
// a chooser that can't actually appear.
export function showImagePickerOptionsLocal(onResult) {
  if (Platform.OS === 'web') {
    pickImageFromLibraryLocal().then(onResult);
    return;
  }
  Alert.alert('Upload Photo', 'Choose a source', [
    { text: 'Camera', onPress: async () => onResult(await pickImageFromCameraLocal()) },
    { text: 'Photo Library', onPress: async () => onResult(await pickImageFromLibraryLocal()) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

// Upload a batch of local URIs to server — returns array of URLs
export async function uploadImages(uris, type = 'vehicle') {
  const uploads = await Promise.all(uris.map(uri => uploadToServer(uri, type)));
  const urls = uploads.filter(u => u.url).map(u => u.url);
  const firstError = uploads.find(u => u.error)?.error;
  return { urls, error: urls.length === 0 && uris.length > 0 ? firstError : null };
}

// Keep old version for backward compat (CnicVerificationScreen etc.)
export async function pickMultipleImages() {
  const { uris, error, cancelled } = await pickMultipleImagesLocal();
  if (cancelled) return { urls: [], cancelled: true };
  if (error) return { urls: [], error };
  return uploadImages(uris);
}

export function showImagePickerOptions(onResult, type = 'profile') {
  // Same web limitation as showImagePickerOptionsLocal above — Alert.alert's
  // custom buttons don't render on web at all.
  if (Platform.OS === 'web') {
    pickImageFromLibrary({}, type).then(onResult);
    return;
  }
  Alert.alert('Upload Photo', 'Choose a source', [
    { text: 'Camera', onPress: async () => onResult(await pickImageFromCamera({}, type)) },
    { text: 'Photo Library', onPress: async () => onResult(await pickImageFromLibrary({}, type)) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
