import { colors } from "@/constants/Colors";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AboutScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const openWebsite = () => Linking.openURL("https://hivedemia.com");
  const openPrivacyPolicy = () =>
    Linking.openURL("https://hivedemia.com/privacy");
  const openTerms = () => Linking.openURL("https://hivedemia.com/terms");
  const openGithub = () => Linking.openURL("https://github.com/hivedemia");
  const openTwitter = () => Linking.openURL("https://twitter.com/hivedemia");
  const openInstagram = () =>
    Linking.openURL("https://instagram.com/hivedemia");

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark : colors.light },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.primaryDark : colors.primary },
        ]}
      >
        <Ionicons
          name="school"
          size={48}
          color={colors.white}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Hivedemia</Text>
        <Text style={styles.headerSubtitle}>Your Learning Companion</Text>
        <Text style={styles.versionText}>Version 1.2.0</Text>
      </View>

      {/* Mission Section */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.darkLight : colors.white },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Our Mission
        </Text>
        <Text
          style={[
            styles.sectionText,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Hivedemia empowers students to take control of their learning journey
          by providing intuitive tools for organization, collaboration, and
          knowledge retention.
        </Text>
      </View>

      {/* Features Section */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.darkLight : colors.white },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Key Features
        </Text>

        <View style={styles.featureItem}>
          <MaterialIcons
            name="collections-bookmark"
            size={20}
            color={colors.primary}
            style={styles.featureIcon}
          />
          <Text
            style={[
              styles.featureText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Organized course management
          </Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcons
            name="group"
            size={20}
            color={colors.primary}
            style={styles.featureIcon}
          />
          <Text
            style={[
              styles.featureText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Collaborative study groups
          </Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcons
            name="auto-awesome"
            size={20}
            color={colors.primary}
            style={styles.featureIcon}
          />
          <Text
            style={[
              styles.featureText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Smart flashcards and quizzes
          </Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcons
            name="notifications"
            size={20}
            color={colors.primary}
            style={styles.featureIcon}
          />
          <Text
            style={[
              styles.featureText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Deadline reminders
          </Text>
        </View>
      </View>

      {/* Team Section */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.darkLight : colors.white },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          The Team
        </Text>
        <Text
          style={[
            styles.sectionText,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Hivedemia is developed by a passionate team of educators, designers,
          and engineers committed to improving student success.
        </Text>

        <TouchableOpacity style={styles.linkButton} onPress={openWebsite}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Meet the team
          </Text>
          <MaterialIcons name="open-in-new" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Legal Section */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.darkLight : colors.white },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Legal
        </Text>

        <TouchableOpacity
          style={[
            styles.legalItem,
            styles.legalItemBorder,
            { borderColor: isDark ? colors.dark : colors.lightGray },
          ]}
          onPress={openPrivacyPolicy}
        >
          <Text
            style={[
              styles.legalText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Privacy Policy
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isDark ? colors.gray : colors.gray}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.legalItem} onPress={openTerms}>
          <Text
            style={[
              styles.legalText,
              { color: isDark ? colors.offwhite : colors.dark },
            ]}
          >
            Terms of Service
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isDark ? colors.gray : colors.gray}
          />
        </TouchableOpacity>
      </View>

      {/* Social Links */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.darkLight : colors.white },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? colors.offwhite : colors.dark },
          ]}
        >
          Connect With Us
        </Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={openTwitter}>
            <FontAwesome5
              name="twitter"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} onPress={openInstagram}>
            <FontAwesome5
              name="instagram"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} onPress={openGithub}>
            <FontAwesome5
              name="github"
              size={20}
              color={isDark ? colors.offwhite : colors.dark}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            { color: isDark ? colors.gray : colors.gray },
          ]}
        >
          © {new Date().getFullYear()} Hivedemia Inc. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
   boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  legalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  legalItemBorder: {
    borderBottomWidth: 1,
  },
  legalText: {
    fontSize: 14,
    flex: 1,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    backgroundColor: "transparent",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default AboutScreen;
