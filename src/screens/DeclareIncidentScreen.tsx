import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Alert, Image, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { TypeUrgence, regionToEnum, apiCreateIncidentWithMedia, SignalementRequest } from '../services/api';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeclareIncident'>;
};

type Country = { code: string; dial: string; flag: string; name: string };

const COUNTRIES: Country[] = [
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: 'TD', dial: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: 'CF', dial: '+236', flag: '🇨🇫', name: 'Centrafrique' },
  { code: 'GQ', dial: '+240', flag: '🇬🇶', name: 'Guinée Équatoriale' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'États-Unis' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Allemagne' },
];

const TOTAL_STEPS = 3;

// Composant cercle de progression
function CircularProgress({ step, total, color, trackColor, size = 48 }: { step: number; total: number; color: string; trackColor: string; size?: number }) {
  // Simule un anneau de progression avec 4 quadrants
  const progress = step / total;
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: r,
        borderWidth: 3, borderColor: trackColor,
      }} />
      {/* Progress ring - on utilise des bordures partielles */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: r,
        borderWidth: 3, borderColor: 'transparent',
        borderTopColor: progress >= 0.25 ? color : 'transparent',
        borderRightColor: progress >= 0.5 ? color : 'transparent',
        borderBottomColor: progress >= 0.75 ? color : 'transparent',
        borderLeftColor: progress >= 1 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {/* Si pas complet, on ajoute un segment partiel */}
      {progress > 0 && progress < 0.25 && (
        <View style={{
          position: 'absolute', width: size, height: size, borderRadius: r,
          borderWidth: 3, borderColor: 'transparent', borderTopColor: color,
          transform: [{ rotate: '-90deg' }],
        }} />
      )}
      {/* Texte central */}
      <Text style={{ fontSize: 14, fontWeight: '800', color }}>{step}/{total}</Text>
    </View>
  );
}

