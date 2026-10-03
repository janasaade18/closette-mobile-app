import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import OnboardingHeader from '../../../onboarding/components/OnboardingHeader';
import { useOnboarding } from '../../../onboarding/OnboardingContext';

interface ConfirmationScreenProps {
  onContinue: () => void;
  onEdit: (step: number) => void;
}

export default function ConfirmationScreen({
  onContinue,
  onEdit,
}: ConfirmationScreenProps) {
  const { preferences } = useOnboarding();

  const renderList = (items: string[]) => {
    if (items.length === 0) {
      return 'Not selected';
    }

    return items.join(', ');
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        step={4}
        title="Your preferences"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* About You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              About you
            </Text>

            <TouchableOpacity onPress={() => onEdit(1)}>
              <Text style={styles.editText}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Name
            </Text>

            <Text style={styles.value}>
              {preferences.name || 'Not provided'}
            </Text>

            <Text style={styles.label}>
              Age range
            </Text>

            <Text style={styles.value}>
              {preferences.ageRange || 'Not selected'}
            </Text>

            <Text style={styles.label}>
              Gender
            </Text>

            <Text style={styles.value}>
              {preferences.gender || 'Not selected'}
            </Text>

            <Text style={styles.label}>
              Location
            </Text>

            <Text style={styles.value}>
              {preferences.location || 'Not provided'}
            </Text>

            <Text style={styles.label}>
              Measuring units
            </Text>

            <Text style={styles.value}>
              {preferences.preferredUnits || 'Not selected'}
            </Text>
          </View>
        </View>

        {/* Style Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Style
            </Text>

            <TouchableOpacity onPress={() => onEdit(2)}>
              <Text style={styles.editText}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Preferred styles
            </Text>

            <Text style={styles.value}>
              {renderList(preferences.preferredStyles)}
            </Text>

            <Text style={styles.label}>
              Favorite colors
            </Text>

            <Text style={styles.value}>
              {renderList(preferences.preferredColors)}
            </Text>
          </View>
        </View>

        {/* Occasions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Occasions
            </Text>

            <TouchableOpacity onPress={() => onEdit(3)}>
              <Text style={styles.editText}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.value}>
              {renderList(
                preferences.commonOccasions
              )}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          Continue to Closette
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 54,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: 24,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
  },

  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },

  card: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
    padding: 16,
  },

  label: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 4,
    marginTop: 8,
  },

  value: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222222',
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});