import { supabase } from "@/backend/supabase";
import { Competition, CompetitionState } from "@/constants/CompetitionTypes";
import { sendMessageToCohere } from "@/hooks/AiModelHooks/cohereApi";
import { create } from "zustand";

function sanitizeJsonString(str: string): string {
  // Remove any unexpected characters before/after JSON
  let cleanStr = str.trim();

  // Handle escaped characters properly
  cleanStr = cleanStr
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\{/g, "{")
    .replace(/\\}/g, "}")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]");

  // Fix common LaTeX escapes
  cleanStr = cleanStr.replace(/\\\\/g, "\\");

  return cleanStr;
}

function extractJsonFromResponse(text: string): string {
  try {
    // First try to find JSON between code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return sanitizeJsonString(codeBlockMatch[1]);
    }

    // If no code blocks, try to find JSON-like structure
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return sanitizeJsonString(jsonMatch[0]);
    }

    throw new Error("No JSON structure found in response");
  } catch (error) {
    console.error("JSON extraction failed:", error);
    throw new Error("Failed to extract JSON from AI response");
  }
}

export const useCompetitionStore = create<CompetitionState>((set, get) => ({
  competitions: [],
  currentCompetition: null,
  competitionTopics: [],
  competitionQuestions: [],
  questionAnswers: [],
  competitionParticipants: [],
  participantAnswers: [],
  availableUsers: [],
  allFetchedUsers: [],
  extractedTopics: [],
  isLoading: false,
  error: null,
  subscription: null,
  questionAnswersByQuestionId: {},
  lastFetchedAt: null,
  isFetchingPublic: false,
  isFetchingPrivate: false,

  createCompetition: async (competitionData) => {
    try {
      set({ isLoading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First create the competition
      const { data: competition, error: compError } = await supabase
        .from("competitions")
        .insert({
          title: competitionData.title,
          subject: competitionData.subject,
          question_count: competitionData.questionCount,
          time_per_question: competitionData.timePerQuestion,
          max_participants: competitionData.maxParticipants,
          difficulty: competitionData.difficulty,
          is_private: competitionData.isPrivate,
          allow_mid_join: competitionData.allowMidJoin,
          show_leaderboard: competitionData.showLeaderboard,
          duration: competitionData.duration,
          created_by: user.id,
          status: "waiting",
        })
        .select()
        .single();

      if (compError) throw compError;

      // Add topics
      if (competitionData.topics.length > 0) {
        const { error: topicsError } = await supabase
          .from("competition_topics")
          .insert(
            competitionData.topics.map((topicId) => ({
              competition_id: competition.id,
              topic_id: topicId,
            }))
          );

        if (topicsError) throw topicsError;
      }

      // Generate and save questions with answers
      const questions = await get().generateCompetitionQuestions({
        title: competitionData.title,
        subject: competitionData.subject,
        topics: competitionData.topics
          .map(
            (id) => get().extractedTopics.find((t) => t.id === id)?.name || ""
          )
          .filter(Boolean),
        questionCount: competitionData.questionCount,
        difficulty: competitionData.difficulty,
      });

      // Save questions and their answers in a transaction
      const { error: questionsError } = await supabase.rpc(
        "create_competition_questions",
        {
          competition_id: competition.id,
          questions_data: questions.map((q) => ({
            question_text: q.question,
            topic_id: q.topicId || null,
            answers: q.options.map((opt: string, idx: number) => ({
              answer_text: opt,
              is_correct: opt === q.correctAnswer,
            })),
          })),
        }
      );

      if (questionsError) throw questionsError;

      // Add participants (creator + invited users)
      const participants = [
        {
          user_id: user.id,
          is_invited: false,
          has_joined: true,
          competition_id: competition.id,
        },
      ];

      if (competitionData.isPrivate && competitionData.invitedUsers) {
        competitionData.invitedUsers.forEach((userId) => {
          participants.push({
            user_id: userId,
            is_invited: true,
            has_joined: false,
            competition_id: competition.id,
          });
        });
      }

      const { error: participantsError } = await supabase
        .from("competition_participants")
        .insert(participants);

      if (participantsError) throw participantsError;

      return competition.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAvailableUsers: async (searchQuery = "") => {
    try {
      set({ isLoading: true, error: null });

      // If searchQuery is empty, return empty or default users instead of all users
      if (!searchQuery.trim()) {
        set({ availableUsers: [] }); // or fetch some default users you want here
        return;
      }

      const { data: filteredUsers, error: filteredError } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .ilike("username", `%${searchQuery}%`)
        .limit(20);

      if (filteredError) throw filteredError;

      set({ availableUsers: filteredUsers || [] });

      // 2. Only fetch all users once to populate `allFetchedUsers` (not affected by searchQuery)
      const state = get();
      if (state.allFetchedUsers.length === 0) {
        const { data: allUsers, error: allError } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .limit(20); // adjust as needed

        if (allError) throw allError;

        set({ allFetchedUsers: allUsers || [] });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  updateParticipantStatus: async ({
    participantId, // Only this is needed for the .eq() filter
    hasJoined,
    completed,
    score,
  }) => {
    try {
      set({ isLoading: true, error: null });

      const updateData: {
        has_joined?: boolean;
        joined_at?: string | null;
        completed?: boolean;
        completed_at?: string | null;
        score?: number;
      } = {};

      // Only set fields that are explicitly provided
      if (hasJoined !== undefined) {
        updateData.has_joined = hasJoined;
        updateData.joined_at = hasJoined ? new Date().toISOString() : null;
      }

      if (completed !== undefined) {
        updateData.completed = completed;
        updateData.completed_at = completed ? new Date().toISOString() : null;
      }

      if (score !== undefined) {
        updateData.score = score;
      }

      // Debug log
      console.log("[DEBUG] Updating participant:", {
        participantId,
        updateData,
      });

      // Skip if no fields to update
      if (Object.keys(updateData).length === 0) {
        console.warn("No fields to update");
        return;
      }

      // Execute update
      const { error } = await supabase
        .from("competition_participants")
        .update(updateData)
        .eq("id", participantId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        competitionParticipants: state.competitionParticipants.map((p) =>
          p.id === participantId ? { ...p, ...updateData } : p
        ),
      }));
    } catch (error) {
      console.error("[ERROR] Failed to update participant:", error);
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error; // Re-throw for calling code to handle
    } finally {
      set({ isLoading: false });
    }
  },
  ensureParticipantJoined: async (userId, competitionId) => {
    try {
      set({ isLoading: true, error: null });

      // First try to find existing participant
      const { data: existingParticipant, error: findError } = await supabase
        .from("competition_participants")
        .select("*")
        .eq("user_id", userId)
        .eq("competition_id", competitionId)
        .maybeSingle(); // Use maybeSingle instead of single

      if (findError) throw findError;

      let participantId: number;

      if (!existingParticipant) {
        // If participant doesn't exist, create a new one
        const { data: newParticipant, error: createError } = await supabase
          .from("competition_participants")
          .insert({
            user_id: userId,
            competition_id: competitionId,
            has_joined: true,
            is_invited: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        participantId = newParticipant.id;
      } else {
        // If participant exists, update if needed
        participantId = existingParticipant.id;
        if (!existingParticipant.has_joined) {
          await get().updateParticipantStatus({
            participantId: existingParticipant.id,
            hasJoined: true,
            userId,
            competitionId,
          });
        }
      }

      return participantId;
    } catch (error) {
      console.error("Failed to ensure participant joined:", error);
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getCompetitionDetails: async (competitionId) => {
    try {
      set({ isLoading: true, error: null });

      const { data: questions, error: questionsError } = await supabase
        .from("competition_questions")
        .select("*")
        .eq("competition_id", competitionId);

      if (questionsError) throw questionsError;

      const { data: questionAnswers, error: answersError } = await supabase
        .from("question_answers")
        .select("*")
        .in(
          "question_id",
          questions.map((q) => q.id)
        );

      if (answersError) throw answersError;

      // Get competition
      const { data: competition, error: compError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", competitionId)
        .single();

      if (compError) throw compError;

      // Get topics
      const { data: topics, error: topicsError } = await supabase
        .from("competition_topics")
        .select("topic_id, extracted_topics(name)")
        .eq("competition_id", competitionId);

      if (topicsError) throw topicsError;

      const { data: extractedTopics, error: extractedError } = await supabase
        .from("extracted_topics")
        .select("id, name")
        .in(
          "id",
          topics.map((t) => t.topic_id)
        );

      if (extractedError) throw extractedError;

      // Combine the data
      const topicsWithNames = topics.map((topic) => ({
        ...topic,
        name:
          extractedTopics.find((t) => t.id === topic.topic_id)?.name || null,
      }));

      // Enhanced participants query with explicit field selection
      const { data: participants, error: participantsError } = await supabase
        .from("competition_participants")
        .select(
          `
        id, 
        user_id, 
        is_invited, 
        has_joined, 
        joined_at, 
        score, 
        completed, 
        completed_at,
        profiles(username, full_name, avatar_url)
      `
        )
        .eq("competition_id", competitionId);

      if (participantsError || !participants)
        throw participantsError ?? new Error("No participants found");

      // Get participant answers for all participants regardless of competition status
      if (participants && participants.length > 0) {
        const { data: answers, error: answersError } = await supabase
          .from("participant_answers")
          .select("*")
          .in(
            "participant_id",
            participants.map((p) => p.id)
          );

        if (answersError) throw answersError;

        set({ participantAnswers: answers || [] });
      }

      // Get participant answers if competition is active or completed
      if (
        ["active", "completed"].includes(competition.status) &&
        participants
      ) {
        const { data: answers, error: answersError } = await supabase
          .from("participant_answers")
          .select("*")
          .in(
            "participant_id",
            participants.map((p) => p.id)
          );

        if (answersError) throw answersError;

        set({ participantAnswers: answers });
      }

      set({
        currentCompetition: competition,
        competitionTopics: topicsWithNames,
        competitionQuestions: questions,
        questionAnswers: questionAnswers || [],
        competitionParticipants: participants,
      });
      return competition;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  getMyCompetitions: async (userId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("competition_participants")
        .select(
          `
        competitions(*,
          competition_participants(*, profiles(*)),
          competition_questions(*)
        )
      `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        competitions: data.map((item) => item.competitions),
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  getMyIncompleteCompetitions: async (userId: any) => {
    try {
      set({ isLoading: true, error: null });

      const { data: incompleteComps, error } = await supabase
        .from("competition_participants")
        .select("competition_id, competitions(*)")
        .eq("user_id", userId)
        .eq("completed", false)
        .eq("has_joined", true);

      if (error) throw error;

      // Extract competitions
      const competitions: Competition[] = (incompleteComps || [])
        .map((entry: any) => entry.competitions)
        .filter(
          (comp: any): comp is Competition =>
            !!comp &&
            typeof comp.id === "number" &&
            typeof comp.title === "string"
        );
      set((prev) => ({
        competitions: [
          ...prev.competitions,
          ...competitions.filter(
            (c) => !prev.competitions.some((pc) => pc.id === c.id)
          ),
        ],
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  generateCompetitionQuestions: async (competitionData) => {
    try {
      set({ isLoading: true, error: null });

      // Construct the prompt for AI
      let prompt = `Generate a competition with these specifications:
- Title: ${competitionData.title}
- Subject: ${competitionData.subject}
- Topics: ${competitionData.topics.join(", ")}
- Number of questions: ${competitionData.questionCount}
- Difficulty: ${competitionData.difficulty}

You must Ensure all math expressions are written in plain text or LaTeX-safe JSON. Do NOT use Markdown math formatting like \\( or \\). Escape all backslashes.
IMPORTANT: Return ONLY a valid JSON object with this exact structure:
Format the response as JSON with this structure:

{
  "questions": [
    {
      "type": "question_type", // "mcq" or "trueFalse"
      "question": "question_text",
      "options": ["option1", "option2", ...], // for MCQ and true/false
      "correctAnswer": "correct_answer",
      "explanation": "explanation_text" // optional
    },
    ...
  ]
}

Rules:
1. All math expressions must be in plain text or LaTeX without extra escapes
2. Do not use markdown formatting
3. Return ONLY the JSON object, no additional text
4. Ensure all quotes and brackets are properly balanced
`;

      // Send to AI
      const aiResponse = await sendMessageToCohere([
        { role: "user", content: prompt },
      ]);

      // Parse AI response
      let questions = [];
      try {
        const jsonString = extractJsonFromResponse(aiResponse);
        if (!jsonString) throw new Error("Invalid competition format from AI");
        const parsed = JSON.parse(jsonString);
        questions = parsed.questions || [];

        // Convert options to array if they're stringified
        questions = questions.map((q: any) => ({
          ...q,
          options:
            typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
      } catch (e) {
        console.error("Failed to parse AI response", e, aiResponse);
        throw new Error("Invalid competition format from AI");
      }

      return questions;
    } catch (error) {
      set({ error: "Failed to generate competition questions" });
      console.error("Competition generation error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  submitAnswer: async ({ participantId, questionId, answerId, timeTaken }) => {
    try {
      set({ isLoading: true, error: null });

      // First get the answer to check if it's correct
      const { data: answer, error: answerError } = await supabase
        .from("question_answers")
        .select("is_correct")
        .eq("id", answerId)
        .eq("question_id", questionId)
        .single();

      if (answerError) throw answerError;

      // Submit the participant's answer
      const { error } = await supabase.from("participant_answers").upsert(
        {
          participant_id: participantId,
          question_id: questionId,
          answer_id: answerId,
          is_correct: answer.is_correct,
          time_taken: timeTaken,
        },
        {
          onConflict: "participant_id,question_id",
        }
      );

      if (error) throw error;

      // Update local state if needed
      set((state) => ({
        participantAnswers: [
          ...state.participantAnswers.filter(
            (a) =>
              !(
                a.participant_id === participantId &&
                a.question_id === questionId
              )
          ),
          {
            participant_id: participantId,
            question_id: questionId,
            answer_id: answerId,
            is_correct: answer.is_correct,
            time_taken: timeTaken,
            created_at: new Date().toISOString(),
          },
        ],
      }));

      return answer.is_correct;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExtractedTopics: async (coursefileId) => {
    try {
      set({ isLoading: true, error: null });

      let query = supabase
        .from("extracted_topics")
        .select("*")
        .order("name", { ascending: true });

      if (coursefileId) {
        query = query.eq("coursefile_id", coursefileId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ extractedTopics: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchQuestionAnswers: async (questionId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("question_answers")
        .select("*")
        .eq("question_id", questionId)
        .order("id", { ascending: true });

      if (error) throw error;

      set((state) => ({
        questionAnswersByQuestionId: {
          ...state.questionAnswersByQuestionId,
          [questionId]: data || [],
        },
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchAllQuestionAnswers: async (competitionId) => {
    try {
      set({ isLoading: true, error: null });

      // Get all question IDs for this competition
      const { data: questions, error: questionsError } = await supabase
        .from("competition_questions")
        .select("id")
        .eq("competition_id", competitionId);

      if (questionsError) throw questionsError;
      if (!questions || questions.length === 0) return;

      // Fetch answers in batches to avoid timeouts
      const BATCH_SIZE = 50;
      const questionIds = questions.map((q) => q.id);
      const answersByQuestionId: Record<number, any[]> = {};
      let allAnswers: any[] = [];

      for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
        const batch = questionIds.slice(i, i + BATCH_SIZE);

        const { data: answers, error: answersError } = await supabase
          .from("question_answers")
          .select("*")
          .in("question_id", batch);

        if (answersError) throw answersError;

        // Process the batch
        answers?.forEach((answer) => {
          if (!answersByQuestionId[answer.question_id]) {
            answersByQuestionId[answer.question_id] = [];
          }
          answersByQuestionId[answer.question_id].push(answer);
          allAnswers.push(answer);
        });
      }

      set({
        questionAnswersByQuestionId: answersByQuestionId,
        questionAnswers: allAnswers,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToCompetitionUpdates: (
    competitionId,
    onStatusChange?: (newStatus: string) => void
  ) => {
    // Clean up existing subscription if any
    get().cleanupSubscriptions();

    const subscription = supabase
      .channel(`competition:${competitionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competitions",
          filter: `id=eq.${competitionId}`,
        },
        (payload) => {
          const newCompetition = payload.new;
          set({ currentCompetition: newCompetition });
          if (
            onStatusChange &&
            typeof payload.new === "object" &&
            payload.new !== null &&
            "status" in payload.new &&
            (typeof payload.old !== "object" ||
              payload.old === null ||
              !("status" in payload.old) ||
              payload.new.status !== payload.old.status)
          ) {
            onStatusChange(payload.new.status);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competition_participants",
          filter: `competition_id=eq.${competitionId}`,
        },
        async () => {
          await get().getCompetitionDetails(competitionId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participant_answers",
          filter: `question_id=in.(${get()
            .competitionQuestions.map((q) => q.id)
            .join(",")})`,
        },
        (payload) => {
          const newAnswer = payload.new as {
            participant_id: number;
            question_id: number;
            answer_id: number;
            is_correct: boolean;
            time_taken: number;
            created_at?: string;
          };

          set((state) => ({
            participantAnswers: [
              ...state.participantAnswers.filter(
                (a) =>
                  !(
                    a.participant_id === newAnswer.participant_id &&
                    a.question_id === newAnswer.question_id
                  )
              ),
              newAnswer,
            ],
          }));
        }
      )
      .subscribe();

    set({ subscription });
  },
  fetchPublicCompetitions: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("competitions")
        .select(
          `
        *,
        competition_participants(*, profiles(*))
      `
        )
        .eq("is_private", false)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ competitions: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  updateCompetitionStatus: async (competitionId, status) => {
    try {
      set({ isLoading: true, error: null });

      const updateData: {
        status: string;
        started_at?: string;
      } = { status };

      if (status === "active") {
        updateData.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("competitions")
        .update(updateData)
        .eq("id", competitionId);

      if (error) throw error;

      // Update local state if this is the current competition
      if (get().currentCompetition?.id === competitionId) {
        set({
          currentCompetition: {
            ...get().currentCompetition,
            ...updateData,
          },
        });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvitedCompetitions: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("competition_participants")
        .select(
          `
          competition_id,
          is_invited,
          has_joined,
          competitions!inner (
            id,
            title,
            subject,
            question_count,
            duration,
            status,
            created_at,
            created_by,
            profiles!inner (
              username,
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("user_id", userId)
        .eq("is_invited", true)
        .eq("has_joined", false)
        .in("competitions.status", ["waiting", "active"]);

      if (error) throw error;

      // Transform the data to match the expected format
      const invitedCompetitions =
        data?.map((participant) => {
          const competition = participant.competitions as any;
          return {
            id: competition.id,
            title: competition.title,
            subject: competition.subject,
            duration: `${competition.duration} min`,
            questions: competition.question_count,
            status: competition.status,
            createdAt: competition.created_at,
            createdBy: competition.profiles,
          };
        }) || [];

      return invitedCompetitions;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  fetchCompetitionParticipants: async (competitionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from("competition_participants")
        .select(
          `
        *,
        profiles!inner (
          username,
          full_name,
          avatar_url
        )
      `
        )
        .eq("competition_id", competitionId);

      if (error) throw error;

      set({ competitionParticipants: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  cleanupSubscriptions: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
  },
}));
