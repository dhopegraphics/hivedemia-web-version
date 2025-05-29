import { useSuggestedTopicsStore } from "@/backend/store/useSuggestedTopicsStore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";

const ANIMATION_INTERVAL = 10000; // ms

const CountdownPlusSuggestedTopics = ({ colors, isDark, nextExam }) => {
  const { topics, loading, initTable, fetchTopics, generateAndStoreTopics } =
    useSuggestedTopicsStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading && topics.length > 2) {
      intervalRef.current = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setCurrentIndex((prev) => (prev + 2) % topics.length);
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });
      }, ANIMATION_INTERVAL);
      return () => clearInterval(intervalRef.current);
    } else {
      setCurrentIndex(0);
      clearInterval(intervalRef.current);
    }
  }, [topics, loading , fadeAnim]);

  useEffect(() => {
    const run = async () => {
      if (!nextExam?.id) return;
      await initTable();
      const existing = await fetchTopics(nextExam.id);
      if (!existing || existing.length === 0) {
        await generateAndStoreTopics(nextExam);
      }
    };
    run();
  }, [nextExam?.id , initTable, fetchTopics, generateAndStoreTopics , nextExam]);

  const calculateDaysLeft = () => {
    if (!nextExam?.date) return "--";
    const examDate = new Date(nextExam.date);
    const today = new Date();
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  // Get the two topics to show
  const animatedTopics =
    topics.length > 2
      ? [
          topics[currentIndex % topics.length],
          topics[(currentIndex + 1) % topics.length],
        ]
      : topics;

  return (
    <View
      style={{ backgroundColor: isDark ? colors.dark : colors.light }}
      className="px-6 mt-6 flex-row justify-between"
    >
      {/* Countdown */}
      <View
        className="rounded-2xl p-5 w-[48%] shadow-sm"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.light}`,
        }}
      >
        <Text
          className="mb-1"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          Next Exam
        </Text>
        <Text
          className="text-2xl font-bold"
          style={{ color: isDark ? colors.offwhite : colors.dark }}
        >
          {nextExam ? `${calculateDaysLeft()} day(s)` : "No exams"}
        </Text>
        <Text
          className="text-sm mt-2"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          {nextExam?.course ?? "Upcoming Exam"}
        </Text>
      </View>

      {/* Suggested Topics */}
      <View
        className="rounded-2xl p-5 w-[48%] shadow-sm"
        style={{
          backgroundColor: isDark
            ? `${colors.primaryDark}80`
            : `${colors.light}`,
        }}
      >
        <Text
          className="mb-2"
          style={{
            color: isDark ? `${colors.offwhite}80` : `${colors.dark}80`,
          }}
        >
          Suggested Topics
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {animatedTopics.map((topic, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.primary }}
                />
                <Text style={{ color: isDark ? colors.offwhite : colors.dark }}>
                  {topic}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}
        {topics.length > 2 && !loading && (
          <Text className="text-sm mt-1" style={{ color: colors.primary }}>
            +{topics.length - 2} more
          </Text>
        )}
      </View>
    </View>
  );
};

export default CountdownPlusSuggestedTopics;