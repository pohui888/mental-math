import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Plus, Minus, X, Divide, Play, RotateCcw, Settings, Check, AlertCircle } from 'lucide-react-native';

type Operation = '+' | '-' | '×' | '÷';

interface GameState {
  operation: Operation | null;
  numbers: number[];
  currentIndex: number;
  isPlaying: boolean;
  showAnswer: boolean;
  userAnswer: string;
  correctAnswer: number;
  score: number;
  totalGames: number;
  currentRound: number;
  totalRounds: number;
  showResult: boolean;
  isCorrect: boolean;
}

interface GameSettings {
  totalQuestions: number;
  timeInterval: number;
}

interface ModalState {
  visible: boolean;
  selectedOperation: Operation | null;
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [gameState, setGameState] = useState<GameState>({
    operation: null,
    numbers: [],
    currentIndex: -1,
    isPlaying: false,
    showAnswer: false,
    userAnswer: '',
    correctAnswer: 0,
    score: 0,
    totalGames: 0,
    currentRound: 0,
    totalRounds: 0,
    showResult: false,
    isCorrect: false,
  });

  const [settings, setSettings] = useState<GameSettings>({
    totalQuestions: 5,
    timeInterval: 1000, // 1 second default
  });

  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    selectedOperation: null,
  });

  const [tempSettings, setTempSettings] = useState<GameSettings>(settings);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const operations = [
    { type: '+' as Operation, icon: Plus, color: '#3B82F6', label: 'Addition' },
    { type: '-' as Operation, icon: Minus, color: '#EF4444', label: 'Subtraction' },
    { type: '×' as Operation, icon: X, color: '#10B981', label: 'Multiplication' },
    { type: '÷' as Operation, icon: Divide, color: '#F59E0B', label: 'Division' },
  ];

  const generateRandomNumbers = () => {
    const numbers = [];
    for (let i = 0; i < settings.totalQuestions; i++) {
      if (gameState.operation === '÷') {
        // For division, use smaller numbers to avoid decimals
        numbers.push(Math.floor(Math.random() * 10) + 1);
      } else if (gameState.operation === '×') {
        // For multiplication, use smaller numbers
        numbers.push(Math.floor(Math.random() * 12) + 1);
      } else {
        // For addition and subtraction
        numbers.push(Math.floor(Math.random() * 20) + 1);
      }
    }
    return numbers;
  };

  const calculateAnswer = (numbers: number[], operation: Operation): number => {
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      switch (operation) {
        case '+':
          result += numbers[i];
          break;
        case '-':
          result -= numbers[i];
          break;
        case '×':
          result *= numbers[i];
          break;
        case '÷':
          result = Math.round((result / numbers[i]) * 100) / 100; // Round to 2 decimals
          break;
      }
    }
    return Math.round(result * 100) / 100; // Round final result
  };

  const openSettingsModal = (operation: Operation) => {
    setModalState({
      visible: true,
      selectedOperation: operation,
    });
    setTempSettings(settings);
  };

  const closeModal = () => {
    setModalState({
      visible: false,
      selectedOperation: null,
    });
  };

  const applySettings = () => {
    setSettings(tempSettings);
    if (modalState.selectedOperation) {
      startGame(modalState.selectedOperation);
    }
    closeModal();
  };

  const startGame = (operation: Operation) => {
    const numbers = generateRandomNumbers();
    const correctAnswer = calculateAnswer(numbers, operation);
    
    setGameState(prev => ({
      ...prev,
      operation,
      numbers,
      currentIndex: 0,
      isPlaying: true,
      showAnswer: false,
      userAnswer: '',
      correctAnswer,
      currentRound: 1,
      totalRounds: settings.totalQuestions,
      showResult: false,
      isCorrect: false,
    }));
  };

  const animateNumber = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  useEffect(() => {
    if (gameState.isPlaying && gameState.currentIndex < gameState.numbers.length) {
      animateNumber();
      const timer = setTimeout(() => {
        if (gameState.currentIndex < gameState.numbers.length - 1) {
          setGameState(prev => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            isPlaying: false,
            showAnswer: true,
          }));
        }
      }, settings.timeInterval);

      return () => clearTimeout(timer);
    }
  }, [gameState.isPlaying, gameState.currentIndex, gameState.numbers.length, settings.timeInterval]);

  const submitAnswer = () => {
    const userNum = parseFloat(gameState.userAnswer);
    const isCorrect = Math.abs(userNum - gameState.correctAnswer) < 0.01;
    
    setGameState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      totalGames: prev.totalGames + 1,
      showResult: true,
      isCorrect,
    }));

    // Show result for 2 seconds, then continue or end game
    setTimeout(() => {
      if (gameState.currentRound < settings.totalQuestions) {
        startNextRound();
      } else {
        resetGame();
      }
    }, 2000);
  };

  const startNextRound = () => {
    const numbers = generateRandomNumbers();
    const correctAnswer = calculateAnswer(numbers, gameState.operation!);
    
    setGameState(prev => ({
      ...prev,
      numbers,
      currentIndex: 0,
      isPlaying: true,
      showAnswer: false,
      userAnswer: '',
      correctAnswer,
      currentRound: prev.currentRound + 1,
      showResult: false,
      isCorrect: false,
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      operation: null,
      numbers: [],
      currentIndex: -1,
      isPlaying: false,
      showAnswer: false,
      userAnswer: '',
      correctAnswer: 0,
      currentRound: 0,
      totalRounds: 0,
      showResult: false,
      isCorrect: false,
    }));
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  };

  const getCurrentOperationColor = () => {
    const op = operations.find(o => o.type === gameState.operation);
    return op ? op.color : '#6B7280';
  };

  let mainContent;

  if (!gameState.operation) {
    mainContent = (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mental Math Trainer</Text>
          <Text style={styles.subtitle}>Choose your operation mode</Text>
          {gameState.totalGames > 0 && (
            <Text style={styles.score}>
              Score: {gameState.score}/{gameState.totalGames} ({Math.round((gameState.score / gameState.totalGames) * 100)}%)
            </Text>
          )}
        </View>

        <View style={styles.operationsGrid}>
          {operations.map((operation) => {
            const IconComponent = operation.icon;
            return (
              <TouchableOpacity
                key={operation.type}
                style={[styles.operationButton, { borderColor: operation.color }]}
                onPress={() => openSettingsModal(operation.type)}
                activeOpacity={0.7}
              >
                <IconComponent size={32} color={operation.color} />
                <Text style={[styles.operationLabel, { color: operation.color }]}>
                  {operation.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  } else if (gameState.isPlaying) {
    mainContent = (
      <View style={[styles.container, styles.gameContainer]}>
        <View style={styles.gameHeader}>
          <Text style={[styles.operationTitle, { color: getCurrentOperationColor() }]}>
            {operations.find(o => o.type === gameState.operation)?.label}
          </Text>
          
          <View style={styles.progressContainer}>
            {gameState.numbers.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index <= gameState.currentIndex 
                      ? getCurrentOperationColor() 
                      : '#E5E7EB'
                  }
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.numberDisplay}>
          <Animated.View
            style={[
              styles.numberContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={[styles.currentNumber, { color: getCurrentOperationColor() }]}>
              {gameState.numbers[gameState.currentIndex]}
            </Text>
            {gameState.currentIndex > 0 && (
              <Text style={styles.operationSymbol}>
                {gameState.operation}
              </Text>
            )}
          </Animated.View>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetGame}
          activeOpacity={0.7}
        >
          <RotateCcw size={20} color="#6B7280" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (gameState.showResult) {
    mainContent = (
      <View style={[styles.container, styles.resultContainer]}>
        <Text style={[styles.operationTitle, { color: getCurrentOperationColor() }]}>
          Round {gameState.currentRound} of {gameState.totalRounds}
        </Text>

        <View style={[
          styles.resultIcon,
          { backgroundColor: gameState.isCorrect ? '#DCFCE7' : '#FEE2E2' }
        ]}>
          {gameState.isCorrect ? (
            <Check size={60} color="#059669" />
          ) : (
            <AlertCircle size={60} color="#DC2626" />
          )}
        </View>

        <Text style={[
          styles.resultText,
          { color: gameState.isCorrect ? '#059669' : '#DC2626' }
        ]}>
          {gameState.isCorrect ? 'Correct!' : 'Wrong!'}
        </Text>

        <Text style={styles.correctAnswerText}>
          Correct answer: {gameState.correctAnswer}
        </Text>

        {gameState.currentRound < settings.totalQuestions ? (
          <Text style={styles.nextRoundText}>
            Next round starting...
          </Text>
        ) : (
          <Text style={styles.nextRoundText}>
            Game completed! Final score: {gameState.score}/{gameState.totalGames}
          </Text>
        )}
      </View>
    );
  } else if (gameState.showAnswer) {
    mainContent = (
      <View style={[styles.container, styles.answerContainer]}>
        <Text style={[styles.operationTitle, { color: getCurrentOperationColor() }]}>
          What's your answer?
        </Text>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Enter the result of the calculation you just saw
          </Text>
        </View>

        <View style={styles.answerInputContainer}>
          <TextInput
            style={[styles.answerInput, { borderColor: getCurrentOperationColor() }]}
            value={gameState.userAnswer}
            onChangeText={(text) => setGameState(prev => ({ ...prev, userAnswer: text }))}
            placeholder="Enter your answer"
            keyboardType="numeric"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submitAnswer}
          />
          
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: getCurrentOperationColor() }]}
            onPress={submitAnswer}
            disabled={!gameState.userAnswer.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetGame}
          activeOpacity={0.7}
        >
          <RotateCcw size={20} color="#6B7280" />
          <Text style={styles.resetText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    mainContent = null;
  }

  return (
    <>
      {mainContent}
      
      <Modal
        visible={modalState.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Total Questions</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setTempSettings(prev => ({ 
                    ...prev, 
                    totalQuestions: Math.max(3, prev.totalQuestions - 1) 
                  }))}
                >
                  <Text style={styles.controlButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.settingValue}>{tempSettings.totalQuestions}</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setTempSettings(prev => ({ 
                    ...prev, 
                    totalQuestions: Math.min(10, prev.totalQuestions + 1) 
                  }))}
                >
                  <Text style={styles.controlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Time Interval (seconds)</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setTempSettings(prev => ({ 
                    ...prev, 
                    timeInterval: Math.max(500, prev.timeInterval - 500) 
                  }))}
                >
                  <Text style={styles.controlButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.settingValue}>{tempSettings.timeInterval / 1000}s</Text>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setTempSettings(prev => ({ 
                    ...prev, 
                    timeInterval: Math.min(3000, prev.timeInterval + 500) 
                  }))}
                >
                  <Text style={styles.controlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={applySettings}
              >
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  operationButton: {
    width: (width - 56) / 2,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  operationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  gameContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  operationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  numberDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberContainer: {
    alignItems: 'center',
  },
  currentNumber: {
    fontSize: 120,
    fontWeight: 'bold',
  },
  operationSymbol: {
    fontSize: 40,
    color: '#6B7280',
    marginTop: 10,
  },
  answerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  equationDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  answerInputContainer: {
    width: '100%',
    gap: 16,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  correctAnswerText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  nextRoundText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});