import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import PokemonModal from '../components/PokemonModal';

const API_URL = Constants.expoConfig?.extra?.pokemonApiUrl;
const windowWidth = Dimensions.get('window').width;

type Pokemon = {
  id: number;
  image: string;
  owned: boolean;
  rarity: number | null;
};

export default function Collection() {
  const router = useRouter();
  const [currency, setCurrency] = useState<number>(0);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [stage, setStage] = useState<'owned' | 'unowned'>('owned');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const fetchCurrency = async () => {
    try {
      const response = await fetch(`${API_URL}/storage/currency`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCurrency(data.currency);
    } catch {
      setCurrency(0);
    }
  };

  const fetchPokemons = async () => {
    if (!hasMore || isFetching) return;
    setIsFetching(true);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/storage/pokemons?offset=${offset}&limit=30&stage=${stage}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      const newPokemons = data.map((p: any) => ({
        id: p.id,
        image: p.image,
        owned: stage === 'owned',
        rarity: p.rarity ?? null,
      }));

      setPokemons((prev) => {
        const combined = [...prev, ...newPokemons];
        const uniqueMap = new Map<string, Pokemon>();
        combined.forEach((p) => {
          const key = `${p.id}-${p.owned ? 'owned' : 'unowned'}`;
          uniqueMap.set(key, p);
        });
        return Array.from(uniqueMap.values());
      });

      if (data.length < 30) {
        if (stage === 'owned') {
          setStage('unowned');
          setOffset(0);
        } else {
          setHasMore(false);
        }
      } else {
        setOffset((prev) => prev + 30);
      }
    } catch (error) {
      console.error('Erro ao buscar pokémons:', error);
    }

    setLoading(false);
    setIsFetching(false);
  };

  const refreshData = async () => {
    setOffset(0);
    setStage('owned');
    setHasMore(true);
    setPokemons([]);
    await fetchCurrency();
    await fetchPokemons();
  };

  useEffect(() => {
    fetchCurrency();
    fetchPokemons();
  }, []);

  useEffect(() => {
    if (stage === 'unowned' && offset === 0 && pokemons.length !== 0) {
      fetchPokemons();
    }
  }, [stage, offset]);

  const renderItem = useCallback(
    ({ item }: { item: Pokemon }) => {
      let borderColor = '#888'; // padrão unowned

      if (item.owned) {
        if (item.rarity === 0) borderColor = '#cd7f32'; // bronze
        if (item.rarity === 1) borderColor = '#FFD700'; // ouro
      }

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedPokemon(item);
            setModalVisible(true);
          }}
        >
          <View style={[styles.card, { borderColor }]}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.currency}>💰 {currency}</Text>
      </View>

      <FlatList
        data={pokemons}
        keyExtractor={(item) => `${item.id}-${item.owned ? 'owned' : 'unowned'}`}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (!isFetching && hasMore) {
            fetchPokemons();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color="#FFD700" /> : null
        }
      />

      <PokemonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        pokemon={selectedPokemon}
        onSuccess={refreshData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
    paddingTop: 10,
  },
  back: {
    color: '#fff',
    fontSize: 18,
  },
  currency: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    margin: 5,
    borderRadius: 8,
    width: (windowWidth - 40) / 3,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  image: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
});
