// BibleDraw — single-file Expo React Native demo
import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Keyboard,
  Alert,
  Platform
} from 'react-native';
import Svg, { Polyline, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_W = Math.min(360, Math.floor(SCREEN_W * 0.92));
const CANVAS_H = Math.round((CANVAS_W * 2) / 3); // 3:2 aspect

// Helper: normalize text for comparison (remove punctuation & spaces, lowercase)
const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Example scenes
const SCENES = [
  {
    id: 'noahs-ark',
    name: "Noah's Ark",
    answer: "Noah's Ark",
    hint: 'A very large boat and pairs of animals.',
    difficulty: 'easy',
    strokes: [
      // hull
      [[10, 130], [80, 140], [240, 140], [310, 130], [200, 110], [10, 130]],
      // cabin
      [[170, 80], [240, 80], [240, 110], [170, 110], [170, 80]],
      // mast
      [[190, 80], [190, 50], [210, 40]],
      // sun
      [[280, 30], [295, 15], [310, 30]]
    ]
  },
  {
    id: 'jonah-whale',
    name: 'Jonah and the Whale',
    answer: 'Jonah and the Whale',
    hint: 'A man gets swallowed by a large sea creature.',
    difficulty: 'easy',
    strokes: [
      // whale body
      [[10, 100], [80, 90], [170, 100], [260, 120], [310, 110]],
      // whale tail
      [[260, 120], [285, 90], [300, 120]],
      // water spout
      [[40, 65], [60, 45], [80, 65]]
    ]
  }
];

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [screen, setScreen] = useState('welcome'); // welcome | playing | result

  const [currentScene, setCurrentScene] = useState(null);
  const [drawState, setDrawState] = useState({ strokeIndex: 0, pointIndex: 1 });
  const drawIntervalRef = useRef(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);

  // Difficulty => drawing duration (ms)
  const durationForDifficulty = { easy: 15000, medium: 22000, hard: 30000 };

  // Game logic functions
  function pickSceneForDifficulty(difficulty) {
    const pool = SCENES.filter(s => s.difficulty === difficulty);
    const arr = pool.length ? pool : SCENES;
    const choice = arr[Math.floor(Math.random() * arr.length)];
    return choice;
  }

  function startGame() {
    Keyboard.dismiss();
    const scene = pickSceneForDifficulty(difficulty);
    setCurrentScene(scene);
    setDrawState({ strokeIndex: 0, pointIndex: 1 });
    setShowHint(false);
    setTypedAnswer('');
    setResult(null);
    setScreen('playing');

    const dur = durationForDifficulty[difficulty] || 20000;
    setRemainingSeconds(Math.ceil(dur / 1000));

    startDrawing(scene, dur);
    startCountdown(dur);
  }

  function endGame(finalResult) {
    clearDrawingInterval();
    clearCountdown();
    setResult(finalResult);
    setScreen('result');
  }

  function submitAnswer() {
    if (!currentScene) return;
    const isRight = normalize(currentScene.answer) === normalize(typedAnswer);
    endGame({ correct: isRight, correctAnswer: currentScene.answer });
  }

  function giveUp() {
    if (!currentScene) return;
    endGame({ correct: false, correctAnswer: currentScene.answer });
  }

  function startDrawing(scene, durationMs) {
    clearDrawingInterval();
    if (!scene) return;
    
    // Calculate total points and points per tick
    const totalPoints = scene.strokes.reduce((s, st) => s + Math.max(1, st.length - 1), 0);
    const desiredTicks = 30; // We want roughly 30 updates total for smooth animation
    const pointsPerTick = Math.max(1, Math.ceil(totalPoints / desiredTicks));
    const tickMs = Math.max(10, Math.floor(durationMs / desiredTicks));
    
    let sIdx = 0;
    let pIdx = 1;
    setDrawState({ strokeIndex: sIdx, pointIndex: pIdx });

    drawIntervalRef.current = setInterval(() => {
      if (sIdx >= scene.strokes.length) {
        clearDrawingInterval();
        return;
      }

      // Advance multiple points per tick
      for (let i = 0; i < pointsPerTick; i++) {
        const curStroke = scene.strokes[sIdx];
        pIdx += 1;
        if (pIdx > curStroke.length) {
          sIdx += 1;
          pIdx = 1;
          if (sIdx >= scene.strokes.length) break;
        }
      }
      
      setDrawState({ strokeIndex: sIdx, pointIndex: pIdx });
    }, tickMs);
  }

  function clearDrawingInterval() {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
  }

  function startCountdown(durationMs) {
    clearCountdown();
    const totalSeconds = Math.ceil(durationMs / 1000);
    setRemainingSeconds(totalSeconds);
    let sec = totalSeconds;
    timerRef.current = setInterval(() => {
      sec -= 1;
      setRemainingSeconds(sec);
      if (sec <= 0) {
        clearCountdown();
        endGame({ correct: false, correctAnswer: currentScene ? currentScene.answer : '' });
      }
    }, 1000);
  }

  function clearCountdown() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearDrawingInterval();
      clearCountdown();
    };
  }, []);

  function buildPolylines(scene, ds) {
    if (!scene) return [];
    const pl = [];
    for (let i = 0; i < scene.strokes.length; i++) {
      const stroke = scene.strokes[i];
      if (i < ds.strokeIndex) {
        pl.push(stroke);
      } else if (i === ds.strokeIndex) {
        const slice = stroke.slice(0, Math.max(1, ds.pointIndex));
        pl.push(slice);
      } else {
        break;
      }
    }
    return pl;
  }

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>BibleDraw</Text>
          <Text style={styles.subtitle}>Guess the Bible scene while it gets drawn!</Text>

          <Text style={styles.label}>Your name</Text>
          <TextInput
            placeholder="Type your name"
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.row}> 
            {['easy', 'medium', 'hard'].map(d => (
              <TouchableOpacity 
                key={d} 
                style={[styles.chip, difficulty === d && styles.chipActive]} 
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              if (!playerName.trim()) {
                Alert.alert('Enter name', 'Please type your name before beginning.');
                return;
              }
              startGame();
            }}
          >
            <Text style={styles.buttonText}>Let's Begin</Text>
          </TouchableOpacity>

          <Text style={styles.small}>Drawing time will be 8–16 seconds depending on difficulty.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'playing') {
    const polylines = buildPolylines(currentScene, drawState);
    const lettersCount = (currentScene ? normalize(currentScene.answer).length : 0);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.player}>Player: {playerName}</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>{remainingSeconds}s</Text>
          </View>
        </View>

        <View style={styles.canvasWrap}>
          <Svg width={CANVAS_W} height={CANVAS_H} viewBox="0 0 320 200">
            <Rect x={0} y={0} width={320} height={200} rx={16} fill="#fff" stroke="#f0f0f0" />
            {polylines.map((pts, i) => (
              <Polyline
                key={`p${i}`}
                points={pts.map(p => p.join(',')).join(' ')}
                fill="none"
                stroke="#234E70"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>

        <View style={styles.bottomBar}>
          <TextInput
            placeholder="Type your guess here"
            style={styles.answerInput}
            value={typedAnswer}
            onChangeText={setTypedAnswer}
            onSubmitEditing={submitAnswer}
          />
          <View style={styles.rightSide}>
            <Text style={styles.letters}>{lettersCount} letters</Text>
            <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(!showHint)}>
              <Text style={styles.hintText}>?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showHint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Hint</Text>
            <Text style={styles.hintBody}>{currentScene.hint}</Text>
            <TouchableOpacity onPress={() => setShowHint(false)} style={styles.closeHint}>
              <Text style={{color: '#fff'}}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallButton} onPress={submitAnswer}>
            <Text>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={giveUp}>
            <Text>Give Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'result') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {result && result.correct ? 'Correct!' : 'Time Up / Incorrect'}
          </Text>
          <Text style={styles.subtitle}>Answer: {result && result.correctAnswer}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setScreen('welcome')}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#ddd', marginTop: 8 }]} 
            onPress={() => setScreen('welcome')}
          >
            <Text style={{ color: '#333' }}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDF6F0', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  card: { 
    width: '92%', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    elevation: 2 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#234E70', 
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#6b6b6b', 
    marginBottom: 12 
  },
  label: { 
    fontSize: 13, 
    marginTop: 8, 
    marginBottom: 6, 
    color: '#444' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#eee', 
    padding: 10, 
    borderRadius: 10, 
    backgroundColor: '#fff' 
  },
  row: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  chip: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee', 
    marginRight: 8 
  },
  chipActive: { 
    backgroundColor: '#FBE8E6', 
    borderColor: '#f2cbd1' 
  },
  chipText: { 
    color: '#444' 
  },
  chipTextActive: { 
    color: '#b44' 
  },
  button: { 
    backgroundColor: '#8FB9FF', 
    padding: 14, 
    borderRadius: 12, 
    marginTop: 12, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  small: { 
    fontSize: 12, 
    color: '#777', 
    marginTop: 8 
  },
  header: { 
    width: '92%', 
    marginTop: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  player: { 
    fontSize: 14, 
    color: '#333' 
  },
  timerBox: { 
    backgroundColor: '#fff', 
    padding: 8, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  timerText: { 
    fontWeight: '700' 
  },
  canvasWrap: { 
    marginTop: 12, 
    width: CANVAS_W, 
    height: CANVAS_H, 
    borderRadius: 16, 
    overflow: 'hidden', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bottomBar: { 
    position: 'absolute', 
    bottom: Platform.OS === 'android' ? 100 : 30, 
    left: 12, 
    right: 12, 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 8, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  answerInput: { 
    flex: 1, 
    padding: 10 
  },
  rightSide: { 
    width: 110, 
    alignItems: 'flex-end', 
    flexDirection: 'row', 
    justifyContent: 'flex-end' 
  },
  letters: { 
    marginRight: 8, 
    color: '#666' 
  },
  hintButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F6D6D6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  hintText: { 
    fontWeight: '700' 
  },
  hintBox: { 
    position: 'absolute', 
    bottom: Platform.OS === 'android' ? 170 : 100, 
    left: 24, 
    right: 24, 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  hintTitle: { 
    fontWeight: '700', 
    marginBottom: 6 
  },
  hintBody: { 
    color: '#555' 
  },
  closeHint: { 
    marginTop: 8, 
    backgroundColor: '#8FB9FF', 
    padding: 8, 
    borderRadius: 8, 
    alignSelf: 'flex-end' 
  },
  actionRow: { 
    position: 'absolute', 
    bottom: Platform.OS === 'android' ? 60 : 8, 
    left: 12, 
    right: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  smallButton: { 
    backgroundColor: '#fff', 
    padding: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#eee' 
  }
});
