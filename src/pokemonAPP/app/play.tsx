// app/play.tsx
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import PlayModal from '../components/PlayModal';

const API_URL   = Constants.expoConfig?.extra?.pokemonApiUrl;
const { width } = Dimensions.get('window');
const CARD_SIZE = width * 0.18;
const SLOT_SIZE = width * 0.45;

type Pokemon = {
  id:     number;
  image:  string;
  hp:     number;
  rarity: number;
};

export default function Play() {
  const router = useRouter();

  // --- state ---
  const [hand, setHand]               = useState<Pokemon[]>([]);
  const [loadingHand, setLoadingHand] = useState(false);

  const [confirmCard, setConfirmCard] = useState<Pokemon | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [playerSlot, setPlayerSlot] = useState<Pokemon | null>(null);
  const [enemySlot, setEnemySlot]   = useState<Pokemon | null>(null);

  const [playerPts, setPlayerPts] = useState(0);
  const [enemyPts, setEnemyPts]   = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const [finalVisible, setFinalVisible] = useState(false);
  const [finalMsg, setFinalMsg]         = useState('');

  // animated result text
  const [resultText, setResultText] = useState<string | null>(null);
  const fadeAnim                    = useRef(new Animated.Value(0)).current;

  // draw 5 cards
  const drawHand = async () => {
    setLoadingHand(true);
    try {
      const res  = await fetch(`${API_URL}/game/draw`, { credentials:'include' });
      const arr  = await res.json();
      setHand(arr);
    } catch {
      Alert.alert('Erro','Não foi possível buscar suas cartas.');
    }
    setLoadingHand(false);
  };

  useEffect(() => {
    drawHand();
  }, []);

  // flash WIN/LOSE/DRAW
  const flashResult = (text: string) => {
    setResultText(text);
    fadeAnim.setValue(1);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => setResultText(null));
  };

  // points spheres
  const renderPoints = (count: number) => (
    <View style={styles.spheres}>
      {Array.from({ length: 3 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.sphere,
            i < count ? styles.sphereFilled : styles.sphereEmpty,
          ]}
        />
      ))}
    </View>
  );

  // select card → confirm modal
  const onSelectCard = (card: Pokemon) => {
    if (isPlaying) return;
    setConfirmCard(card);
    setConfirmVisible(true);
  };
  const onConfirmPlay = () => {
    setConfirmVisible(false);
    if (confirmCard) doPlay(confirmCard);
  };

  // core play
  const doPlay = async (card: Pokemon) => {
    setIsPlaying(true);
    setPlayerSlot(card);
    setHand(h => h.filter(c => c.id !== card.id));

    // enemy draw
    let enemy: Pokemon;
    try {
      const er = await fetch(`${API_URL}/game/enemy`, { credentials:'include' });
      enemy = await er.json();
      setEnemySlot(enemy);
    } catch {
      Alert.alert('Erro','Não puxou carta do inimigo.');
      setIsPlaying(false);
      return;
    }

    // resolve
    try {
      const rr = await fetch(`${API_URL}/game/resolve`, {
        method: 'POST',
        credentials:'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          player: { hp:card.hp, rarity:card.rarity },
          enemy
        })
      });
      const { winner } = await rr.json();

      if (winner === 'player') {
        setPlayerPts(p => p + 1);
        flashResult('WIN');
      } else if (winner === 'enemy') {
        setEnemyPts(p => p + 1);
        flashResult('LOSE');
      } else {
        // DRAW: discard the played card and draw exactly one replacement
        flashResult('DRAW');
        try {
          const oneRes = await fetch(`${API_URL}/game/draw_one`, {
            credentials: 'include'
          });
          const newCard = await oneRes.json();
          setHand(h => [...h, newCard]);
        } catch {
          Alert.alert('Erro', 'Não foi possível repor carta após empate.');
        }
      }

      // check end
      const newP = winner==='player'? playerPts+1: playerPts;
      const newE = winner==='enemy'?  enemyPts+1:  enemyPts;
      if (newP >= 3 || newE >= 3) {
        const rr2 = await fetch(`${API_URL}/game/reward`, {
          method:'POST',
          credentials:'include',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ winner })
        });
        const rd = await rr2.json();
        const msg = newP > newE
          ? `Congratulations! You won 5 currency`
          : `Game Over! You lost`;
        setFinalMsg(msg);
        setFinalVisible(true);
      }
    } catch {
      Alert.alert('Erro','Falha ao resolver combate.');
    }

    // clear slots
    setTimeout(() => {
      setPlayerSlot(null);
      setEnemySlot(null);
      setIsPlaying(false);
    }, 1600);
  };

  // hand card with colored border
  const renderHand = ({ item }: { item: Pokemon }) => {
    const color = item.rarity === 1 ? '#FFD700' : '#cd7f32';
    return (
      <TouchableOpacity onPress={() => onSelectCard(item)} disabled={isPlaying}>
        <View style={[styles.card, { borderColor: color, borderWidth: 2 }]}>
          <Image source={{ uri:item.image }} style={styles.cardImage} />
        </View>
      </TouchableOpacity>
    );
  };

  // border color for slots
  const slotBorder = (c: Pokemon | null) => {
    if (!c) return '#555';
    return c.rarity === 1 ? '#FFD700' : '#cd7f32';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Opponent */}
      <Text style={styles.label}>Opponent</Text>
      {renderPoints(enemyPts)}

      {/* Opponent slot */}
      <View style={[
        styles.slotContainer,
        { borderColor: slotBorder(enemySlot) }
      ]}>
        {enemySlot && (
          <Image source={{ uri:enemySlot.image }} style={styles.slotImage}/>
        )}
      </View>

      {/* Combat result */}
      {resultText && (
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <Text style={styles.resultText}>{resultText}</Text>
        </Animated.View>
      )}

      {/* Player slot */}
      <View style={[
        styles.slotContainer,
        { borderColor: slotBorder(playerSlot) }
      ]}>
        {playerSlot && (
          <Image source={{ uri:playerSlot.image }} style={styles.slotImage}/>
        )}
      </View>

      {/* You */}
      <Text style={styles.label}>You</Text>
      {renderPoints(playerPts)}

      {/* Hand */}
      {loadingHand ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <FlatList
          data={hand}
          keyExtractor={i => i.id.toString()}
          horizontal
          renderItem={renderHand}
          contentContainerStyle={styles.hand}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {/* Confirm modal */}
      <PlayModal
        visible={confirmVisible}
        card={confirmCard}
        onPlay={onConfirmPlay}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* Final modal */}
      <Modal visible={finalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.finalBox}>
            <Text style={styles.finalText}>{finalMsg}</Text>
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#121212',
    alignItems:      'center',
    paddingTop:      40,
    paddingBottom:   16,
  },
  label: {
    color:      '#fff',
    fontSize:   18,
    marginBottom: 8,
  },

  spheres: {
    flexDirection:  'row',
    marginBottom:   12,
  },
  sphere: {
    width:          14,
    height:         14,
    borderRadius:   7,
    marginHorizontal: 4,
  },
  sphereFilled: { backgroundColor:'#FFD700' },
  sphereEmpty:  { borderWidth:1, borderColor:'#555' },

  slotContainer: {
    width:          SLOT_SIZE,
    height:         SLOT_SIZE,
    borderWidth:    3,
    borderRadius:   12,
    backgroundColor:'#1e1e1e',
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   16,
  },
  slotImage: {
    width:'90%',
    height:'90%',
    resizeMode:'contain',
  },

  resultContainer: {
    height:          50,
    marginBottom:    16,
    justifyContent:  'center',
    alignItems:      'center',
  },
  resultText: {
    fontSize:   36,
    fontWeight: 'bold',
    color:      '#FFD700',
  },

  hand: {
    paddingTop:    20,
    paddingBottom: 10,
  },
  card: {
    backgroundColor:'#1e1e1e',
    margin:          6,
    borderRadius:    8,
    width:           CARD_SIZE,
    aspectRatio:     1,
    justifyContent:  'center',
    alignItems:      'center',
  },
  cardImage: {
    width:'80%',
    height:'80%',
    resizeMode:'contain',
  },

  overlay: {
    flex:           1,
    backgroundColor:'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems:     'center',
  },
  finalBox: {
    backgroundColor:'#1e1e1e',
    padding:        24,
    borderRadius:   12,
    alignItems:     'center',
  },
  finalText: {
    color:      '#FFD700',
    fontSize:   20,
    marginBottom: 20,
    textAlign:  'center',
  },
  okButton: {
    backgroundColor:'#FFD700',
    paddingVertical:10,
    paddingHorizontal:30,
    borderRadius:8,
  },
  okText: {
    color:      '#121212',
    fontSize:   16,
    fontWeight: 'bold',
  },
});
