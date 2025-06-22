import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';

type Pokemon = {
  id:      number;
  image:   string;
  hp:      number;
  rarity:  number;
  owned?:  boolean;
};

type Props = {
  visible:      boolean;
  card:         Pokemon | null;
  onPlay:       () => void;
  onCancel:     () => void;
};

const windowWidth = Dimensions.get("window").width;

export default function PlayModal({
  visible,
  card,
  onPlay,
  onCancel
}: Props) {
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { width: windowWidth * 0.85 }]}>
          <Image
            source={{ uri: card.image }}
            style={{
              width: windowWidth * 0.6,
              height: windowWidth * 0.6,
              resizeMode: "contain",
              marginBottom: 20
            }}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.playButton} onPress={onPlay}>
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent:  "center",
    alignItems:      "center"
  },
  content: {
    backgroundColor: "#1e1e1e",
    padding:         20,
    borderRadius:    12,
    alignItems:      "center"
  },
  buttons: {
    flexDirection:    "row",
    justifyContent:   "space-between",
    width:            "100%"
  },
  playButton: {
    flex:            1,
    marginRight:     5,
    backgroundColor: "#4caf50",
    padding:         12,
    borderRadius:    8,
    alignItems:      "center"
  },
  cancelButton: {
    flex:            1,
    marginLeft:      5,
    backgroundColor: "#f44336",
    padding:         12,
    borderRadius:    8,
    alignItems:      "center"
  },
  playText:   { color: "#fff", fontWeight: "bold" },
  cancelText: { color: "#fff", fontWeight: "bold" }
});
