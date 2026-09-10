import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { colors, styles } from '@/src/theme';
import { Diet } from '@/src/types';
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
  const [diet, setDiet] = useState<Diet>('balanced');
  const save = async () => { if (!name.trim()) return; const id = `custom-recipe-${Date.now()}`; await db.runAsync('INSERT INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', id, name.trim(), name.trim(), diet, JSON.stringify(parseIngredients(ingredients)), instructions.trim(), instructions.trim(), parseNumber(calories), parseNumber(protein), parseNumber(carbs), parseNumber(fat), 1); router.back(); };
  return <><Stack.Screen options={{ title: t('createRecipe'), presentation: 'modal', headerShown: true, headerTintColor: colors.green, headerStyle: { backgroundColor: colors.bg } }} /><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content}><Text style={styles.subtitle}>{t('ingredients')} · e.g. 150 g tomato</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('recipeName')} placeholderTextColor={colors.muted} /><TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top', marginTop: 10 }]} multiline value={ingredients} onChangeText={setIngredients} placeholder={t('ingredients')} placeholderTextColor={colors.muted} /><TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top', marginTop: 10 }]} multiline value={instructions} onChangeText={setInstructions} placeholder={t('recipeInstructions')} placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('diet')}</Text><View style={{ flexDirection: 'row', gap: 8 }}>{(['balanced', 'vegetarian', 'vegan'] as Diet[]).map((item) => <Pressable key={item} onPress={() => setDiet(item)} style={[styles.outlineButton, { flex: 1, paddingHorizontal: 3, backgroundColor: diet === item ? colors.greenSoft : colors.surface }]}><Text style={[styles.outlineText, { fontSize: 12 }]}>{t(item)}</Text></Pressable>)}</View><Text style={[styles.label, { marginTop: 18 }]}>{t('nutritionPerServing')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[[t('calories'), calories, setCalories], [t('protein'), protein, setProtein], [t('carbs'), carbs, setCarbs], [t('fat'), fat, setFat]].map(([label, value, setter]) => <View key={label as string} style={{ width: '47%' }}><Text style={styles.label}>{label as string}</Text><TextInput style={styles.input} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" /></View>)}</View><Pressable onPress={save} style={[styles.button, { marginTop: 22 }]}><Text style={styles.buttonText}>{t('create')}</Text></Pressable></ScrollView></KeyboardAvoidingView></>;
}
