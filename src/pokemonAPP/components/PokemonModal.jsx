import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.pokemonApiUrl;
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

type Pokemon = {
  id: number;
  image: string;
  owned: boolean;
  rarity: number | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  pokemon: Pokemon | null;
  onSuccess: () => void;
};

export default function PokemonModal({ visible, onClose, pokemon, onSuccess }: Props) {
  if (!pokemon) return null;

  const handleBuyOrUpgrade = async () => {
    try {
      const response = await fetch(`${API_URL}/storage/buy`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_pokemon: pokemon.id }),
      });

      const data = await response.json();

      if (data.error) {
        Alert.alert('Erro', data.error);
      } else {
        Alert.alert('Sucesso', data.message);
        onClose();
        onSuccess();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível completar a operação.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={{ uri: pokemon.image }}
            style={
              pokemon.owned && pokemon.rarity === 1
                ? styles.bigImage
                : styles.image
            }
          />
          {pokemon.owned ? (
            pokemon.rarity === 0 ? (
              <TouchableOpacity style={styles.button} onPress={handleBuyOrUpgrade}>
                <Text style={styles.buttonText}>Upgrade</Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleBuyOrUpgrade}>
              <Text style={styles.buttonText}>Buy</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1e1e1e',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: windowWidth * 0.85, // 🔥 85% da largura da tela
    maxWidth: 500,
  },
  image: {
    width: windowWidth * 0.6, // 🔥 60% da largura da tela
    height: windowWidth * 0.6,
    resizeMode: 'contain',
    marginBottom: 25,
  },
  bigImage: {
    width: windowWidth * 0.8, // 🔥 80% da largura da tela
    height: windowWidth * 0.8,
    resizeMode: 'contain',
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 18,
  },
  close: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
