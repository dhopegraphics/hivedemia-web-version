import { supabase } from "@/backend/supabase";

/**
 * Handles user signup and profile creation with enhanced error recovery
 */
export const signUpWithProfile = async (
  email,
  password,
  fullName,
  username
) => {
  let authUser = null;

  try {
    // Input validation
    const validationResult = validateSignupInput(
      email,
      password,
      fullName,
      username
    );
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      throw new Error(getLocalizedAuthError(authError.message));
    }

    if (!authData?.user) {
      throw new Error("Account creation failed. Please try again.");
    }

    authUser = authData.user;
    const userId = authUser.id;

    // 2. Create profile with retry mechanism
    const profileResult = await createProfileWithRetry(userId, {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
    });

    if (!profileResult.success) {
      // If profile creation fails, attempt to clean up auth user
      await cleanupOrphanedAuthUser(userId);
      throw new Error(profileResult.error);
    }

    return { user: authUser, error: null };
  } catch (error) {
    // Enhanced error logging for debugging
    console.error("Signup error:", {
      error: error.message,
      userId: authUser?.id,
      email,
      username,
      timestamp: new Date().toISOString(),
    });

    return {
      user: null,
      error: error.message || "Account creation failed. Please try again.",
    };
  }
};

/**
 * Validates signup input with enhanced rules
 */
const validateSignupInput = (email, password, fullName, username) => {
  // Enhanced email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email?.trim())) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Enhanced username validation - must start with letter
  const usernameRegex = /^[a-z][a-z0-9_]*$/;
  if (!usernameRegex.test(username?.trim().toLowerCase())) {
    return {
      isValid: false,
      error:
        "Username must start with a letter and contain only lowercase letters, numbers, and underscores",
    };
  }

  // Name validation
  if (!fullName?.trim() || fullName.trim().length < 2) {
    return {
      isValid: false,
      error: "Please enter your full name (at least 2 characters)",
    };
  }

  // Password strength validation
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  // Additional password strength check
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      error:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    };
  }

  return { isValid: true };
};

/**
 * Creates profile with retry mechanism
 */
const createProfileWithRetry = async (userId, profileData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        ...profileData,
      });

      if (!error) {
        return { success: true };
      }

      // Check for specific constraint violations
      if (error.code === "23505") {
        if (error.message.includes("username")) {
          return {
            success: false,
            error: "This username is already taken. Please choose another.",
          };
        }
        if (error.message.includes("email")) {
          return {
            success: false,
            error: "An account with this email already exists.",
          };
        }
      }

      // If it's the last attempt, return the error
      if (attempt === maxRetries) {
        return {
          success: false,
          error: "Failed to create profile. Please try again.",
        };
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    } catch (_error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: "Profile creation failed. Please try again.",
        };
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};

/**
 * Attempts to clean up orphaned auth users
 */
const cleanupOrphanedAuthUser = async (userId) => {
  try {
    // Note: Supabase doesn't allow direct deletion of auth users from client
    // This would need to be handled by a server-side function or webhook
    console.warn(
      `Orphaned auth user detected: ${userId}. Manual cleanup may be required.`
    );

    // Instead, we could mark this in a cleanup table for batch processing
    await supabase
      .from("orphaned_users")
      .insert({ user_id: userId, created_at: new Date().toISOString() })
      .catch(() => {}); // Fail silently if table doesn't exist
  } catch (error) {
    console.error("Failed to queue orphaned user cleanup:", error);
  }
};

/**
 * Provides localized error messages
 */
const getLocalizedAuthError = (errorMessage) => {
  const errorMap = {
    "User already registered":
      "An account with this email already exists. Please sign in instead.",
    "Invalid email": "Please enter a valid email address.",
    "Password should be at least 6 characters":
      "Password must be at least 8 characters long.",
    "Email not confirmed":
      "Please check your email and click the verification link.",
    "Signup not allowed for this email":
      "Signup is currently restricted. Please contact support.",
  };

  return (
    errorMap[errorMessage] ||
    "Account creation failed. Please check your information and try again."
  );
};

export const resendVerificationEmail = async (email) => {
  try {
    if (!email || typeof email !== "string") {
      throw new Error("Valid email address is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Please provide a valid email address");
    }

    // Use Supabase's resend method to send verification email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    if (error) {
      throw new Error(error.message || "Failed to resend verification email");
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Unknown error occurred" };
  }
};

/**
 * Enhanced username availability check with caching
 */
let usernameCheckCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export const checkUsernameAvailability = async (username) => {
  try {
    if (!username || typeof username !== "string") {
      throw new Error("Username is required");
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Enhanced validation
    const usernameRegex = /^[a-z][a-z0-9_]*$/;
    if (!usernameRegex.test(normalizedUsername)) {
      throw new Error(
        "Username must start with a letter and contain only lowercase letters, numbers, and underscores"
      );
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }

    // Check cache first
    const cacheKey = normalizedUsername;
    const cached = usernameCheckCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { available: cached.available, error: null };
    }

    // Check database
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .ilike("username", normalizedUsername)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        "Unable to check username availability. Please try again."
      );
    }

    const available = !data;

    // Cache result
    usernameCheckCache.set(cacheKey, {
      available,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (usernameCheckCache.size > 100) {
      const cutoff = Date.now() - CACHE_DURATION;
      for (const [key, value] of usernameCheckCache.entries()) {
        if (value.timestamp < cutoff) {
          usernameCheckCache.delete(key);
        }
      }
    }

    return { available, error: null };
  } catch (error) {
    return {
      available: false,
      error: error.message || "Unable to check username availability",
    };
  }
};
