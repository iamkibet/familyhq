import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { WebPage, WebContainer, WebCard } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function ContactWeb() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <WebPage>
      <WebContainer>
        <Text style={styles.h1}>Contact</Text>
        <Text style={styles.lead}>Have feedback or want a demo? Send a message.</Text>

        <WebCard>
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="rgba(234,240,255,0.45)" style={styles.input} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="rgba(234,240,255,0.45)" style={styles.input} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what you need…"
                placeholderTextColor="rgba(234,240,255,0.45)"
                style={[styles.input, styles.textarea]}
                multiline
              />
            </View>

            <Pressable style={styles.btn} onPress={() => {}}>
              <Text style={styles.btnText}>Send</Text>
            </Pressable>
            <Text style={styles.note}>This is a UI placeholder. Hook it up to email/API when you’re ready.</Text>
          </View>
        </WebCard>
      </WebContainer>
    </WebPage>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    h1: {
      color: theme.colors.text,
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
      marginBottom: 18,
    },
    form: {
      gap: 14,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    field: {
      flex: 1,
      minWidth: 240,
      gap: 6,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface2,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 14,
    },
    textarea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    btn: {
      marginTop: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnText: {
      color: theme.colors.bg === '#FFFFFF' ? '#FFFFFF' : '#0B1220',
      fontWeight: '900',
    },
    note: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 6,
    },
  });
}


