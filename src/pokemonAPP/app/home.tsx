import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/Button';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>pokemonAPP</Text>

      <View style={styles.buttonsContainer}>
        <Button title="Play" onPress={() => console.log('Play pressed')} />
        <Button title="Collection" onPress={() => router.push('/collection')} />
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
    marginBottom: 50,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    width: '100%',
  },
});
