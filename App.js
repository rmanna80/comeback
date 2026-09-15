import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './screens/OnboardingScreen';
import TodayScreen from './screens/TodayScreen';
import TrackerScreen from './screens/TrackerScreen';
import SettingsScreen from './screens/SettingsScreen';
import { initNotifications } from './notifications';
import { GOAL_TEMPLATES } from './data/phases';
import { colors } from './theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Today: 'checkbox-outline',
  Tracker: 'flag-outline',
  Settings: 'settings-outline',
};

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) initNotifications(profile);
  }, [profile]);

  useEffect(() => {
    AsyncStorage.getItem('profile')
      .then((raw) => {
        if (raw) setProfile(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (p) => {
    await AsyncStorage.setItem('profile', JSON.stringify(p));
    setProfile(p);
  };

  const resetProfile = async () => {
    await AsyncStorage.multiRemove([
      'profile', 'completions', 'streak', 'milestones', 'benchmarks',
      'customGoals', 'dayLog', 'bestStreak', 'phaseHistory',
    ]);
    setProfile(null);
  };

  const updatePhase = async (phaseId, mergeGoals) => {
    const p = { ...profile, phase: phaseId };
    await AsyncStorage.setItem('profile', JSON.stringify(p));
    const hRaw = await AsyncStorage.getItem('phaseHistory');
    const history = hRaw ? JSON.parse(hRaw) : [];
    history.push({ phase: phaseId, date: new Date().toISOString() });
    await AsyncStorage.setItem('phaseHistory', JSON.stringify(history));
    if (mergeGoals) {
      const cRaw = await AsyncStorage.getItem('customGoals');
      if (cRaw) {
        const custom = JSON.parse(cRaw);
        const tmpl = (GOAL_TEMPLATES[phaseId] || []).map((g, i) => ({
          ...g,
          id: `${phaseId}-${i}`,
        }));
        const titles = new Set(custom.map((g) => g.title));
        const merged = [...custom, ...tmpl.filter((g) => !titles.has(g.title))];
        await AsyncStorage.setItem('customGoals', JSON.stringify(merged));
      }
    }
    setProfile(p);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {profile ? (
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: colors.pitch,
              tabBarInactiveTintColor: colors.inkFaint,
              tabBarStyle: { backgroundColor: colors.card },
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
              ),
            })}
          >
            <Tab.Screen name="Today">
              {() => (
                <SafeAreaView edges={['top']} style={styles.root}>
                  <TodayScreen profile={profile} />
                </SafeAreaView>
              )}
            </Tab.Screen>
            <Tab.Screen name="Tracker">
              {() => (
                <SafeAreaView edges={['top']} style={styles.root}>
                  <TrackerScreen profile={profile} />
                </SafeAreaView>
              )}
            </Tab.Screen>
            <Tab.Screen name="Settings">
              {() => (
                <SafeAreaView edges={['top']} style={styles.root}>
                  <SettingsScreen
                    profile={profile}
                    onReset={resetProfile}
                    onPhaseChange={updatePhase}
                  />
                </SafeAreaView>
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      ) : (
        <SafeAreaView style={styles.root}>
          <OnboardingScreen onDone={saveProfile} />
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
