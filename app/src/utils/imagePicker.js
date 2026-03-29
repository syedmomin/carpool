import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { BASE_URL, tokenStorage } from '../services/api';

// type: 'profile' | 'vehicle' | 'documents'
async function uploadToServer(uri, type = 'profile') {
  try {
    const token = await tokenStorage.get();
    const formData = new FormData();
    formData.append('image', { uri, type: 'image/jpeg', name: `upload_${Date.now()}.jpg` });

    const res = await fetch(`${BASE_URL}/upload/image?type=${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || 'Upload failed' };
    return { url: json.data.url };
  } catch (e) {
    return { error: e.message || 'Upload failed' };
  }
}

export async function pickImageFromLibrary(options = {}, type = 'profile') {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow access to your photo library.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.aspect || [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return uploadToServer(result.assets[0].uri, type);
}

export async function pickImageFromCamera(options = {}, type = 'profile') {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow camera access.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: options.aspect || [4, 3],
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return uploadToServer(result.assets[0].uri, type);
}

// Pick multiple images locally (no upload) — returns local URIs
export async function pickMultipleImagesLocal() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow access to your photo library.');
    return { uris: [], error: 'Permission denied' };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 6,
  });
  if (result.canceled) return { uris: [], cancelled: true };
  return { uris: result.assets.map(a => a.uri) };
}

// Pick single image from camera locally (no upload)
export async function pickImageFromCameraLocal(options = {}) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow camera access.');
    return { error: 'Permission denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: options.aspect || [4, 3],
    quality: 0.8,
  });
  if (result.canceled) return { cancelled: true };
  return { uri: result.assets[0].uri };
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
  Alert.alert('Upload Photo', 'Choose a source', [
    { text: 'Camera',        onPress: async () => onResult(await pickImageFromCamera({}, type)) },
    { text: 'Photo Library', onPress: async () => onResult(await pickImageFromLibrary({}, type)) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