export default function DeclareIncidentScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const INCIDENT_TYPES: { value: TypeUrgence; label: string; icon: string; color: string }[] = [
    { value: 'INCENDIE', label: t('incident_type_fire'), icon: 'flame', color: '#EF4444' },
    { value: 'AGRESSION', label: t('incident_type_assault'), icon: 'hand-left', color: '#F97316' },
    { value: 'ACCIDENT_ROUTE', label: t('incident_type_road'), icon: 'car', color: '#EAB308' },
    { value: 'URGENCE_MEDICALE', label: t('incident_type_medical'), icon: 'medkit', color: '#EC4899' },
    { value: 'CATASTROPHE_NATURELLE', label: t('incident_type_natural'), icon: 'thunderstorm', color: '#6366F1' },
    { value: 'AUTRE', label: t('incident_type_other'), icon: 'ellipsis-horizontal-circle', color: '#64748B' },
  ];

  const STEP_TITLES = [
    t('incident_type_title'),
    t('incident_location_title'),
    t('incident_summary_title'),
  ];
  const STEP_NEXTS = [
    t('incident_step_location'),
    t('incident_step_summary'),
    '',
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<TypeUrgence | null>(null);
  const [description, setDescription] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [useGPS, setUseGPS] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; address?: string; city?: string; region?: string } | null>(null);
  const [ville, setVille] = useState('');
  const [quartier, setQuartier] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' });
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const micPulse = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 24 }, () => new Animated.Value(0.2))).current;

  // Auto-fetch GPS quand on arrive sur le step 2
  useEffect(() => {
    if (currentStep === 2 && useGPS && !gpsLocation && !loadingLocation) {
      getGPSLocation();
    }
  }, [currentStep]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])).start();
      waveAnims.forEach((anim) => {
        const run = () => {
          Animated.sequence([
            Animated.timing(anim, { toValue: Math.random() * 0.8 + 0.2, duration: 150 + Math.random() * 250, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.15, duration: 150 + Math.random() * 250, useNativeDriver: true }),
          ]).start(() => { if (isRecording) run(); });
        };
        run();
      });
    } else {
      micPulse.setValue(1);
      waveAnims.forEach((a) => a.setValue(0.2));
    }
  }, [isRecording]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert(t('permission_required'), t('mic_permission')); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = rec;
      setRecording(rec); setIsRecording(true); setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((p) => {
        if (p + 1 >= 60) {
          // Auto-stop à 60s via ref pour éviter problème de closure
          if (timerRef.current) clearInterval(timerRef.current);
          const r = recordingRef.current;
          if (r) {
            r.stopAndUnloadAsync().then(() => {
              setAudioUri(r.getURI());
              setRecording(null);
              recordingRef.current = null;
            }).catch(() => {});
          }
          setIsRecording(false);
          return 60;
        }
        return p + 1;
      }), 1000);
    } catch { Alert.alert(t('error'), 'Recording error'); }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try { await rec.stopAndUnloadAsync(); setAudioUri(rec.getURI()); setRecording(null); recordingRef.current = null; }
    catch { Alert.alert(t('error'), 'Stop error'); }
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch {
      setIsPlaying(false);
    }
  };

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('permission_required'), t('camera_permission')); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) setSelfie(result.assets[0].uri);
  };

  const getGPSLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied'), t('incident_location_denied'));
        setUseGPS(false);
        setLoadingLocation(false);
        return;
      }

      const isWeb = Platform.OS === 'web';
      let loc: { coords: { latitude: number; longitude: number } } | null = null;

      if (isWeb) {
        // Web : utiliser l'API native du navigateur avec timeout
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            });
          });
          loc = { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } };
        } catch {
          // Si le navigateur refuse aussi, passer en mode manuel
          throw new Error('location_unavailable');
        }
      } else {
        // Mobile : expo-location haute précision
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
          });
        } catch {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown) {
            loc = lastKnown;
          } else {
            throw new Error('location_unavailable');
          }
        }
      }

      if (!loc) throw new Error('location_unavailable');

      // Reverse geocoding (peut échouer sur web)
      let city = '';
      let region = '';
      let address = '';
      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addr) {
          city = addr.city || addr.subregion || '';
          region = addr.region || '';
          const name = addr.name || '';
          const street = addr.street || '';
          const streetNumber = addr.streetNumber || '';
          const subregion = addr.subregion || '';
          const isJustNumber = (s: string) => /^\d+$/.test(s.trim());
          const quartierName = (!isJustNumber(name) ? name : '') || (!isJustNumber(street) ? street : '');
          const streetFull = streetNumber && quartierName ? `${streetNumber} ${quartierName}` : quartierName;
          const parts = [streetFull, subregion !== city ? subregion : '', city, region].filter(Boolean);
          const uniqueParts = parts.filter((v, i) => parts.indexOf(v) === i);
          address = uniqueParts.join(', ');
        }
      } catch {
        // Expo reverse geocoding indisponible
      }

      // Fallback : Nominatim (OpenStreetMap) si l'adresse est vide
      if (!address) {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json&accept-language=fr`,
            { headers: { 'User-Agent': '237Urgences/1.0' } }
          );
          const data = await resp.json();
          if (data?.address) {
            const a = data.address;
            const quartierNom = a.suburb || a.neighbourhood || a.hamlet || a.village || '';
            city = a.city || a.town || a.village || city;
            region = a.state || region;
            const road = a.road || '';
            const addrParts = [road, quartierNom, city, region].filter(Boolean);
            address = addrParts.filter((v: string, i: number) => addrParts.indexOf(v) === i).join(', ');
          }
        } catch {
          // Nominatim aussi indisponible
        }
      }

      setGpsLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: address || undefined,
        city,
        region,
      });
      setLocationFetched(true);
    } catch {
      if (Platform.OS === 'web') {
        Alert.alert(t('incident_loc_web_title'), t('incident_loc_web_msg'));
      } else {
        Alert.alert(t('error'), t('incident_location_error'));
      }
      setUseGPS(false);
    }
    setLoadingLocation(false);
  };

  const canGoNext = () => {
    if (currentStep === 1) return selectedType !== null && description.trim().length >= 3 && selfie !== null;
    if (currentStep === 2) return (useGPS ? gpsLocation !== null : (ville.trim() && quartier.trim()));
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2 && useGPS && !gpsLocation) { getGPSLocation(); return; }
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const locationCity = useGPS ? (gpsLocation?.city || '') : ville;
      const locationRegion = useGPS ? regionToEnum(gpsLocation?.region || '') : regionToEnum(ville);
      const locationQuartier = useGPS ? (gpsLocation?.address || '') : quartier;
      const lat = gpsLocation?.latitude || 0;
      const lon = gpsLocation?.longitude || 0;
      const fullContactPhone = contactPhone ? `${selectedCountry.dial}${contactPhone.replace(/\s/g, '')}` : (user?.telephone || '');

      const signalement: SignalementRequest = {
        typeUrgence: selectedType!,
        description,
        telephoneContact: fullContactPhone,
        region: locationRegion,
        ville: locationCity,
        latitude: lat,
        longitude: lon,
        quartier: locationQuartier || undefined,
        estTemoin: true,
      };

      // Photos (selfie)
      const photos: { uri: string; name: string; type: string }[] = [];
      if (selfie) {
        photos.push({
          uri: selfie,
          name: `selfie_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      // Audio (optionnel)
      let audio: { uri: string; name: string; type: string } | undefined;
      if (audioUri) {
        audio = {
          uri: audioUri,
          name: `audio_${Date.now()}.m4a`,
          type: 'audio/mp4',
        };
      }

      const result = await apiCreateIncidentWithMedia(signalement, photos, audio);

      if (result.success && result.data) {
        navigation.replace('IncidentConfirmation', { reference: result.data.reference });
      } else {
        const msg = result.message || t('error');
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert(t('error'), msg);
        }
      }
    } catch (e) {
      console.error('Submit error:', e);
      if (Platform.OS === 'web') {
        window.alert(t('error'));
      } else {
        Alert.alert(t('error'), t('incident_submit_error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== STEP 1 =====================
  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

      {/* Types - cards liste */}
      <Text style={[styles.fieldTitle, { color: colors.text }]}>{t('incident_type_label')}</Text>
      <View style={styles.typesList}>
        {INCIDENT_TYPES.map((type) => {
          const sel = selectedType === type.value;
          return (
            <TouchableOpacity key={type.value}
              style={[styles.typeCard, {
                backgroundColor: sel ? (isDark ? type.color + '18' : type.color + '0C') : colors.card,
                borderColor: sel ? type.color : colors.border,
                shadowColor: colors.shadowColor,
              }]}
              onPress={() => setSelectedType(type.value)} activeOpacity={0.7}>
              <View style={[styles.typeIcon, { backgroundColor: sel ? type.color : type.color + '15' }]}>
                <Ionicons name={type.icon as any} size={18} color={sel ? '#FFF' : type.color} />
              </View>
              <Text style={[styles.typeLabel, { color: sel ? type.color : colors.text }]}>{type.label}</Text>
              {sel ? (
                <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              ) : (
                <View style={[styles.typeRadio, { borderColor: colors.border }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Description */}
      <Text style={[styles.fieldTitle, { color: colors.text }]}>{t('incident_desc_title')}</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder={t('incident_desc_placeholder')}
        placeholderTextColor={colors.textMuted}
        multiline value={description} onChangeText={setDescription} textAlignVertical="top"
      />

      {/* Voice */}
      <Text style={[styles.fieldTitle, { color: colors.text }]}>{t('incident_voice_title')}</Text>
      {!audioUri ? (
        <View style={[styles.voiceCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <Animated.View style={{ transform: [{ scale: isRecording ? micPulse : 1 }] }}>
            <TouchableOpacity
              style={[styles.micCircle, { backgroundColor: isRecording ? colors.danger : isDark ? '#1A1A1A' : '#F1F5F9' }]}
              onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.7}>
              {isRecording && <View style={[styles.micRing, { borderColor: colors.danger + '25' }]} />}
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color={isRecording ? '#FFF' : colors.accent} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.micTimer, { color: isRecording ? colors.danger : colors.textMuted }]}>
            {isRecording ? formatDuration(recordingDuration) : t('incident_voice_tap')}
          </Text>
          {isRecording && (
            <View style={styles.waveRow}>
              {waveAnims.map((a, i) => (
                <Animated.View key={i} style={[styles.waveBar, { backgroundColor: i % 2 === 0 ? colors.accent : colors.accent + '60', transform: [{ scaleY: a }] }]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.doneRow, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
          <TouchableOpacity onPress={playAudio} activeOpacity={0.7}>
            <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.doneText, { color: colors.success, flex: 1 }]}>
            {isPlaying ? t('incident_voice_playing') || 'Lecture...' : `${t('incident_voice_done')} (${formatDuration(recordingDuration)})`}
          </Text>
          <TouchableOpacity onPress={() => { if (soundRef.current) { soundRef.current.unloadAsync(); soundRef.current = null; setIsPlaying(false); } setAudioUri(null); setRecordingDuration(0); }}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selfie */}
      <Text style={[styles.fieldTitle, { color: colors.text }]}>{t('incident_selfie_title')}</Text>
      <Text style={[styles.fieldHint, { color: colors.textMuted }]}>{t('incident_selfie_hint')}</Text>
      {!selfie ? (
        <TouchableOpacity
          style={[styles.selfieZone, { backgroundColor: colors.card, borderColor: colors.accent + '30' }]}
          onPress={takeSelfie} activeOpacity={0.7}>
          <View style={styles.selfieIconStack}>
            <View style={[styles.selfieIconOuter, { backgroundColor: colors.accentLight }]}>
              <View style={[styles.selfieIconInner, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="camera" size={28} color={colors.accent} />
              </View>
            </View>
            <View style={[styles.selfieBadgeIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={10} color="#FFF" />
            </View>
          </View>
          <Text style={[styles.selfieMainText, { color: colors.text }]}>{t('incident_selfie_take')}</Text>
          <Text style={[styles.selfieSubText, { color: colors.textMuted }]}>{t('incident_selfie_front')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.selfieResult}>
          <Image source={{ uri: selfie }} style={styles.selfieImg} />
          <TouchableOpacity style={styles.selfieRedo} onPress={takeSelfie} activeOpacity={0.7}>
            <Ionicons name="camera-reverse-outline" size={18} color="#FFF" />
            <Text style={styles.selfieRedoText}>{t('incident_selfie_redo')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );

  // ===================== STEP 2 =====================
  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

      {/* ===== LOCALISATION ===== */}
      <View style={styles.sectionRow}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.accentLight }]}>
          <Ionicons name="location" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.fieldTitle, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>{t('incident_loc_section')}</Text>
      </View>


      {/* Toggle GPS / Manuel */}
      <View style={[styles.locToggle, { backgroundColor: isDark ? '#111111' : '#F1F5F9', borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.locToggleBtn, useGPS && { backgroundColor: colors.accent }]}
          onPress={() => { setUseGPS(true); if (!gpsLocation && !loadingLocation) getGPSLocation(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={16} color={useGPS ? '#FFF' : colors.textSecondary} />
          <Text style={[styles.locToggleText, { color: useGPS ? '#FFF' : colors.textSecondary }]}>GPS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locToggleBtn, !useGPS && { backgroundColor: colors.warning }]}
          onPress={() => setUseGPS(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={16} color={!useGPS ? '#FFF' : colors.textSecondary} />
          <Text style={[styles.locToggleText, { color: !useGPS ? '#FFF' : colors.textSecondary }]}>Manuel</Text>
        </TouchableOpacity>
      </View>

      {/* GPS - Loading */}
      {useGPS && loadingLocation && (
        <View style={[styles.locCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.locCardCenter}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.locCardLoadText, { color: colors.textSecondary }]}>
              {t('incident_loc_searching')}
            </Text>
            <Text style={[styles.locCardSubText, { color: colors.textMuted }]}>
              {t('incident_loc_wait')}
            </Text>
          </View>
        </View>
      )}

      {/* GPS - Position trouvée */}
      {useGPS && gpsLocation && !loadingLocation && (
        <View style={[styles.locCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          {/* Mini carte stylisée */}
          <View style={[styles.mapPreview, { backgroundColor: isDark ? '#0D1A2D' : '#E8F0FE' }]}>
            <View style={[styles.mapGrid]}>
              {[0, 1, 2].map((r) => (
                <View key={r} style={styles.mapGridRow}>
                  {[0, 1, 2, 3].map((c) => (
                    <View key={c} style={[styles.mapGridCell, { borderColor: isDark ? '#1A2A3D' : '#C8D8F0' }]} />
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.mapPinContainer}>
              <View style={[styles.mapPinShadow, { backgroundColor: colors.accent + '20' }]} />
              <View style={[styles.mapPin, { backgroundColor: colors.accent }]}>
                <Ionicons name="location" size={18} color="#FFF" />
              </View>
            </View>
          </View>

          {/* Détails position */}
          <View style={styles.locDetails}>
            <View style={styles.locDetailRow}>
              <View style={[styles.locDetailIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locDetailLabel, { color: colors.textMuted }]}>{t('incident_loc_address')}</Text>
                <Text style={[styles.locDetailValue, { color: colors.text }]}>
                  {gpsLocation.address || t('incident_loc_detected')}
                </Text>
              </View>
            </View>

            {(gpsLocation.city || gpsLocation.region) && (
              <View style={styles.locDetailRow}>
                <View style={[styles.locDetailIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="business" size={16} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locDetailLabel, { color: colors.textMuted }]}>{t('incident_loc_city_region')}</Text>
                  <Text style={[styles.locDetailValue, { color: colors.text }]}>
                    {[gpsLocation.city, gpsLocation.region].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.locDetailRow}>
              <View style={[styles.locDetailIcon, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                <Ionicons name="compass" size={16} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locDetailLabel, { color: colors.textMuted }]}>{t('incident_loc_coords')}</Text>
                <Text style={[styles.locDetailValue, { color: colors.text }]}>
                  {gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </View>

          {/* Refresh */}
          <TouchableOpacity
            style={[styles.locRefresh, { borderTopColor: colors.borderLight }]}
            onPress={getGPSLocation} activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={colors.accent} />
            <Text style={[styles.locRefreshText, { color: colors.accent }]}>{t('incident_loc_refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* GPS - pas encore de position et pas en cours */}
      {useGPS && !gpsLocation && !loadingLocation && (
        <TouchableOpacity
          style={[styles.locCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={getGPSLocation} activeOpacity={0.7}
        >
          <View style={styles.locCardCenter}>
            <View style={[styles.locRetryIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="locate" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.locCardLoadText, { color: colors.text }]}>
              {t('incident_loc_tap')}
            </Text>
            <Text style={[styles.locCardSubText, { color: colors.textMuted }]}>
              {t('incident_loc_need')}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Manuel */}
      {!useGPS && (
        <View style={{ gap: 10, marginTop: 4 }}>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name="business-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
            <TextInput
              style={[styles.inputFlat, { color: colors.text }]}
              placeholder={t('incident_city_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={ville} onChangeText={setVille}
            />
          </View>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name="map-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
            <TextInput
              style={[styles.inputFlat, { color: colors.text }]}
              placeholder={t('incident_quarter_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={quartier} onChangeText={setQuartier}
            />
          </View>
        </View>
      )}

      {/* ===== SÉPARATEUR ===== */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ===== CONTACT ===== */}
      <View style={styles.sectionRow}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.successLight }]}>
          <Ionicons name="call" size={18} color={colors.success} />
        </View>
        <Text style={[styles.fieldTitle, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>{t('incident_contact_section')}</Text>
      </View>

      {/* Nom */}
      <View style={[styles.inputWithIcon, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
        <TextInput
          style={[styles.inputFlat, { color: colors.text }]}
          placeholder={t('incident_contact_name_placeholder')}
          placeholderTextColor={colors.textMuted}
          value={contactName} onChangeText={setContactName}
        />
      </View>

      {/* Téléphone avec country picker dropdown */}
      <View style={{ position: 'relative', zIndex: 10 }}>
        <View style={[styles.phoneRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <TouchableOpacity
            style={[styles.phonePrefix, { borderRightColor: colors.border, backgroundColor: isDark ? '#111111' : '#F1F5F9' }]}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedCountry.dial}</Text>
            <Ionicons name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={12} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={[styles.phoneInput, { color: colors.text }]}
            placeholder="6XX XXX XXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={15}
            value={contactPhone}
            onChangeText={setContactPhone}
          />
        </View>

        {/* Dropdown pays */}
        {showCountryPicker && (
          <View style={[styles.countryDropdown, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator nestedScrollEnabled>
              {COUNTRIES.map((item) => {
                const isSel = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.countryRow, {
                      backgroundColor: isSel ? colors.accentLight : 'transparent',
                    }]}
                    onPress={() => { setSelectedCountry(item); setShowCountryPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 18 }}>{item.flag}</Text>
                    <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.countryDial, { color: colors.textMuted }]}>{item.dial}</Text>
                    {isSel && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ===================== STEP 3 =====================
  const renderStep3 = () => {
    const typeInfo = INCIDENT_TYPES.find((x) => x.value === selectedType);
    const locationVal = useGPS
      ? (gpsLocation?.address || `${gpsLocation?.latitude.toFixed(4)}, ${gpsLocation?.longitude.toFixed(4)}`)
      : `${quartier}, ${ville}`;

    return (
      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

        {/* ===== FICHE INCIDENT ===== */}
        <View style={[styles.ficheCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>

          {/* Barre tricolore */}
          <View style={styles.ficheTricolor}>
            <View style={[styles.ficheTri, { backgroundColor: '#009639' }]} />
            <View style={[styles.ficheTri, { backgroundColor: '#CE1126' }]} />
            <View style={[styles.ficheTri, { backgroundColor: '#FCBF49' }]} />
          </View>

          {/* En-tête fiche : photo + identité */}
          <View style={[styles.ficheHeader, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4FF' }]}>
            {selfie && (
              <Image source={{ uri: selfie }} style={styles.ficheAvatar} />
            )}
            <View style={styles.ficheIdentity}>
              <Text style={[styles.ficheName, { color: colors.text }]}>
                {user ? `${user.prenom} ${user.nom}` : t('summary_declarant')}
              </Text>
              <Text style={[styles.fichePhone, { color: colors.textSecondary }]}>
                {user?.telephone || ''}
              </Text>
            </View>
            <View style={[styles.ficheBadge, { backgroundColor: typeInfo?.color || colors.accent }]}>
              <Ionicons name={(typeInfo?.icon || 'alert') as any} size={18} color="#FFF" />
            </View>
          </View>

          {/* Type d'incident - en vedette */}
          <View style={[styles.ficheTypeRow, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.ficheTypeIcon, { backgroundColor: (typeInfo?.color || colors.accent) + '15' }]}>
              <Ionicons name={(typeInfo?.icon || 'alert') as any} size={20} color={typeInfo?.color || colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ficheLabel, { color: colors.textMuted }]}>{t('summary_type_label')}</Text>
              <Text style={[styles.ficheTypeText, { color: typeInfo?.color || colors.accent }]}>
                {typeInfo?.label || ''}
              </Text>
            </View>
          </View>

          {/* Grille infos */}
          <View style={styles.ficheGrid}>

            {/* Description */}
            <View style={[styles.ficheItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.ficheItemHeader}>
                <Ionicons name="document-text" size={14} color={colors.accent} />
                <Text style={[styles.ficheLabel, { color: colors.textMuted }]}>{t('summary_description')}</Text>
              </View>
              <Text style={[styles.ficheValue, { color: colors.text }]} numberOfLines={3}>
                {description}
              </Text>
            </View>

            {/* Audio */}
            {audioUri && (
              <View style={[styles.ficheItem, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.ficheItemHeader}>
                  <Ionicons name="mic" size={14} color="#8B5CF6" />
                  <Text style={[styles.ficheLabel, { color: colors.textMuted }]}>{t('summary_voice')}</Text>
                </View>
                <View style={styles.ficheAudioRow}>
                  <View style={[styles.ficheAudioDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={[styles.ficheValue, { color: colors.text }]}>
                    {t('summary_voice_recording')} - {formatDuration(recordingDuration)}
                  </Text>
                </View>
              </View>
            )}

            {/* Localisation */}
            <View style={[styles.ficheItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.ficheItemHeader}>
                <Ionicons name="location" size={14} color={colors.danger} />
                <Text style={[styles.ficheLabel, { color: colors.textMuted }]}>{t('summary_location')}</Text>
              </View>
              <Text style={[styles.ficheValue, { color: colors.text }]}>
                {locationVal}
              </Text>
              {useGPS && gpsLocation && (
                <Text style={[styles.ficheCoords, { color: colors.textMuted }]}>
                  {gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}
                </Text>
              )}
            </View>

            {/* Contact */}
            <View style={styles.ficheItem}>
              <View style={styles.ficheItemHeader}>
                <Ionicons name="call" size={14} color={colors.success} />
                <Text style={[styles.ficheLabel, { color: colors.textMuted }]}>{t('summary_contact')}</Text>
              </View>
              <Text style={[styles.ficheValue, { color: colors.text }]}>
                {contactName || '-'}
              </Text>
              <Text style={[styles.ficheCoords, { color: colors.textSecondary }]}>
                {contactPhone ? `${selectedCountry.flag} ${selectedCountry.dial} ${contactPhone}` : '-'}
              </Text>
            </View>
          </View>

          {/* Footer fiche */}
          <View style={[styles.ficheFooter, { backgroundColor: isDark ? '#0A0F1A' : '#F8FAFC', borderTopColor: colors.borderLight }]}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={[styles.ficheFooterText, { color: colors.textMuted }]}>
              {t('summary_footer')}
            </Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* ===== HEADER avec fond différent + arrondis ===== */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(91,155,243,0.05)' : 'rgba(59,111,224,0.06)' }]} />
        <View style={styles.headerRow}>
          <CircularProgress
            step={currentStep}
            total={TOTAL_STEPS}
            color={colors.accent}
            trackColor={isDark ? '#222222' : '#D6E0F0'}
          />
          <View style={styles.headerTexts}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{STEP_TITLES[currentStep - 1]}</Text>
            {STEP_NEXTS[currentStep - 1] ? (
              <Text style={[styles.headerNext, { color: colors.textMuted }]}>Suivant: {STEP_NEXTS[currentStep - 1]}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== CONTENT ===== */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      {/* ===== BOTTOM : Back + Next ===== */}
      <View style={[styles.bottom, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btnBack, { borderColor: colors.border }]}
          onPress={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={[styles.btnBackText, { color: colors.text }]}>
            {currentStep > 1 ? t('incident_back') : t('incident_cancel')}
          </Text>
        </TouchableOpacity>

        {currentStep < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[styles.btnNext, { backgroundColor: canGoNext() ? colors.accent : isDark ? '#1A1A1A' : '#E2E8F0' }]}
            onPress={handleNext} disabled={!canGoNext()} activeOpacity={0.85}>
            <Text style={[styles.btnNextText, { color: canGoNext() ? '#FFF' : colors.textMuted }]}>
              {t('incident_next')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={canGoNext() ? '#FFF' : colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnSend, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.btnSendText}>{t('incident_sending') || 'Envoi...'}</Text>
              </>
            ) : (
              <>
                <View style={styles.btnSendIcon}>
                  <Ionicons name="paper-plane" size={18} color="#FFF" />
                </View>
                <Text style={styles.btnSendText}>{t('incident_send')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ===== HEADER =====
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    top: -40, right: -30,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerTexts: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerNext: { fontSize: 12, marginTop: 1 },

  // ===== FORM =====
  formContent: { paddingHorizontal: 20, paddingTop: 10 },
  fieldTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 18 },
  fieldHint: { fontSize: 12, marginTop: -6, marginBottom: 10 },

  // Types list
  typesList: { gap: 8 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  typeIcon: {
    width: 42, height: 42, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  typeLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  typeCheck: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  typeRadio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2,
  },

  // Text area
  textArea: {
    borderWidth: 1, borderRadius: 16, padding: 16,
    fontSize: 15, minHeight: 110, textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 15, marginBottom: 10,
  },

  // Voice
  voiceCard: {
    borderRadius: 20, borderWidth: 1, paddingVertical: 24, paddingHorizontal: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  micCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  micRing: {
    position: 'absolute', width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, top: -8, left: -8,
  },
  micTimer: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  waveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 14, height: 32,
  },
  waveBar: { width: 3, height: 32, borderRadius: 1.5 },

  doneRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  doneText: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Selfie
  selfieZone: {
    borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
    paddingVertical: 24, alignItems: 'center',
  },
  selfieIconStack: {
    position: 'relative', marginBottom: 12,
  },
  selfieIconOuter: {
    width: 68, height: 68, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  selfieIconInner: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  selfieBadgeIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  selfieMainText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  selfieSubText: { fontSize: 12 },
  selfieResult: {
    alignSelf: 'center', alignItems: 'center',
  },
  selfieImg: {
    width: 110, height: 110, borderRadius: 55, marginBottom: 10,
  },
  selfieRedo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  selfieRedoText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Section row
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 18, marginBottom: 12,
  },
  sectionIcon: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Location toggle
  locToggle: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 12,
  },
  locToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
  },
  locToggleText: { fontSize: 14, fontWeight: '700' },

  // Location card
  locCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 6,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  locCardCenter: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  locCardLoadText: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  locCardSubText: { fontSize: 13, marginTop: 4 },
  locRetryIcon: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  // Map preview
  mapPreview: {
    height: 110, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  mapGrid: { position: 'absolute', width: '100%', height: '100%' },
  mapGridRow: { flex: 1, flexDirection: 'row' },
  mapGridCell: { flex: 1, borderWidth: 0.5 },
  mapPinContainer: { alignItems: 'center' },
  mapPinShadow: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20, top: 6,
  },
  mapPin: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },

  // Location details
  locDetails: { paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  locDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locDetailIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  locDetailLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  locDetailValue: { fontSize: 14, fontWeight: '600' },
  locRefresh: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderTopWidth: 1,
  },
  locRefreshText: { fontSize: 13, fontWeight: '600' },

  // Input with icon
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10,
  },
  inputFlat: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 15,
  },

  divider: { height: 1, marginVertical: 12 },

  // Phone
  phoneRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  phonePrefix: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1 },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },

  // Country picker dropdown
  countryDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    borderRadius: 14, borderWidth: 1, marginTop: 4,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    zIndex: 100,
  },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  countryName: { flex: 1, fontSize: 14, fontWeight: '500' },
  countryDial: { fontSize: 14, fontWeight: '600' },

  // ===== FICHE PROFESSIONNELLE =====
  ficheCard: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginTop: 6,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 8,
  },
  ficheTricolor: { flexDirection: 'row', height: 5 },
  ficheTri: { flex: 1 },

  ficheHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 22, paddingVertical: 22,
  },
  ficheAvatar: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 3, borderColor: '#FFF',
  },
  ficheIdentity: { flex: 1 },
  ficheName: { fontSize: 20, fontWeight: '800' },
  fichePhone: { fontSize: 14, marginTop: 4 },
  ficheBadge: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },

  ficheTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 22, paddingVertical: 20, borderBottomWidth: 1,
  },
  ficheTypeIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  ficheTypeText: { fontSize: 18, fontWeight: '800' },

  ficheGrid: { paddingHorizontal: 22 },
  ficheItem: { paddingVertical: 18, borderBottomWidth: 1 },
  ficheItemHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  ficheLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },
  ficheValue: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  ficheCoords: { fontSize: 13, marginTop: 3 },
  ficheAudioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ficheAudioDot: { width: 10, height: 10, borderRadius: 5 },

  ficheFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderTopWidth: 1,
  },
  ficheFooterText: { fontSize: 13, fontWeight: '600' },

  // Bottom
  bottom: {
    flexDirection: 'row', padding: 18, paddingBottom: 34, borderTopWidth: 1, gap: 12,
  },
  btnBack: {
    paddingHorizontal: 22, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  btnBackText: { fontSize: 15, fontWeight: '600' },
  btnNext: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 8,
  },
  btnNextText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnSend: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 10,
    backgroundColor: '#CE1126',
    shadowColor: '#CE1126', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  btnSendIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  btnSendText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
