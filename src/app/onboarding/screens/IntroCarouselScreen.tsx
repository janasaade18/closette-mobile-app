import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '../../../constants/theme';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';

interface IntroCarouselScreenProps {
  onDone: () => void;
  onBack: () => void;
}

const slides = [
  {
    title: 'Snap it. We sort it.',
    body: 'Photograph any piece and Closette tags its type, colour and vibe for you.',
    action: 'Next',
  },
  {
    title: 'Outfits that read the sky',
    body: "Muse mixes your own clothes with today's weather and your plans.",
    action: 'Next',
  },
  {
    title: 'Try it on, for real',
    body: "See pieces on your body in AR, then make the app's colours yours.",
    action: "Let's go",
  },
];

export default function IntroCarouselScreen({
  onDone,
  onBack,
}: IntroCarouselScreenProps) {
  const [page, setPage] = useState(0);
  const slide = slides[page];

  const goBack = () => {
    if (page === 0) {
      onBack();
      return;
    }
    setPage((current) => current - 1);
  };

  const goNext = () => {
    if (page === slides.length - 1) {
      onDone();
      return;
    }
    setPage((current) => current + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backSlot}>
          {page > 0 ? <Text style={styles.backIcon}>‹</Text> : null}
        </Pressable>
        <Pressable onPress={onDone} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.art}>
        {page === 0 ? <SnapArt /> : null}
        {page === 1 ? <WeatherArt /> : null}
        {page === 2 ? <TryOnArt /> : null}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {slides.map((_, index) => (
          <View
            key={slides[index].title}
            style={[styles.dot, index === page && styles.dotActive]}
          />
        ))}
      </View>

      <PrimaryButton title={slide.action} onPress={goNext} />
    </View>
  );
}

function Chip({ label, tone }: { label: string; tone: 'light' | 'navy' | 'sand' }) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'navy' && styles.chipNavy,
        tone === 'sand' && styles.chipSand,
      ]}>
      <Text style={[styles.chipText, tone === 'navy' && styles.chipTextLight]}>
        {label}
      </Text>
    </View>
  );
}

function SnapArt() {
  return (
    <View style={styles.stage}>
      <View style={[styles.wash, styles.washRight]} />
      <View style={styles.chipTopFloat}>
        <Chip label="Top" tone="light" />
      </View>
      <View style={styles.circle}>
        <View style={styles.shirt} />
      </View>
      <View style={styles.chipNavyFloat}>
        <Chip label="Navy" tone="navy" />
      </View>
      <View style={styles.chipSandFloat}>
        <Chip label="Casual" tone="sand" />
      </View>
    </View>
  );
}

function WeatherArt() {
  return (
    <View style={styles.stage}>
      <View style={[styles.wash, styles.washTop]} />
      <View style={styles.weatherChip}>
        <Chip label="18° · Rainy" tone="navy" />
      </View>
      <View style={styles.swatches}>
        <View style={[styles.swatch, { backgroundColor: Colors.light.primary }]} />
        <View style={[styles.swatch, { backgroundColor: Colors.light.slate }]} />
        <View style={[styles.swatch, { backgroundColor: Colors.light.sand }]} />
      </View>
    </View>
  );
}

function TryOnArt() {
  return (
    <View style={styles.stage}>
      <View style={styles.circle}>
        <View style={styles.person}>
          <View style={styles.head} />
          <View style={styles.bodyShape} />
        </View>
      </View>
      <View style={styles.tryChip}>
        <Chip label="Try it on" tone="light" />
      </View>
      <View style={styles.palette}>
        {[
          Colors.light.primary,
          Colors.light.slate,
          Colors.light.sand,
          Colors.light.bubble,
        ].map((color) => (
          <View
            key={color}
            style={[
              styles.mini,
              { backgroundColor: color },
              color === Colors.light.primary && styles.miniSelected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 12,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backSlot: {
    width: 28,
    height: 28,
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: Colors.light.primary,
    fontFamily: Typeface.displayMedium,
  },
  skip: {
    fontSize: 15,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    position: 'absolute',
    backgroundColor: Colors.light.bubble,
    borderRadius: 999,
  },
  washRight: {
    width: 220,
    height: 220,
    right: -20,
    top: 10,
    opacity: 0.85,
  },
  washTop: {
    width: 230,
    height: 230,
    top: 0,
  },
  circle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: Colors.light.bubble,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shirt: {
    width: 72,
    height: 64,
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  chip: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipNavy: {
    backgroundColor: Colors.light.primary,
  },
  chipSand: {
    backgroundColor: Colors.light.sand,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.text,
  },
  chipTextLight: {
    color: Colors.light.onPrimary,
  },
  chipTopFloat: {
    position: 'absolute',
    top: 36,
    left: 36,
    zIndex: 2,
  },
  chipNavyFloat: {
    position: 'absolute',
    top: 54,
    right: 18,
  },
  chipSandFloat: {
    position: 'absolute',
    bottom: 58,
    left: 28,
  },
  weatherChip: {
    position: 'absolute',
    top: 48,
  },
  swatches: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 36,
  },
  swatch: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  person: {
    alignItems: 'center',
  },
  head: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Colors.light.primary,
    marginBottom: 4,
  },
  bodyShape: {
    width: 46,
    height: 52,
    borderWidth: 2.5,
    borderColor: Colors.light.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tryChip: {
    position: 'absolute',
    top: 42,
    right: 24,
  },
  palette: {
    position: 'absolute',
    bottom: 36,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mini: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  miniSelected: {
    borderWidth: 2,
    borderColor: Colors.light.onPrimary,
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 22,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.bubble,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.light.primary,
  },
});
