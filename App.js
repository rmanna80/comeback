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
import { colors } from './theme';

const Tab = createBottomTabNavigator();

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    ]);
    setProfile(null);
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
                <Ionicons
                  name={route.name === 'Today' ? 'checkbox-outline' : 'flag-outline'}
                  size={size}
                  color={color}
                />
              ),
            })}
          >
            <Tab.Screen name="Today">
              {() => (
                <SafeAreaView edges={['top']} style={styles.root}>
                  <TodayScreen profile={profile} onReset={resetProfile} />
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
