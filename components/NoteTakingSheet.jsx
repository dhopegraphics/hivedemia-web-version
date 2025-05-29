import { useNotesStore } from "@/backend/store/notesStore";
import NoteEditor from "@/components/NotesUploads/NoteEditor";
import QuickActionsTab from "@/components/NotesUploads/QuickActionsTab";
import ReferencesTab from "@/components/NotesUploads/ReferencesTab";
import RevisionTab from "@/components/NotesUploads/RevisionTab";
import SavedNotesList from "@/components/NotesUploads/SavedNotesList";
import TabNavigation from "@/components/NotesUploads/TabNavigation";
import { colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const NoteTakingSheet = React.forwardRef(({ fileId, courseId }, ref) => {
  NoteTakingSheet.displayName = "NoteTakingSheet";
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const snapPoints = useMemo(() => ["15%", "50%", "85%", "100%"], []);
  const [activeTab, setActiveTab] = useState("notes");
  const [newReference, setNewReference] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);

  const tabs = [
    { key: "notes", icon: "create-outline", label: "Notes" },
    { key: "references", icon: "link-outline", label: "References" },
    { key: "revisions", icon: "school-outline", label: "Revision" },
    { key: "actions", icon: "flash-outline", label: "Quick Actions" },
    { key: "savednotes", icon: "clipboard-outline", label: "Saved Notes" },
  ];

  useEffect(() => {
    useNotesStore.getState().initNotesTable();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      const notes = await useNotesStore.getState().loadNotes(fileId, courseId);
      setSavedNotes(notes);

      if (notes.length > 0) {
        setReferences([]);
        setRevisionQuestions([]);
        setAttachments([]);
        setNoteContent("");
        setCurrentNoteId(null);
      }
    };
    fetchNotes();
  }, [fileId, courseId , setReferences, setRevisionQuestions, setAttachments, setNoteContent, setCurrentNoteId]);

  const {
    noteContent,
    references,
    revisionQuestions,
    attachments,
    setNoteContent,
    setReferences,
    setRevisionQuestions,
    setAttachments,
    currentNoteId,
    setCurrentNoteId,
    saveNote,
  } = useNotesStore();

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: isDark ? colors.dark : colors.light }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.offwhite : colors.dark,
      }}
    >
      <BottomSheetView className="flex-1">
        {/* Tab Bar */}
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDark={isDark}
        />

        {/* Content Area */}
        <View style={{ height: 600 }} className=" p-4">
          {/* Notes Tab */}
          {activeTab === "notes" && (
            <NoteEditor
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              attachments={attachments}
              isDark={isDark}
              currentNoteId={currentNoteId}
            />
          )}

          {/* References Tab */}
          {activeTab === "references" && (
            <ReferencesTab
              references={references}
              newReference={newReference}
              setNewReference={setNewReference}
              isDark={isDark}
            />
          )}

          {/* Revision Tab */}
          {activeTab === "revisions" && (
            <RevisionTab
              revisionQuestions={revisionQuestions}
              newQuestion={newQuestion}
              setNewQuestion={setNewQuestion}
              isDark={isDark}
            />
          )}

          {/* Quick Actions Tab */}
          {activeTab === "actions" && (
            <QuickActionsTab
              isDark={isDark}
              savedNotes={savedNotes}
              saveNote={saveNote}
            />
          )}

          {/* Saved Notes Tab */}
          {activeTab === "savednotes" && (
            <SavedNotesList
              savedNotes={savedNotes}
              isDark={isDark}
              setNoteContent={setNoteContent}
              setReferences={setReferences}
              setRevisionQuestions={setRevisionQuestions}
              setAttachments={setAttachments}
              setSavedNotes={setSavedNotes}
              fileId={fileId}
              courseId={courseId}
              setCurrentNoteId={setCurrentNoteId}
            />
          )}
        </View>
        <TouchableOpacity
          onPress={async () => {
            await saveNote(fileId, courseId);
            const updatedNotes = await useNotesStore
              .getState()
              .loadNotes(fileId, courseId);
            setSavedNotes(updatedNotes);
          }}
          className=" bottom-20 right-10 flex-row bg-primary-200 shadow-primary-100  shadow-md px-6 py-2 rounded-xl absolute items-center"
        >
          <Feather name="save" size={18} color={colors.primary} />
          <Text className="text-xs ml-3 dark:text-primary-100">Save Note</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

export default NoteTakingSheet;
