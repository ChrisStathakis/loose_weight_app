import { useState, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { Locale } from '@/src/types';
import { DIETS } from '@/src/lib/diets';
import { calcAge, estimateGoals, isValidBirthDate, parseNumber, parseOptionalNumber } from '@/src/lib/nutrition';
import { dateKey } from '@/src/lib/db';
import { tFor } from '@/src/lib/i18n';
import { useAppTheme } from '@/src/theme';
import { DateField } from '@/src/ui/DateField';

const STEPS = 3;

export default function Onboarding() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { settings, updateSettings, t } = useApp();
  const [step, setStep] = useState(0);
  const [locale, setLocale] = useState<Locale>(settings.locale);
  const [calories, setCalories] = useState(String(settings.calorie_goal));
  const [protein, setProtein] = useState(String(settings.protein_goal));
  const [carbs, setCarbs] = useState(String(settings.carbs_goal));
  const [fat, setFat] = useState(String(settings.fat_goal));
  const [diet, setDiet] = useState(settings.diet);
  const [excluded, setExcluded] = useState(settings.excluded.join(', '));
  const [height, setHeight] = useState(settings.height_cm != null ? String(settings.height_cm) : '');
  const [weight, setWeight] = useState(settings.weight_kg != null ? String(settings.weight_kg) : '');
  const [targetWeight, setTargetWeight] = useState(settings.target_weight_kg != null ? String(settings.target_weight_kg) : '');
  const [birthDate, setBirthDate] = useState(settings.birth_date ?? '');
  const finishingRef = useRef(false);
  const tx = (key: Parameters<typeof t>[0]) => tFor(locale, key);
  const { colors, styles } = useAppTheme();
  // Fixed 54px ignored notches/status bars; derive from the actual insets.
  const insets = useSafeAreaInsets();
  const age = calcAge(birthDate);
  const suggested = estimateGoals({
    weight_kg: parseOptionalNumber(weight),
    height_cm: parseOptionalNumber(height),
    age,
  });

  const finish = async () => {
    // Synchronous re-entry gate: two taps in the same frame both pass a
    // state-based check before React re-renders.
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      const height_cm = parseOptionalNumber(height);
      const weight_kg = parseOptionalNumber(weight);
      const target_weight_kg = parseOptionalNumber(targetWeight);
      const cleanBirth = birthDate.trim();
      const birth_date = isValidBirthDate(cleanBirth) ? cleanBirth : '';
      await updateSettings({ locale, calorie_goal: parseNumber(calories, 2000), protein_goal: parseNumber(protein, 120), carbs_goal: parseNumber(carbs, 220), fat_goal: parseNumber(fat, 70), diet, excluded: excluded.split(',').map((v) => v.trim()).filter(Boolean), onboarding_complete: true, height_cm, birth_date, weight_kg, target_weight_kg });
      if (weight_kg != null) {
        try {
          await db.runAsync('INSERT OR REPLACE INTO weights (date, kilograms) VALUES (?, ?)', dateKey(), weight_kg);
        } catch (e) {
          console.error('Failed to seed initial weight', e);
        }
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Failed to finish onboarding', e);
      Alert.alert(t('welcome'), t('saveFailed'));
    } finally {
      finishingRef.current = false;
    }
  };

  const applySuggested = () => {
    if (!suggested) return;
    setCalories(String(suggested.calories));
    setProtein(String(suggested.protein));
    setCarbs(String(suggested.carbs));
    setFat(String(suggested.fat));
  };

  const stepTitle = step === 0 ? tx('aboutStep') : step === 1 ? tx('goalsStep') : tx('dietStep');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-6deg' }] }}><Text style={{ fontSize: 30 }}>🥗</Text></View>
        <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: colors.lemon, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '6deg' }] }}><Text style={{ fontSize: 30 }}>🔥</Text></View>
        <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: colors.berry, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }] }}><Text style={{ fontSize: 30 }}>🎉</Text></View>
      </View>
      <Text style={styles.title}>{tx('welcome')}</Text>
      <Text style={styles.subtitle}>{tx('welcomeBody')}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.green : colors.border }} />
        ))}
      </View>
      <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 12, marginTop: 8 }}>
        {tx('stepOf')} {step + 1} / {STEPS} · {stepTitle}
      </Text>

      {step === 0 && (
        <View>
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 8 }}>
            <Pressable onPress={() => setLocale('en')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'en' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{tx('english')}</Text></Pressable>
            <Pressable onPress={() => setLocale('el')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'el' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{tx('greek')}</Text></Pressable>
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{tx('aboutYou')}</Text>
          <Text style={styles.label}>{tx('height')} (cm)</Text>
          <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="175" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>{tx('weight')} (kg)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>{tx('targetWeight')} (kg)</Text>
          <TextInput style={styles.input} value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" placeholder="65" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>{tx('birthDate')}{age != null ? ` · ${tx('age')}: ${age}` : ''}</Text>
          <DateField value={birthDate} onChange={setBirthDate} locale={locale} placeholder={tx('birthDateHint')} maximumDate={new Date()} />
          {birthDate.trim() && !isValidBirthDate(birthDate.trim()) ? (
            <Text style={{ color: colors.berry, fontSize: 12, fontWeight: '700', marginTop: 6 }}>{tx('invalidBirthDate')}</Text>
          ) : null}
        </View>
      )}

      {step === 1 && (
        <View>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{tx('dailyGoals')}</Text>
          {suggested ? (
            <View style={[styles.card, { backgroundColor: colors.mint, marginTop: 0 }]}>
              <Text style={{ color: colors.greenDeep, fontWeight: '800', fontSize: 13 }}>✨ {tx('suggestedGoals')}</Text>
              <Text style={{ color: colors.ink, fontWeight: '700', marginTop: 6 }}>
                {suggested.calories} kcal · P {suggested.protein}g · C {suggested.carbs}g · F {suggested.fat}g
              </Text>
              <Pressable onPress={applySuggested} style={[styles.chip, { marginTop: 10, alignSelf: 'flex-start' }]}>
                <Text style={styles.chipText}>{tx('useSuggested')}</Text>
              </Pressable>
            </View>
          ) : null}
          {[[tx('calories'), calories, setCalories, 'kcal'], [tx('protein'), protein, setProtein, 'g'], [tx('carbs'), carbs, setCarbs, 'g'], [tx('fat'), fat, setFat, 'g']].map(([label, value, setter, suffix]) => (
            <View key={label as string}>
              <Text style={styles.label}>{label as string} ({suffix as string})</Text>
              <TextInput style={styles.input} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" />
            </View>
          ))}
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{tx('diet')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETS.map((item) => (
              <Pressable key={item} onPress={() => setDiet(item)} style={[styles.outlineButton, { width: '31%', paddingHorizontal: 4, minHeight: 44, backgroundColor: diet === item ? colors.greenSoft : colors.surface }]}>
                <Text style={[styles.outlineText, { fontSize: 12 }]}>{tx(item)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{tx('excluded')}</Text>
          <TextInput style={styles.input} value={excluded} onChangeText={setExcluded} placeholder={tx('excludedHint')} placeholderTextColor={colors.muted} />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 28, marginBottom: 20 }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}>
            <Ionicons name="arrow-back" size={18} color={colors.green} />
            <Text style={styles.outlineText}>{tx('backStep')}</Text>
          </Pressable>
        ) : null}
        {step < STEPS - 1 ? (
          <Pressable onPress={() => setStep((s) => Math.min(STEPS - 1, s + 1))} style={[styles.button, { flex: 2, flexDirection: 'row', gap: 6 }]}>
            <Text style={styles.buttonText}>{tx('nextStep')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onGreen} />
          </Pressable>
        ) : (
          <Pressable onPress={finish} style={[styles.button, { flex: 2, flexDirection: 'row', gap: 6 }]}>
            <Text style={styles.buttonText}>{tx('getStarted')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onGreen} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
