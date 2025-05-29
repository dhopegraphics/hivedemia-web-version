import * as SQLite from 'expo-sqlite';

export const coursesDb = SQLite.openDatabaseSync('courses.db');

export const notesTakenDb = SQLite.openDatabaseSync('notes.db');

export const plannerDb = SQLite.openDatabaseSync('planner.db');

export const smartHiveDb = SQLite.openDatabaseSync('smartHiveChat.db');

export const smartHiveSnapToSolveDb = SQLite.openDatabaseSync('smartHiveSnapToSolve.db');
export const groupsDb = SQLite.openDatabaseSync('groups.db');

export const quizzesDb = SQLite.openDatabaseSync('quizzes.db');

export const examsDb = SQLite.openDatabaseSync('examsHub.db');

export const competitionsDb = SQLite.openDatabaseSync('competition.db');