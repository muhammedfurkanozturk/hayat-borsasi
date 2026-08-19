import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Web'deki TrendUpIcon glifinin (24x24 viewBox) 8.33x büyütülmüş hali —
// aynı marka çizgisi, splash için büyük ve üç aşamalı çizilebilir noktalarla.
const P0 = { x: 25, y: 142 };
const P1 = { x: 79, y: 87.5 };
const P2 = { x: 117, y: 125 };
const P3 = { x: 175, y: 58 };

const dist = (a: typeof P0, b: typeof P0) => Math.hypot(b.x - a.x, b.y - a.y);

const SEG1_LEN = dist(P0, P1);
const SEG2_LEN = dist(P1, P2);
const SEG3_LEN = dist(P2, P3);
const TOTAL_LEN = SEG1_LEN + SEG2_LEN + SEG3_LEN;

const MAIN_PATH = `M${P0.x} ${P0.y} L${P1.x} ${P1.y} L${P2.x} ${P2.y} L${P3.x} ${P3.y}`;
const ARROW_PATH = `M125 58 L175 58 L175 108`;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function IntroAnimation({ onFinish }: { onFinish: () => void }) {
  const theme = useTheme();
  const offset = useSharedValue(TOTAL_LEN);
  const arrowOpacity = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(8);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    offset.value = withSequence(
      withTiming(TOTAL_LEN - SEG1_LEN, { duration: 380, easing: EASE }),
      withDelay(150, withTiming(TOTAL_LEN - SEG1_LEN - SEG2_LEN, { duration: 320, easing: EASE })),
      withDelay(150, withTiming(0, { duration: 420, easing: EASE }))
    );

    arrowOpacity.value = withDelay(380 + 150 + 320 + 150 + 420, withTiming(1, { duration: 180 }));

    wordmarkOpacity.value = withDelay(380 + 150 + 320 + 150 + 420 + 250, withTiming(1, { duration: 380 }));
    wordmarkY.value = withDelay(380 + 150 + 320 + 150 + 420 + 250, withTiming(0, { duration: 380, easing: EASE }));

    containerOpacity.value = withDelay(
      380 + 150 + 320 + 150 + 420 + 250 + 380 + 550,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pathAnimatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({ opacity: arrowOpacity.value }));
  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));
  const containerAnimatedStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background }, containerAnimatedStyle]}>
      <View style={styles.graphic}>
        <Svg width={140} height={140} viewBox="0 0 200 200">
          <AnimatedPath
            d={MAIN_PATH}
            stroke={theme.accent}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={TOTAL_LEN}
            animatedProps={pathAnimatedProps}
          />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, arrowAnimatedStyle]}>
          <Svg width={140} height={140} viewBox="0 0 200 200">
            <Path
              d={ARROW_PATH}
              stroke={theme.accent}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </View>

      <Animated.View style={wordmarkAnimatedStyle}>
        <ThemedText style={styles.wordmark}>Hayat Borsası</ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    zIndex: 100,
  },
  graphic: { width: 140, height: 140 },
  wordmark: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
});
