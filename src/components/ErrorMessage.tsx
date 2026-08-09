import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'An error occurred. Please try again.',
}) => (
  <View style={styles.container}>
    <Text style={styles.text}>❌ {message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff3333',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
