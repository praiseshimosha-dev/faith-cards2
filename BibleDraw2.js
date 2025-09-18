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
    id: 1,
    name: "Noah's Ark",
    answer: "Noah's Ark",
    hint: "Big boat + animals two-by-two",
    difficulty: "easy",
    strokes: [
      // Ark body (boat shape)
      [{x: 20, y: 80}, {x: 40, y: 90}, {x: 80, y: 90}, {x: 100, y: 80}],
      // Ark cabin
      [{x: 50, y: 60}, {x: 50, y: 80}, {x: 70, y: 80}, {x: 70, y: 60}, {x: 50, y: 60}],
      // Roof
      [{x: 50, y: 60}, {x: 60, y: 50}, {x: 70, y: 60}],
      // Waves
      [{x: 20, y: 95}, {x: 40, y: 100}, {x: 60, y: 95}, {x: 80, y: 100}, {x: 100, y: 95}],
      // Animal 1 (circle-like head)
      [{x: 55, y: 70}, {x: 57, y: 72}, {x: 55, y: 74}, {x: 53, y: 72}, {x: 55, y: 70}],
      // Animal 2
      [{x: 65, y: 70}, {x: 67, y: 72}, {x: 65, y: 74}, {x: 63, y: 72}, {x: 65, y: 70}],
    ],
  },
  {
    id: 2,
    name: "Daniel in the Lion's Den",
    answer: "Daniel in the Lion's Den",
    hint: "Man surrounded by lions",
    difficulty: "hard",
    strokes: [
      // Daniel (stick figure)
      [{x: 60, y: 40}, {x: 60, y: 60}], // body
      [{x: 60, y: 40}, {x: 55, y: 35}, {x: 65, y: 35}, {x: 60, y: 40}], // head triangle
      [{x: 60, y: 50}, {x: 50, y: 55}], // left arm
      [{x: 60, y: 50}, {x: 70, y: 55}], // right arm
      [{x: 60, y: 60}, {x: 55, y: 70}], // left leg
      [{x: 60, y: 60}, {x: 65, y: 70}], // right leg
      // Lions (two circles with tails)
      [{x: 30, y: 70}, {x: 34, y: 74}, {x: 30, y: 78}, {x: 26, y: 74}, {x: 30, y: 70}], // lion head left
      [{x: 35, y: 80}, {x: 40, y: 82}], // tail left
      [{x: 90, y: 70}, {x: 94, y: 74}, {x: 90, y: 78}, {x: 86, y: 74}, {x: 90, y: 70}], // lion head right
      [{x: 95, y: 80}, {x: 100, y: 82}], // tail right
    ],
  },
  {
    id: 3,
    name: "The Nativity",
    answer: "The Nativity",
    hint: "Baby in a manger, bright star",
    difficulty: "medium",
    strokes: [
      // Stable outline
      [{x: 40, y: 50}, {x: 60, y: 30}, {x: 80, y: 50}],
      [{x: 40, y: 50}, {x: 40, y: 80}],
      [{x: 80, y: 50}, {x: 80, y: 80}],
      // Manger
      [{x: 55, y: 75}, {x: 65, y: 75}, {x: 70, y: 80}, {x: 50, y: 80}, {x: 55, y: 75}],
      // Baby head
      [{x: 60, y: 70}, {x: 62, y: 72}, {x: 60, y: 74}, {x: 58, y: 72}, {x: 60, y: 70}],
      // Star
      [{x: 60, y: 20}, {x: 60, y: 10}],
      [{x: 60, y: 20}, {x: 60, y: 30}],
      [{x: 60, y: 20}, {x: 50, y: 20}],
      [{x: 60, y: 20}, {x: 70, y: 20}],
    ],
  },
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
    
    let sIdx = 0;
    let pIdx = 1;
    setDrawState({ strokeIndex: sIdx, pointIndex: pIdx });
  
    // Use a fixed fast interval of 50ms (20 updates per second)
    const TICK_MS = 1000;
    
    drawIntervalRef.current = setInterval(() => {
      if (sIdx >= scene.strokes.length) {
        clearDrawingInterval();
        return;
      }
  
      // Advance multiple points each tick
      for (let i = 0; i < 3; i++) {  // Draw 3 points at a time
        const curStroke = scene.strokes[sIdx];
        pIdx += 1;
        if (pIdx > curStroke.length) {
          sIdx += 1;
          pIdx = 1;
          if (sIdx >= scene.strokes.length) break;
        }
      }
      
      setDrawState({ strokeIndex: sIdx, pointIndex: pIdx });
    }, TICK_MS);
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
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
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
