import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Constants from 'expo-constants';
import Button from '../components/Button';

const API_URL = Constants.expoConfig?.extra?.pokemonApiUrl;

export default function Index() {
  const router = useRouter();
  const [login, setLogin] = useState('');

  const handleLogin = async () => {
    if (!login) {
      Alert.alert('Erro', 'Por favor, insira seu login.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ login }),
      });

      const data = await response.json();

      if (data.message === 'Login realizado com sucesso!') {
        router.push('/home');
      } else {
        Alert.alert('Erro no login', data.error || 'Tente novamente');
      }
    } catch (error) {
      Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>pokemonAPP</Text>

      <TextInput
        placeholder="Digite seu login"
        placeholderTextColor="#aaa"
        value={login}
        onChangeText={setLogin}
        style={styles.input}
      />

      <Button title="Login" onPress={handleLogin} />

      <View style={{ marginTop: 20 }}>
        <Button
          title="Create an account"
          onPress={() => router.push('/register')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 40,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  input: {
    width: '100%',
    height: 55,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    fontSize: 18,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
});
