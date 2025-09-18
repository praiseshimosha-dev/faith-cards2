// App.js
// Expo React Native app: FaithCardsApp
// Single-file example you can paste into a new Expo project (expo init -t blank)

import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Dimensions,
  Keyboard,
  Alert
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QUESTIONS = [
  // Faith Journey
  { id: 1, category: 'Faith Journey', text: 'When did you first notice God working in your life?' },
  { id: 2, category: 'Faith Journey', text: 'Who has influenced your faith the most and why?' },
  { id: 3, category: 'Faith Journey', text: "What event led you to take faith seriously?" },
  { id: 4, category: 'Faith Journey', text: 'What spiritual habit helped you most in your growth?' },
  { id: 5, category: 'Faith Journey', text: 'What question about God are you still seeking an answer to?' },
  { id: 6, category: 'Faith Journey', text: 'Describe a time when your faith was challenged.' },
  { id: 7, category: 'Faith Journey', text: 'What role does prayer play in your daily life?' },
  { id: 8, category: 'Faith Journey', text: 'Which story of your life would you tell someone to explain your faith?' },
  { id: 9, category: 'Faith Journey', text: 'What do you wish you had known earlier in your faith journey?' },
  { id: 10, category: 'Faith Journey', text: 'How do you celebrate spiritual milestones?' },

  // Faith & The World
  { id: 11, category: 'Faith & The World', text: 'How does your faith shape the way you view current events?' },
  { id: 12, category: 'Faith & The World', text: 'Where should Christians engage in social justice, and how?' },
  { id: 13, category: 'Faith & The World', text: 'How do you apply Biblical teaching to your work or school life?' },
  { id: 14, category: 'Faith & The World', text: 'What responsibility do believers have toward the environment?' },
  { id: 15, category: 'Faith & The World', text: 'How do you talk about faith with people who disagree with you?' },
  { id: 16, category: 'Faith & The World', text: 'Should faith influence politics? Why or why not?' },
  { id: 17, category: 'Faith & The World', text: 'What cultural practice would you question through the lens of faith?' },
  { id: 18, category: 'Faith & The World', text: 'How can your faith community better serve the city or town it’s in?' },
  { id: 19, category: 'Faith & The World', text: 'Where do you see faith and science working together?' },
  { id: 20, category: 'Faith & The World', text: 'How does global suffering shape your understanding of God?' },

  // Bible Truths
  { id: 21, category: 'Bible Truths', text: 'What Bible verse brings you comfort and why?' },
  { id: 22, category: 'Bible Truths', text: 'Which parable of Jesus speaks to you most?' },
  { id: 23, category: 'Bible Truths', text: 'What is one Bible story you would recommend everyone read?' },
  { id: 24, category: 'Bible Truths', text: 'How do you approach difficult or confusing Bible passages?' },
  { id: 25, category: 'Bible Truths', text: 'What truth from Scripture changed how you live?' },
  { id: 26, category: 'Bible Truths', text: 'Which Old Testament figure do you relate to most, and why?' },
  { id: 27, category: 'Bible Truths', text: 'How do you memorize or remember Scripture?' },
  { id: 28, category: 'Bible Truths', text: 'Is there a command or teaching in the Bible you struggle with?' },
  { id: 29, category: 'Bible Truths', text: 'Which book of the Bible would you like to study next?' },
  { id: 30, category: 'Bible Truths', text: 'How does the Bible define love in ways that surprised you?' },

  // Personal Beliefs
  { id: 31, category: 'Personal Beliefs', text: 'Do you think faith is mostly feeling, practice, or belief? Why?' },
  { id: 32, category: 'Personal Beliefs', text: 'How do you make moral decisions when guidance is unclear?' },
  { id: 33, category: 'Personal Beliefs', text: 'What does spiritual maturity look like to you?' },
  { id: 34, category: 'Personal Beliefs', text: 'How do you deal with doubts about your beliefs?' },
  { id: 35, category: 'Personal Beliefs', text: 'Do you believe God answers all prayers? Explain.' },
  { id: 36, category: 'Personal Beliefs', text: 'What do you believe about life after death?' },
  { id: 37, category: 'Personal Beliefs', text: 'Are there beliefs you’ve changed in the last 5 years?' },
  { id: 38, category: 'Personal Beliefs', text: 'How important is tradition in your faith?' },
  { id: 39, category: 'Personal Beliefs', text: 'What role should doubt play in spiritual growth?' },
  { id: 40, category: 'Personal Beliefs', text: 'Is there a belief you hold that you find hard to discuss? Why?' },
];

export default function App() {
  const [current, setCurrent] = useState(null);
  const [lastId, setLastId] = useState(null);

  useEffect(() => {
    // initial animation config
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  function pickRandomQuestion(category = null) {
    // filter by category when provided
    const pool = category ? QUESTIONS.filter(q => q.category === category) : QUESTIONS;
    if (!pool.length) return null;
    let choice = null;
    // try avoid immediate repeat
    do {
      const idx = Math.floor(Math.random() * pool.length);
      choice = pool[idx];
    } while (pool.length > 1 && choice.id === lastId);

    setLastId(choice.id);
    // animate
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setCurrent(choice);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>Faith Cards</Text>
        <Text style={styles.subtitle}>Deep questions for real conversations</Text>
      </View>

      <View style={styles.center}>
        {current ? (
          <View style={[styles.card, styles.cardElevated]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setCurrent(null);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.category}>{current.category}</Text>
            <Text style={styles.question}>{current.text}</Text>

            <View style={styles.cardButtons}>
              <TouchableOpacity
                style={[styles.smallBtn, styles.primarySmall]}
                onPress={() => pickRandomQuestion()}
              >
                <Text style={styles.smallBtnText}>Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Tap the button to get a question</Text>
            <Text style={styles.emptySubtitle}>Or choose a category below</Text>

            <View style={styles.categoriesRow}>
              {['Faith Journey', 'Faith & The World', 'Bible Truths', 'Personal Beliefs'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.catBtn}
                  onPress={() => pickRandomQuestion(cat)}
                >
                  <Text style={styles.catBtnText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.randomBtn}
          onPress={() => pickRandomQuestion()}
        >
          <Text style={styles.randomBtnText}>Random Question 🎲</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0B6E4F',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#12626A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardElevated: {
    backgroundColor: '#FFF7EA',
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C65A00',
  },
  question: {
    marginTop: 12,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#333',
  },
  cardButtons: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  altBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  primarySmall: {
    backgroundColor: '#0B6E4F',
  },
  smallBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#064E3B',
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#0F766E',
  },
  categoriesRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  catBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    margin: 6,
    elevation: 4,
  },
  catBtnText: {
    fontWeight: '700',
    color: '#0B6E4F',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 40 : 20, // Add extra padding on Android
    marginBottom: Platform.OS === 'android' ? 20 : 0, // Add margin on Android
  },
  randomBtn: {
    backgroundColor: '#0B6E4F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});