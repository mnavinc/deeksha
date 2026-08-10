import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const setProfile = useAppStore((s) => s.setProfile);
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (!name.trim()) return;
    setProfile({
      id: `user-${Date.now()}`,
      name: name.trim(),
      language: 'en',
      pilgrimageCount: 0,
      onboardingComplete: false,
    });
    router.push('/onboarding/deeksha-select');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What shall we call you, Swami?</Text>
      <Text style={styles.subtitle}>Every devotee is addressed as Swami — a symbol of humility and equality.</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.textDim}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Button title="Continue" onPress={handleContinue} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: 40 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
});
