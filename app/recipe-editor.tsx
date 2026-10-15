import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useAppTheme } from '@/src/theme';
import { Diet } from '@/src/types';
import { DIETS } from '@/src/lib/diets';
import { parseNumber } from '@/src/lib/nutrition';

function parseIngredients(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZΑ-Ωα-ω]+)\s+(.+)$/);
    const amount = match ? parseNumber(match[1]) : 1;
    const unit = match?.[2] ?? 'portion';
    const name = match?.[3] ?? line;
    return { name_en: name, name_el: name, amount, unit };
  });
}

export default function RecipeEditor() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { t } = useApp();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState('400');
  const [protein, setProtein] = useState('25');
  const [carbs, setCarbs] = useState('40');
  const [fat, setFat] = useState('15');
  const [servings, setServings] = useState('1');
  const [diet, setDiet] = useState<Diet>('balanced');
  const { colors, styles } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const canSave = name.trim().length > 0 && !saving;
  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const id = `custom-recipe-${Date.now()}`;
      const servingCount = Math.max(1, Math.round(parseNumber(servings, 1)));
      await db.runAsync(
        'INSERT INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        id, name.trim(), name.trim(), diet,
        JSON.stringify(parseIngredients(ingredients)),
        instructions.trim(), instructions.trim(),
        parseNumber(calories), parseNumber(protein), parseNumber(carbs), parseNumber(fat),
        servingCount,
      );
      router.back();
    } catch (e) {
      // Without this the modal just flashes the spinner and stays open with
      // no explanation (insert failure = unhandled rejection).
      console.error('Failed to save recipe', e);
      Alert.alert(t('createRecipe'), t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Stack.Screen options={{ title: t('createRecipe'), presentation: 'modal', headerShown: true, headerTintColor: colors.green, headerStyle: { backgroundColor: colors.bg } }} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text style={styles.subtitle}>{t('ingredients')} · {t('ingredientExample')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('recipeName')} placeholderTextColor={colors.muted} />
          <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top', marginTop: 10 }]} multiline value={ingredients} onChangeText={setIngredients} placeholder={t('ingredients')} placeholderTextColor={colors.muted} />
          <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top', marginTop: 10 }]} multiline value={instructions} onChangeText={setInstructions} placeholder={t('recipeInstructions')} placeholderTextColor={colors.muted} />
          <Text style={styles.label}>{t('diet')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETS.map((item) => (
              <Pressable key={item} onPress={() => setDiet(item)} style={[styles.outlineButton, { width: '31%', paddingHorizontal: 3, minHeight: 44, backgroundColor: diet === item ? colors.greenSoft : colors.surface }]}>
                <Text style={[styles.outlineText, { fontSize: 12 }]}>{t(item)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 18 }]}>{t('nutritionPerServing')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[[t('calories'), calories, setCalories], [t('protein'), protein, setProtein], [t('carbs'), carbs, setCarbs], [t('fat'), fat, setFat]].map(([label, value, setter]) => (
              <View key={label as string} style={{ width: '47%' }}>
                <Text style={styles.label}>{label as string}</Text>
                <TextInput style={styles.input} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" />
              </View>
            ))}
            <View style={{ width: '47%' }}>
              <Text style={styles.label}>{t('servings')}</Text>
              <TextInput style={styles.input} value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.muted} />
            </View>
          </View>
          <Pressable onPress={save} disabled={!canSave} style={[styles.button, { marginTop: 22, flexDirection: 'row', gap: 6, opacity: canSave ? 1 : 0.5 }]}>
            <Ionicons name="checkmark" size={18} color={colors.onGreen} />
            <Text style={styles.buttonText}>{saving ? '…' : t('create')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
