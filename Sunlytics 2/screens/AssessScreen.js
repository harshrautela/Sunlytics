// AssessScreen.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Linking,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';

/**
 * Google key is supported but NOT used by default to avoid billing.
 * If you explicitly want Google geocoding, set PREFER_GOOGLE=true.
 */
const GOOGLE_MAPS_API_KEY = ''; // <-- you said you don't want to pay; leave empty
const PREFER_GOOGLE = false; // set true only if you want to use Google (may incur billing)

/* ---------------- SUGGESTIONS ---------------- */
const SUGGESTED_APPLIANCES = [
  { name: 'Air Conditioner', power: 1500 },
  { name: 'Refrigerator', power: 150 },
  { name: 'LED TV', power: 120 },
  { name: 'Washing Machine', power: 500 },
  { name: 'Ceiling Fan', power: 75 },
  { name: 'Laptop', power: 90 },
];

const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const SHADING_SUB = { None: 'Full sun', Partial: 'Some shade', Heavy: 'Mostly shade' };
const UNITS = ['sq ft', 'sq m', 'm²', 'sq yards'];

// Status bar top offset (safe spacing for the top card)
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

export default function AssessScreen() {
  const [step, setStep] = useState(1);

  const [search, setSearch] = useState('');
  const [showBottomNav, setShowBottomNav] = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;

  /* -------- STEP 1 DATA -------- */
  const [appliances, setAppliances] = useState([
    { id: 1, name: 'Air Conditioner', power: '1500', count: 2, hours: 6, custom: false },
    { id: 2, name: 'Refrigerator', power: '150', count: 1, hours: 24, custom: false },
    { id: 3, name: 'LED TV', power: '120', count: 1, hours: 5, custom: false },
  ]);

  /* -------- STEP 2 DATA -------- */
  const [roofArea, setRoofArea] = useState('650');
  const [orientation, setOrientation] = useState('S');
  const [shading, setShading] = useState('None');
  const [areaUnitIndex, setAreaUnitIndex] = useState(0); // index in UNITS

  /* -------- STEP 3 DATA (Location & Preferences) -------- */
  const [location, setLocation] = useState('Mumbai, Maharashtra'); // default/example
  const [gridConnection, setGridConnection] = useState(true);
  const [batteryBackup, setBatteryBackup] = useState(true);
  const [budgetRange, setBudgetRange] = useState('Standard'); // Low, Standard, Premium

  /* place picker modal state */
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [PlacesComponent, setPlacesComponent] = useState(null);

  // Map picker state
  const [showMapPicker, setShowMapPicker] = useState(false);
  // selectedCoords is the map center coordinates user is choosing
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef(null);

  // debounce timer ref to avoid multiple reverse geocode calls while panning
  const reverseGeoTimerRef = useRef(null);

  /* ---------------- Step 4 UI expansion state ---------------- */
  const [expandAppliances, setExpandAppliances] = useState(false);
  const [expandRooftop, setExpandRooftop] = useState(false);
  const [expandLocationPrefs, setExpandLocationPrefs] = useState(false);

  /* ---------------- TOTAL USAGE ---------------- */
  const totalDailyUsage = useMemo(() => {
    return appliances.reduce((sum, a) => {
      const power = Number(a.power) || 0;
      return sum + (power * a.count * a.hours) / 1000;
    }, 0);
  }, [appliances]);

  /* ---------------- ANIMATION ---------------- */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showBottomNav ? 0 : 80,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [showBottomNav]);

  /* ---------------- HELPERS (STEP 1) ---------------- */
  const updateField = (id, key, delta) => {
    setAppliances(prev =>
      prev.map(a =>
        a.id === id ? { ...a, [key]: Math.max(0, a[key] + delta) } : a
      )
    );
  };

  const updatePower = (id, value) => {
    setAppliances(prev =>
      prev.map(a =>
        a.id === id ? { ...a, power: value.replace(/[^0-9]/g, '') } : a
      )
    );
  };

  const updateName = (id, value) => {
    setAppliances(prev =>
      prev.map(a => (a.id === id ? { ...a, name: value } : a))
    );
  };

  const removeAppliance = id => {
    setAppliances(prev => prev.filter(a => a.id !== id));
  };

  const addFromSearch = item => {
    setAppliances(prev => [
      ...prev,
      {
        id: Date.now(),
        name: item.name,
        power: String(item.power),
        count: 1,
        hours: 1,
        custom: false,
      },
    ]);
    setSearch('');
  };

  const addCustomAppliance = () => {
    setAppliances(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        power: '',
        count: 1,
        hours: 1,
        custom: true,
      },
    ]);
  };

  /* ---------------- helper to compute compass positions ---------------- */
  const computePositions = (size, btnSize) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.36;
    // order in ORIENTATIONS: N, NE, E, SE, S, SW, W, NW
    const angleMap = {
      N: -90,
      NE: -45,
      E: 0,
      SE: 45,
      S: 90,
      SW: 135,
      W: 180,
      NW: -135,
    };
    return ORIENTATIONS.map(o => {
      const deg = angleMap[o];
      const rad = (deg * Math.PI) / 180;
      const left = cx + radius * Math.cos(rad) - btnSize / 2;
      const top = cy + radius * Math.sin(rad) - btnSize / 2;
      return { o, left, top };
    });
  };

  const cycleAreaUnit = () => {
    setAreaUnitIndex(prev => (prev + 1) % UNITS.length);
  };

  /* ---------------- Step 3 helpers: open Google Maps ---------------- */
  const openGoogleMaps = () => {
    const query = location ? encodeURIComponent(location) : '';
    const url = query
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : 'https://www.google.com/maps';
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL('https://www.google.com/maps');
        }
      })
      .catch(err => {
        console.warn('openGoogleMaps err', err);
      });
  };

  /**
   * onPickOnMapPress:
   * - requests location permission,
   * - obtains current position,
   * - opens our in-app map picker modal with the user's location centered.
   * Uses center-crosshair + pan to select (faster & more accurate).
   */
  const onPickOnMapPress = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to pick a location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      // set initial coords quickly
      setSelectedCoords(coords);
      // run reverse-geocode (background)
      reverseGeocodeAndSetLocation(coords);
      setShowMapPicker(true);
    } catch (err) {
      console.warn('onPickOnMapPress err', err);
      Alert.alert('Error', 'Unable to access location. Opening Google Maps instead.', [
        { text: 'Open Maps', onPress: () => openGoogleMaps() },
      ]);
    }
  };

  /**
   * Try to dynamically load the react-native-google-places-autocomplete component.
   * If available and the API key is set, show modal; otherwise fall back and alert.
   */
  const onPickOnMapPressLegacy = () => {
    // if user didn't set API key, fallback
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert(
        'Pick on map (fallback)',
        'To pick location directly inside the app install the optional package and set GOOGLE_MAPS_API_KEY.\n\nFor now the app will open Google Maps.',
        [{ text: 'OK', onPress: () => openGoogleMaps() }]
      );
      return;
    }

    try {
      // dynamic require - prevents bundling error if package is missing at dev-time
      const PlacesMod = require('react-native-google-places-autocomplete');
      if (PlacesMod && PlacesMod.GooglePlacesAutocomplete) {
        setPlacesComponent(() => PlacesMod.GooglePlacesAutocomplete);
        setShowPlacePicker(true);
        return;
      }
      Alert.alert('Not available', 'Places component not available — opening Google Maps instead.', [
        { text: 'OK', onPress: () => openGoogleMaps() },
      ]);
    } catch (e) {
      Alert.alert(
        'Install optional package',
        'To enable in-app place picking run:\n\nnpm install react-native-google-places-autocomplete\n\nThen set your Google Places API key in AssessScreen.js (GOOGLE_MAPS_API_KEY). For now app will open Google Maps.',
        [{ text: 'Open Maps', onPress: () => openGoogleMaps() }]
      );
    }
  };

  const setBudget = (b) => setBudgetRange(b);

  /* ---------------- reverse geocode & set location ---------------- */
  const reverseGeocodeAndSetLocation = async coords => {
    if (!coords) return;
    setIsGeocoding(true);
    try {
      // Use Google only if explicitly preferred and key present
      if (PREFER_GOOGLE && GOOGLE_MAPS_API_KEY) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json && json.status === 'OK' && json.results && json.results.length > 0) {
            const primary = json.results[0];
            const formatted = primary.formatted_address;
            if (formatted) {
              setLocation(formatted);
              setIsGeocoding(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Google geocode err', err);
        }
      }

      // Next try Nominatim (OpenStreetMap) which is free (reasonable accuracy)
      try {
        // Note: respect Nominatim usage policy in production (throttle, identify User-Agent)
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`;
        const res = await fetch(nomUrl, {
          headers: {
            'Accept-Language': 'en',
          },
        });
        const json = await res.json();
        if (json && (json.display_name || json.address)) {
          const display = json.display_name || buildNominatimAddress(json.address);
          setLocation(display);
          setIsGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('nominatim err', err);
      }

      // Fallback to expo reverse geocode
      const addrArr = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (addrArr && addrArr.length > 0) {
        const a = addrArr[0];
        const parts = [];
        if (a.name) parts.push(a.name);
        if (a.street && !parts.includes(a.street)) parts.push(a.street);
        const cityOrSub = a.city || a.subregion;
        if (cityOrSub && !parts.includes(cityOrSub)) parts.push(cityOrSub);
        if (a.region && !parts.includes(a.region)) parts.push(a.region);
        if (a.postalCode && !parts.includes(a.postalCode)) parts.push(a.postalCode);
        if (a.country && !parts.includes(a.country)) parts.push(a.country);

        const finalAddress = parts.join(', ') || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setLocation(finalAddress);
      } else {
        setLocation(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      }
    } catch (err) {
      console.warn('reverseGeocode err', err);
      setLocation(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const buildNominatimAddress = (addr) => {
    if (!addr) return '';
    const parts = [];
    if (addr.road) parts.push(addr.road);
    if (addr.neighbourhood) parts.push(addr.neighbourhood);
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postcode) parts.push(addr.postcode);
    if (addr.country) parts.push(addr.country);
    return parts.join(', ');
  };

  /* debounce wrapper so rapid drags/presses don't flood reverse geocode */
  const scheduleReverseGeocode = coords => {
    if (!coords) return;
    if (reverseGeoTimerRef.current) {
      clearTimeout(reverseGeoTimerRef.current);
    }
    reverseGeoTimerRef.current = setTimeout(() => {
      reverseGeocodeAndSetLocation(coords);
      reverseGeoTimerRef.current = null;
    }, 350);
  };

  /* helper: animate map to coords when selectedCoords changes (fast) */
  useEffect(() => {
    if (!selectedCoords || !mapRef.current) return;
    try {
      if (mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion(
          {
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          150
        );
      }
    } catch (e) {
      // ignore
    }
  }, [selectedCoords]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (reverseGeoTimerRef.current) {
        clearTimeout(reverseGeoTimerRef.current);
        reverseGeoTimerRef.current = null;
      }
    };
  }, []);

  /* helper to render roof space nicely (shows unit) */
  const roofSpaceLabel = () => {
    // keep simple - show roofArea with selected unit
    return `${roofArea} ${UNITS[areaUnitIndex]}`;
  };

  /* helper: format roof area to show both sq ft and sq m when applicable */
  const formatAreaBoth = () => {
    const val = Number(roofArea) || 0;
    const unit = UNITS[areaUnitIndex];
    const sqftToSqm = ft => (ft * 0.092903);
    if (unit === 'sq ft') {
      const sqm = Math.round(sqftToSqm(val));
      return `${val} sq ft (${sqm} sq m)`;
    } else if (unit === 'sq m' || unit === 'm²') {
      // show both: sq m and converted sq ft approx
      const sqmVal = val;
      const ft = Math.round(sqmVal / 0.092903);
      return `${sqmVal} ${unit} (${ft} sq ft)`;
    } else {
      return `${val} ${unit}`;
    }
  };

  const orientationFull = (o) => {
    const map = {
      N: 'North facing',
      NE: 'Northeast facing',
      E: 'East facing',
      SE: 'Southeast facing',
      S: 'South facing',
      SW: 'Southwest facing',
      W: 'West facing',
      NW: 'Northwest facing',
    };
    return map[o] || `${o} facing`;
  };

  const formatApplianceLine = (a) => {
    const name = a.name || 'Custom';
    const p = Number(a.power) || 0;
    return `${name}: ${a.count} × ${p} W × ${a.hours} hrs`;
  };

  /* ----------------- Recommendation helpers ----------------- */
  // Convert roof area to sqm for feasibility calculations
  const roofAreaSqm = () => {
    const val = Number(roofArea) || 0;
    const unit = UNITS[areaUnitIndex];
    if (unit === 'sq ft') {
      return val * 0.092903;
    } else if (unit === 'sq m' || unit === 'm²') {
      return val;
    } else if (unit === 'sq yards') {
      return val * 0.836127; // approx
    }
    return val;
  };

  // Simple recommendation logic (placeholder - you can replace with real formula)
  const recommendedKW = useMemo(() => {
    // approximate: assume 4 peak sun hours and factor for losses, aim capacity so daily production >= daily usage
    const daily = totalDailyUsage || 0;
    // Avoid division by zero; use 4.0 sun hrs
    const sunHours = 4.0;
    // include system losses factor ~0.8 (80% effective)
    const raw = (daily / (sunHours * 0.8));
    const rounded = Math.max(0.5, Math.round(raw * 10) / 10); // 1 decimal
    // ensure sensible min
    return rounded;
  }, [totalDailyUsage]);

  // estimate number of panels assuming 440W panels
  const panelsCount = Math.max(0, Math.ceil((recommendedKW * 1000) / 440));

  // area used estimate (m²) per panel ~1.7 m² (typical); adjust as needed
  const areaPerPanelSqm = 1.7;
  const areaUsedSqm = Math.round(panelsCount * areaPerPanelSqm);

  // payback estimate simple heuristic (years)
  const paybackYears = Math.max(4, Math.round((recommendedKW * 0.9 + 6)));

  // cost estimate by budget
  const costEstimate = () => {
    if (budgetRange === 'Low') return { label: '₹1.6L - ₹2L', bullets: ['Polycrystalline panels', 'Hybrid inverter', 'No battery'] };
    if (budgetRange === 'Premium') return { label: '₹3.5L - ₹4.0L', bullets: ['Premium monocrystalline', 'High-efficiency inverter', '10 kWh battery'] };
    // default Standard
    return { label: '₹2.8L - ₹3.2L', bullets: ['Monocrystalline panels', 'String inverter', '10 kWh battery'] };
  };

  const recommendation = useMemo(() => {
    const cost = costEstimate();
    const roofAvail = roofAreaSqm();
    const utilization = roofAvail > 0 ? Math.min(100, Math.round((areaUsedSqm / roofAvail) * 100)) : 0;
    return {
      recommendedKW,
      panelsCount,
      areaUsedSqm,
      paybackYears,
      system: {
        panels: `${panelsCount} × 440W Monocrystalline`,
        inverter: `${Math.max(1, Math.round(recommendedKW * 10) / 10)} kW String Inverter`,
        battery: batteryBackup ? '10 kWh Lithium Battery' : 'No battery',
      },
      feasibility: {
        used: areaUsedSqm,
        available: Math.round(roofAvail),
        utilization,
        message: utilization <= 80 ? 'Excellent - Plenty of space available' : utilization <= 100 ? 'Good - Space is sufficient' : 'Tight fit - may need adjustments',
      },
      cost,
    };
  }, [recommendedKW, panelsCount, areaUsedSqm, paybackYears, batteryBackup, roofArea, areaUnitIndex, budgetRange]);

  /* ----------------- Event handlers ----------------- */
  const onPressCalculate = () => {
    // set to step 5 to render recommendation screen
    setStep(5);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground source={require('../assets/solar_bg.jpg')} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
            setShowBottomNav(isBottom);
          }}
          scrollEventThrottle={16}
        >
          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.step}>Step 1 of 4</Text>
              <Text style={styles.title}>What appliances do you use?</Text>
              <Text style={styles.subtitle}>
                Add your home appliances to calculate your energy needs.
              </Text>

              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#6B7280" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search appliance"
                  style={styles.searchInput}
                />
              </View>

              {search.length > 0 &&
                SUGGESTED_APPLIANCES.filter(a =>
                  a.name.toLowerCase().includes(search.toLowerCase())
                ).map(item => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.suggestion}
                    onPress={() => addFromSearch(item)}
                  >
                    <Ionicons name="flash-outline" size={18} color="#F59E0B" />
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}

              {appliances.map(item => (
                <View key={item.id} style={styles.applianceCard}>
                  <View style={styles.rowTop}>
                    {item.custom ? (
                      <TextInput
                        value={item.name}
                        onChangeText={v => updateName(item.id, v)}
                        placeholder="Custom appliance name"
                        style={styles.nameInput}
                      />
                    ) : (
                      <Text style={styles.name}>{item.name}</Text>
                    )}
                    <TouchableOpacity onPress={() => removeAppliance(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rowBottom}>
                    <View style={styles.powerBox}>
                      <TextInput
                        value={item.power}
                        onChangeText={v => updatePower(item.id, v)}
                        keyboardType="numeric"
                        placeholder="0"
                        style={styles.powerInput}
                      />
                      <Text style={styles.watt}>W</Text>
                    </View>

                    <View style={styles.counter}>
                      <TouchableOpacity onPress={() => updateField(item.id, 'count', -1)}>
                        <Text style={styles.ctrl}>−</Text>
                      </TouchableOpacity>
                      <Text>{item.count}</Text>
                      <TouchableOpacity onPress={() => updateField(item.id, 'count', 1)}>
                        <Text style={styles.ctrl}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.counter}>
                      <TouchableOpacity onPress={() => updateField(item.id, 'hours', -1)}>
                        <Text style={styles.ctrl}>−</Text>
                      </TouchableOpacity>
                      <Text>{item.hours}</Text>
                      <TouchableOpacity onPress={() => updateField(item.id, 'hours', 1)}>
                        <Text style={styles.ctrl}>+</Text>
                      </TouchableOpacity>
                      <Text style={styles.hrs}>hrs</Text>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addBox} onPress={addCustomAppliance}>
                <Text style={styles.addText}>+ Add Custom Appliance</Text>
              </TouchableOpacity>

              <View style={styles.usageRow}>
                <Text style={{ color: '#374151' }}>Total Daily Usage</Text>
                <Text style={styles.usage}>{totalDailyUsage.toFixed(1)} kWh</Text>
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
                <Text style={styles.nextText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.step}>Step 2 of 4</Text>
              <Text style={styles.title}>Tell us about your rooftop</Text>
              <Text style={styles.subtitle}>
                This helps us calculate the optimal panel placement.
              </Text>

              <View style={styles.inputCard}>
                <Text style={styles.label}>Usable Roof Area</Text>
                <View style={styles.areaRow}>
                  <TextInput
                    value={roofArea}
                    onChangeText={setRoofArea}
                    keyboardType="numeric"
                    style={styles.areaInput}
                  />
                  <TouchableOpacity style={styles.unitPill} onPress={cycleAreaUnit}>
                    <Text style={styles.unitText}>{UNITS[areaUnitIndex]}</Text>
                    <Text style={styles.unitHint}>tap to change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ----- ORIENTATION: compass-style ring ----- */}
              <View style={styles.inputCard}>
                <Text style={styles.label}>Roof Orientation</Text>

                <View style={styles.compassWrap}>
                  {/* circle */}
                  <View style={styles.circle} />

                  {/* center compass (small ring + dot) */}
                  <View style={styles.centerRing}>
                    <View style={styles.centerDot} />
                  </View>

                  {/* orientation buttons positioned absolutely around circle */}
                  {(() => {
                    const circleSize = 260; // px
                    const btnSize = 52;
                    const positions = computePositions(circleSize, btnSize); // uses same ORIENTATIONS order
                    return positions.map(pos => {
                      const isActive = orientation === pos.o;
                      return (
                        <TouchableOpacity
                          key={pos.o}
                          onPress={() => setOrientation(pos.o)}
                          activeOpacity={0.85}
                          style={[
                            styles.orientBtnAbsolute,
                            {
                              left: pos.left,
                              top: pos.top,
                              width: btnSize,
                              height: btnSize,
                              borderRadius: btnSize / 2,
                              transform: [{ translateX: 0 }, { translateY: 0 }],
                            },
                            isActive && styles.orientBtnActiveAbsolute,
                          ]}
                        >
                          <Text style={[styles.orientText, isActive && { color: '#fff' }]}>{pos.o}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>

              {/* ----- SHADING LEVEL ----- */}
              <View style={styles.inputCard}>
                <Text style={styles.label}>Shading Level</Text>
                <View style={styles.shadeRow}>
                  {['None', 'Partial', 'Heavy'].map(s => {
                    const active = shading === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setShading(s)}
                        style={[styles.shadeBtn, active && styles.shadeActive]}
                      >
                        <Text style={[styles.shadeTitle, active && { color: '#D97706' }]}>{s}</Text>
                        <Text style={styles.shadeSub}>{SHADING_SUB[s]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1, marginRight: 8 }]} onPress={() => setStep(1)}>
                  <Text style={styles.nextText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep(3)}>
                  <Text style={styles.nextText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= STEP 3 ================= */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.step}>Step 3 of 4</Text>
              <Text style={styles.title}>Location & Preferences</Text>
              <Text style={styles.subtitle}>
                Tell us where the panels will be installed and your preferences.
              </Text>

              {/* LOCATION */}
              <View style={[styles.inputCard, { paddingVertical: 12 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Location</Text>
                  <TouchableOpacity onPress={onPickOnMapPress} style={styles.mapBtn}>
                    <Ionicons name="location-outline" size={18} color="#F59E0B" />
                    <Text style={styles.mapBtnText}>Pick on map</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.locationBox}>
                  <Ionicons name="pin" size={18} color="#F59E0B" />
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.locationText} numberOfLines={2}>
                      {location || 'No location selected'}
                    </Text>
                    <View style={{ marginLeft: 8 }}>
                      {isGeocoding ? <ActivityIndicator size="small" color="#F59E0B" /> : null}
                    </View>
                  </View>
                </View>

                <Text style={styles.helperText}>
                  Tip: pan the map and position the crosshair over the exact point, then press Confirm.
                </Text>
              </View>

              {/* PREFERENCES BULLETS */}
              <View style={styles.inputCard}>
                <Text style={styles.sectionTitle}>Grid Connection</Text>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.settingTitle}>Connected to grid</Text>
                    <Text style={styles.settingSub}>
                      Required for net-metering & hybrid systems
                    </Text>
                  </View>
                  <Switch
                    value={gridConnection}
                    onValueChange={setGridConnection}
                    trackColor={{ true: '#FDE68A', false: '#E5E7EB' }}
                    thumbColor={gridConnection ? '#F59E0B' : '#fff'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.settingTitle}>Battery backup</Text>
                    <Text style={styles.settingSub}>
                      Stores power for night & outages
                    </Text>
                  </View>
                  <Switch
                    value={batteryBackup}
                    onValueChange={setBatteryBackup}
                    trackColor={{ true: '#FDE68A', false: '#E5E7EB' }}
                    thumbColor={batteryBackup ? '#F59E0B' : '#fff'}
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Budget Range</Text>
                  <View style={styles.budgetRow}>
                    {['Low', 'Standard', 'Premium'].map(b => {
                      const active = budgetRange === b;
                      return (
                        <TouchableOpacity
                          key={b}
                          onPress={() => setBudget(b)}
                          style={[
                            styles.budgetBtn,
                            active && styles.budgetBtnActive,
                          ]}
                        >
                          <Text style={[styles.budgetText, active && { color: '#fff' }]}>{b}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* compact summary box */}
              <View style={[styles.inputCard, { paddingVertical: 14 }]}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Summary</Text>

                <View style={styles.summaryItem}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.summaryText}>Location: {location || '—'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={[styles.dot, { backgroundColor: gridConnection ? '#10B981' : '#9CA3AF' }]} />
                  <Text style={styles.summaryText}>Grid Connection: {gridConnection ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={[styles.dot, { backgroundColor: batteryBackup ? '#F59E0B' : '#9CA3AF' }]} />
                  <Text style={styles.summaryText}>Battery Backup: {batteryBackup ? 'Preferred' : 'No'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
                  <Text style={styles.summaryText}>Budget: {budgetRange}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1, marginRight: 8 }]} onPress={() => setStep(2)}>
                  <Text style={styles.nextText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep(4)}>
                  <Text style={styles.nextText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= STEP 4: REVIEW (NEW) ================= */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.step}>Step 4 of 4</Text>
              <Text style={styles.title}>Review Your Details</Text>
              <Text style={styles.subtitle}>Make sure everything looks correct before we calculate.</Text>

              {/* Section: Appliances (expandable) */}
              <TouchableOpacity
                style={styles.reviewSection}
                onPress={() => setExpandAppliances(prev => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Appliances</Text>
                  <View style={styles.rightRow}>
                    <View style={styles.countPill}>
                      <Text style={styles.countPillText}>{appliances.length} items</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep(1)} style={{ padding: 8 }}>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {expandAppliances && (
                  <View style={styles.reviewDetails}>
                    {appliances.length === 0 ? (
                      <Text style={styles.bulletText}>No appliances added</Text>
                    ) : (
                      appliances.map(a => (
                        <View key={a.id} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{formatApplianceLine(a)}</Text>
                        </View>
                      ))
                    )}
                    <Text style={[styles.bulletText, { marginTop: 8, color: '#6B7280' }]}>
                      Total: {totalDailyUsage.toFixed(1)} kWh/day
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Section: Rooftop Details (expandable) */}
              <TouchableOpacity
                style={styles.reviewSection}
                onPress={() => setExpandRooftop(prev => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Rooftop Details</Text>
                  <TouchableOpacity onPress={() => setStep(2)} style={{ padding: 8 }}>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {expandRooftop && (
                  <View style={styles.reviewDetails}>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Usable Area: {formatAreaBoth()}</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Orientation: {orientationFull(orientation)}</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Shading: {shading} ({SHADING_SUB[shading] || ''})</Text>
                    </View>
                    {/* If you later add a roofType state you can render it here */}
                  </View>
                )}
              </TouchableOpacity>

              {/* Section: Location & Preferences (expandable) */}
              <TouchableOpacity
                style={styles.reviewSection}
                onPress={() => setExpandLocationPrefs(prev => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Location & Preferences</Text>
                  <TouchableOpacity onPress={() => setStep(3)} style={{ padding: 8 }}>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {expandLocationPrefs && (
                  <View style={styles.reviewDetails}>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText} numberOfLines={2}>{location}</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Grid Connection: {gridConnection ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Battery Backup: {batteryBackup ? 'Preferred' : 'No'}</Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>Budget: {budgetRange}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Summary dark card */}
              <View style={styles.quickSummary}>
                <View style={styles.quickHeader}>
                  <View style={styles.flashIcon}>
                    <Ionicons name="flash" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.quickTitle}>Quick Summary</Text>
                </View>

                <View style={styles.quickRow}>
                  <View style={styles.quickCol}>
                    <Text style={styles.quickLabel}>Daily Usage</Text>
                    <Text style={styles.quickValue}>{totalDailyUsage.toFixed(1)} kWh</Text>
                  </View>
                  <View style={styles.quickCol}>
                    <Text style={styles.quickLabel}>Roof Space</Text>
                    <Text style={styles.quickValue}>{roofSpaceLabel()}</Text>
                  </View>
                </View>
              </View>

              {/* Calculate button */}
              <TouchableOpacity style={styles.calculateBtn} onPress={onPressCalculate}>
                <Text style={styles.calculateText}>Calculate My Solar Plan ⚡</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 5: RECOMMENDATION SCREEN ================= */}
          {step === 5 && (
            // add top padding equal to status bar + a little spacing so system icons don't overlap the white card
            <View style={{ paddingTop: STATUS_BAR_HEIGHT + 12, paddingBottom: 40 }}>
              <View style={[styles.card, { paddingVertical: 22, paddingHorizontal: 18, marginTop: 0 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: '800', fontSize: 22, color: '#07143B' }}>Your Solar{"\n"}Recommendation</Text>
                  </View>
                  <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }}>
                    <Text style={{ color: '#10B981', fontWeight: '700' }}>Ready</Text>
                  </View>
                </View>

                <View style={{ marginTop: 18, backgroundColor: '#F59E0B', borderRadius: 12, padding: 18 }}>
                  <Text style={{ color: '#07143B', fontWeight: '700', marginBottom: 8 }}>Recommended Capacity</Text>
                  <Text style={{ fontSize: 34, fontWeight: '900', color: '#07143B' }}>{recommendation.recommendedKW} kW</Text>
                  <Text style={{ color: '#07143B', marginTop: 8 }}>Perfect for your home's energy needs</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{recommendation.panelsCount}</Text>
                    <Text style={styles.statLabel}>Panels</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{recommendation.areaUsedSqm} m²</Text>
                    <Text style={styles.statLabel}>Area Used</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>~{recommendation.paybackYears} yrs</Text>
                    <Text style={styles.statLabel}>Payback Est.</Text>
                  </View>
                </View>

                <Text style={{ marginTop: 18, fontWeight: '800', fontSize: 16, color: '#07143B' }}>System Breakdown</Text>

                <View style={styles.systemItem}>
                  <View style={styles.iconBox}>
                    <Ionicons name="flash" size={20} color="#F59E0B" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800' }}>Solar Panels</Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>{recommendation.system.panels}</Text>
                  </View>
                </View>

                <View style={styles.systemItem}>
                  <View style={styles.iconBoxGreen}>
                    <Ionicons name="cube" size={20} color="#10B981" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800' }}>Inverter</Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>{recommendation.system.inverter}</Text>
                  </View>
                </View>

                <View style={styles.systemItem}>
                  <View style={styles.iconBoxGrey}>
                    <Ionicons name="battery-charging" size={20} color="#6B7280" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800' }}>Battery Storage</Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>{recommendation.system.battery}</Text>
                  </View>
                </View>

                <View style={[styles.card, { marginTop: 14, padding: 12 }]}>
                  <Text style={{ fontWeight: '800', marginBottom: 8 }}>Rooftop Feasibility</Text>
                  <Text style={{ color: '#6B7280' }}>Space utilization</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontWeight: '700' }}>{recommendation.feasibility.used} m² of {recommendation.feasibility.available} m²</Text>
                    <Text style={{ color: '#6B7280' }}>{recommendation.feasibility.utilization}%</Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: '#E6EEF6', borderRadius: 8, marginTop: 8, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(recommendation.feasibility.utilization, 100)}%`, height: 8, backgroundColor: '#10B981' }} />
                  </View>
                  <Text style={{ marginTop: 8, color: '#10B981' }}>✓ {recommendation.feasibility.message}</Text>
                </View>

                <Text style={{ marginTop: 14, fontWeight: '800', fontSize: 16, color: '#07143B' }}>Cost Estimate</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity style={[styles.costPill, budgetRange === 'Low' && styles.costPillActive]} onPress={() => setBudget('Low')}>
                    <Text style={[styles.costPillText, budgetRange === 'Low' && { color: '#fff' }]}>Economy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.costPill, budgetRange === 'Standard' && styles.costPillActive]} onPress={() => setBudget('Standard')}>
                    <Text style={[styles.costPillText, budgetRange === 'Standard' && { color: '#fff' }]}>Standard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.costPill, budgetRange === 'Premium' && styles.costPillActive]} onPress={() => setBudget('Premium')}>
                    <Text style={[styles.costPillText, budgetRange === 'Premium' && { color: '#fff' }]}>Premium</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { marginTop: 12, padding: 14 }]}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#07143B' }}>{recommendation.cost.label}</Text>
                  <View style={{ marginTop: 8 }}>
                    {recommendation.cost.bullets.map((b, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: '#F59E0B', marginRight: 8 }} />
                        <Text style={{ color: '#374151' }}>{b}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={[styles.nextBtn, { marginTop: 18 }]} onPress={() => Alert.alert('Download', 'Downloading PDF report...')}>
                  <Text style={[styles.nextText]}>⬇ Download PDF Report</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.nextBtn, { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#07143B' }]} onPress={() => Alert.alert('Consult', 'Connecting you to an expert...')}>
                  <Text style={{ fontWeight: '800', color: '#07143B' }}>Consult an Expert</Text>
                </TouchableOpacity>

                <View style={{ height: 24 }} />

                {/* bottom nav spacing handled by overall ScrollView padding */}
                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 6 }} onPress={() => setStep(4)}>
                  <Text style={{ color: '#6B7280' }}>← Back to review</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* NOTE: extra vertical space so bottom nav animates correctly */}
        </ScrollView>

        <Animated.View
          style={[styles.bottomNav, { transform: [{ translateY: slideAnim }] }]}
        >
          <NavItem icon="home" label="Home" />
          <NavItem icon="clipboard" label="Assess" active />
          <NavItem icon="albums" label="Catalog" />
          <NavItem icon="settings" label="Settings" />
        </Animated.View>

        {/* ---------- Place Picker Modal (optional) ---------- */}
        <Modal visible={showPlacePicker} animationType="slide" onRequestClose={() => setShowPlacePicker(false)}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
              <TouchableOpacity onPress={() => setShowPlacePicker(false)} style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={26} color="#111827" />
              </TouchableOpacity>
              <Text style={{ fontWeight: '700', fontSize: 16, marginLeft: 8 }}>Select location</Text>
            </View>

            <View style={{ flex: 1 }}>
              {PlacesComponent ? (
                // render the Google Places autocomplete component that was dynamically required
                <PlacesComponent
                  placeholder="Search address or place"
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    // prefer formatted_address if available
                    const addr = (details && (details.formatted_address || details.name)) || data.description || data.structured_formatting?.main_text;
                    setLocation(addr);
                    setShowPlacePicker(false);
                  }}
                  query={{
                    key: GOOGLE_MAPS_API_KEY,
                    language: 'en',
                  }}
                  styles={{
                    textInputContainer: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
                    textInput: { fontSize: 16, borderRadius: 8, backgroundColor: '#fff' },
                    listView: { backgroundColor: '#fff' },
                  }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <Text style={{ textAlign: 'center', color: '#6B7280' }}>
                    Place picker is not available. Please install the optional package and set your API key.
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* -------- Map Picker Modal (center crosshair + pan) -------- */}
        <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderBottomWidth: 1,
              borderColor: '#E5E7EB'
            }}>
              <TouchableOpacity onPress={() => setShowMapPicker(false)} style={{ padding: 6 }}>
                <Ionicons name="chevron-back" size={26} color="#111827" />
              </TouchableOpacity>

              <Text style={{ fontSize: 16, fontWeight: '700', marginLeft: 10 }}>
                Select Location
              </Text>
            </View>

            {selectedCoords ? (
              <View style={{ flex: 1 }}>
                <MapView
                  ref={(ref) => { mapRef.current = ref; }}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: selectedCoords.latitude,
                    longitude: selectedCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onPress={(e) => {
                    // If user taps map, animate to that region (useful)
                    const coords = {
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    };
                    setSelectedCoords(coords);
                    // schedule reverse geocode quickly
                    scheduleReverseGeocode(coords);
                  }}
                  onRegionChangeComplete={(region) => {
                    const coords = { latitude: region.latitude, longitude: region.longitude };
                    // update center coordinate instantly
                    setSelectedCoords(coords);
                    // schedule reverse geocode (debounced) for smoother UX
                    scheduleReverseGeocode(coords);
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  toolbarEnabled={false}
                />
                {/* center crosshair */}
                <View pointerEvents="none" style={styles.crosshairContainer}>
                  <Ionicons name="add-circle" size={48} color="rgba(0,0,0,0.6)" />
                </View>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={async () => {
                    if (selectedCoords) {
                      // ensure latest geocoding before closing
                      if (reverseGeoTimerRef.current) {
                        clearTimeout(reverseGeoTimerRef.current);
                        reverseGeoTimerRef.current = null;
                      }
                      await reverseGeocodeAndSetLocation(selectedCoords);
                    }
                    setShowMapPicker(false);
                  }}
                >
                  <Text style={{ fontWeight: '700', color: '#000' }}>Confirm Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#6B7280' }}>Loading map...</Text>
              </View>
            )}
          </SafeAreaView>
        </Modal>

      </ImageBackground>
    </SafeAreaView>
  );
}

