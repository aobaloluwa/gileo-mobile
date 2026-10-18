
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';

type AppScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
  contentStyle?: ViewStyle;
};

export default function AppScreen({
  children,
  scrollable = true,
  centered = false,
  contentStyle,
}: AppScreenProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            centered && styles.centered,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            centered && styles.centered,
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  centered: {
    justifyContent: 'center',
  },
});
