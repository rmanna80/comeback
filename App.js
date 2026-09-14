import { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './screens/OnboardingScreen';
import TodayScreen from './screens/TodayScreen';
import { colors } from './theme';

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
    await AsyncStorage.multiRemove(['profile', 'completions', 'streak']);
    setProfile(null);
  };

  if (loading) return <SafeAreaView style={styles.root} />;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {profile ? (
        <TodayScreen profile={profile} onReset={resetProfile} />
      ) : (
        <OnboardingScreen onDone={saveProfile} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