/* ---------------- NAV ITEM ---------------- */
const NavItem = ({ icon, label, active }) => (
  <View style={styles.navItem}>
    <Ionicons name={icon} size={24} color={active ? '#F59E0B' : '#9CA3AF'} />
    <Text style={[styles.navText, active && { color: '#F59E0B' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    padding: 20,
    marginTop: 28,
    // subtle shadow to lift card visually
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },

  step: { fontSize: 13, color: '#6B7280' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  subtitle: { fontSize: 15, color: '#4B5563', marginVertical: 10 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  searchInput: { marginLeft: 8, flex: 1, height: 36 },

  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: 8,
  },

  suggestionText: { fontWeight: '600' },

  applianceCard: {
    marginTop: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingBottom: 12,
  },

  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: { fontSize: 16, fontWeight: '700' },

  nameInput: {
    fontSize: 16,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
    flex: 1,
    marginRight: 10,
    paddingVertical: 4,
  },

  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },

  powerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  powerInput: {
    width: 56,
    textAlign: 'center',
    fontWeight: '700',
  },

  watt: { marginLeft: 6, fontWeight: '600', color: '#6B7280' },

  counter: { flexDirection: 'row', alignItems: 'center' },

  ctrl: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 6,
    textAlign: 'center',
  },

  hrs: { fontSize: 12, marginLeft: 6 },

  addBox: {
    marginTop: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },

  addText: { fontWeight: '700', color: '#2563EB' },

  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  usage: { fontWeight: '800' },

  nextBtn: {
    backgroundColor: '#F59E0B',
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  nextText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#000',
  },

  inputCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    overflow: 'hidden',
  },

  label: { fontWeight: '700', marginBottom: 8 },

  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // spacing handled by unit pill margins
  },

  areaInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontWeight: '700',
  },

  unitPill: {
    marginLeft: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },

  unitText: {
    fontWeight: '700',
    color: '#fff',
  },

  unitHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  /* --- COMPASS (orientation) styles --- */
  compassWrap: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },

  circle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: '#E6EEF6',
    backgroundColor: 'rgba(245,246,250,0.6)',
  },

  centerRing: {
    position: 'absolute',
    left: 260 / 2 - 26,
    top: 260 / 2 - 26,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 8,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },

  orientBtnAbsolute: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E6EEF6',
    backgroundColor: '#fff',
    elevation: 2,
  },

  orientBtnActiveAbsolute: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  orientText: {
    fontWeight: '700',
    color: '#0f172a',
  },

  /* shading UI */
  shadeRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },

  shadeBtn: {
    flex: 1,
    borderWidth: 1.6,
    borderColor: '#E6EEF6',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    minHeight: 68,
  },

  shadeActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFF7ED',
    shadowColor: '#F59E0B',
    elevation: 3,
  },

  shadeTitle: {
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },

  shadeSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* ---- Step 3 styles ---- */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapBtnText: {
    marginLeft: 6,
    color: '#F59E0B',
    fontWeight: '700',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  locationText: {
    marginLeft: 10,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  settingTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  settingSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  budgetText: {
    fontWeight: '700',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefLabel: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  budgetBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6EEF6',
    alignItems: 'center',
  },
  budgetBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  summaryRow: {
    flexDirection: 'column',
    gap: 8,
  },
  summaryBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  summaryText: {
    color: '#374151',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: '#FFF',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    elevation: 14,
  },

  navItem: { alignItems: 'center' },
  navText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  /* Map modal crosshair and confirm */
  crosshairContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  confirmBtn: {
    backgroundColor: '#F59E0B',
    padding: 16,
    alignItems: 'center',
  },

  /* ===== Step 4 (Review) styles ===== */
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'column',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontWeight: '800',
    fontSize: 16,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countPillText: {
    color: '#B45309',
    fontWeight: '700',
  },

  reviewDetails: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    color: '#374151',
    flex: 1,
  },

  quickSummary: {
    marginTop: 18,
    backgroundColor: '#07143B',
    borderRadius: 14,
    padding: 16,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickTitle: {
    fontWeight: '800',
    color: '#fff',
    fontSize: 16,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickCol: {
    flex: 1,
  },
  quickLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  quickValue: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 6,
    fontSize: 18,
  },

  calculateBtn: {
    marginTop: 18,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  calculateText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#000',
  },

  /* ===== Recommendation screen styles ===== */
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E6EEF6',
  },
  statNumber: {
    fontWeight: '900',
    fontSize: 20,
    color: '#07143B',
  },
  statLabel: {
    color: '#6B7280',
    marginTop: 6,
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E6EEF6',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGreen: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGrey: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6EEF6',
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  costPillActive: {
    backgroundColor: '#07143B',
    borderColor: '#07143B',
  },
  costPillText: {
    fontWeight: '700',
    color: '#07143B',
  },
});